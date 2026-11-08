import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { createHash } from "node:crypto";
import {
  generateWalkingRoute,
  generateRectangleRoute,
  generateRoundTripRoute,
  RouteGenerationError,
  RouteServiceError,
  type RouteResponse,
} from "../../services/orsService";
import {
  checkRouteGenerationRateLimit,
  RateLimitUnavailableError,
  type RateLimitDecision,
} from "@/app/utils/rateLimit";
import { notifyDiscord } from "@/app/utils/discordNotifications";
import {
  MAX_REQUESTED_ROUND_TRIP_DISTANCE_KM,
  isRequestedRoundTripDistanceTooLong,
} from "@/app/utils/routeCalculations";
import { type RoutePattern } from "@/app/utils/routePatterns";
import { distanceBetweenLonLat } from "@/app/utils/routeQuality";
import {
  getRouteRequestValidationError,
  type RouteGenerationRequestBody,
} from "@/app/utils/routeRequestValidation";
import { RequestDeduplicator } from "@/app/utils/requestDeduplicator";
import { initializeDatabase, saveRouteGenerationRun } from "@/lib/db";

interface RouteGenerationResult {
  route: RouteResponse;
  routeType: "rectangle" | "roundTrip";
  finalWaypoints?: [number, number][];
}

class RouteGenerationRateLimitError extends Error {
  constructor(public readonly decision: RateLimitDecision) {
    super("Route generation rate limit reached");
    this.name = "RouteGenerationRateLimitError";
  }
}

const GENERATION_CACHE_TTL_MS = 30_000;
const MAX_CACHED_GENERATIONS = 100;
const generationDeduplicator = new RequestDeduplicator<RouteGenerationResult>(
  GENERATION_CACHE_TTL_MS,
  MAX_CACHED_GENERATIONS,
);

function getGenerationKey(body: RouteGenerationRequestBody): string {
  const canonicalRequest = {
    regenerate: Boolean(body.regenerate),
    startLocation: body.startLocation,
    distance: body.distance,
    waypoints: body.waypoints,
    pattern: body.pattern ?? "all",
  };

  return createHash("sha256")
    .update(JSON.stringify(canonicalRequest))
    .digest("hex");
}

async function getOrGenerateRoute(
  key: string,
  clientIp: string,
  generate: () => Promise<RouteGenerationResult>,
): Promise<RouteGenerationResult> {
  return generationDeduplicator.run(key, async () => {
    const decision = await checkRouteGenerationRateLimit(clientIp);
    if (!decision.allowed) {
      throw new RouteGenerationRateLimitError(decision);
    }

    return generate();
  });
}

function isRouteGenerationRequestBody(
  value: unknown,
): value is RouteGenerationRequestBody {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function reportRouteGenerationFailure(params: {
  requestBody: unknown;
  statusCode: number;
  errorMessage: string;
}) {
  after(() =>
    notifyDiscord({
      event: "route_generation_failed",
      errorMessage: params.errorMessage,
      statusCode: params.statusCode,
      requestBody: params.requestBody,
    }),
  );
}

function persistRouteGenerationRun(params: {
  routeType: string;
  requestBody: unknown;
  status: "success" | "failed" | "expected-failure";
  failureCategory?: string;
  errorMessage?: string;
  route?: {
    distance: number;
    elevationGain?: number;
    waypointCount?: number;
  };
  generationSummary?: unknown;
}) {
  after(() =>
    initializeDatabase()
      .then(() =>
        saveRouteGenerationRun({
          routeType: params.routeType,
          payload: {
            status: params.status,
            failureCategory: params.failureCategory,
            requestBody: params.requestBody,
            errorMessage: params.errorMessage,
            route: params.route,
            generationSummary: params.generationSummary,
          },
        }),
      )
      .catch((error) => {
        console.warn("Failed to persist route generation run", error);
      }),
  );
}

function respondWithRouteGenerationFailure(
  requestBody: unknown,
  statusCode: number,
  responseBody: Record<string, unknown>,
  errorMessage: string,
  headers?: HeadersInit,
) {
  reportRouteGenerationFailure({
    requestBody,
    statusCode,
    errorMessage,
  });

  return NextResponse.json(responseBody, {
    status: statusCode,
    ...(headers ? { headers } : {}),
  });
}

export async function POST(request: NextRequest) {
  let rawBody = "";
  let requestBody: RouteGenerationRequestBody | undefined;

  try {
    rawBody = await request.text();
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const clientIp =
      forwardedFor?.split(",")[0]?.trim() || realIp?.trim() || "unknown";

    try {
      const parsedBody: unknown = rawBody ? JSON.parse(rawBody) : {};

      if (!isRouteGenerationRequestBody(parsedBody)) {
        return respondWithRouteGenerationFailure(
          rawBody || undefined,
          400,
          { error: "Invalid JSON body" },
          "Invalid route generation request body",
        );
      }

      requestBody = parsedBody;
    } catch {
      return respondWithRouteGenerationFailure(
        rawBody || undefined,
        400,
        { error: "Invalid JSON body" },
        "Invalid route generation request body",
      );
    }

    const validationError = getRouteRequestValidationError(requestBody);
    if (validationError) {
      return respondWithRouteGenerationFailure(
        requestBody,
        400,
        { errorCode: "invalid_route_request", error: validationError },
        validationError,
      );
    }

    const { startLocation, distance, waypoints, regenerate, pattern } =
      requestBody;

    const orsApiKey = process.env.ORS_API_KEY;
    if (!orsApiKey) {
      return respondWithRouteGenerationFailure(
        requestBody,
        500,
        { error: "ORS API key not configured" },
        "ORS API key not configured",
      );
    }

    if (!regenerate && isRequestedRoundTripDistanceTooLong(distance!)) {
      return respondWithRouteGenerationFailure(
        requestBody,
        400,
        {
          errorCode: "route_distance_too_long",
          error: `Requested route distance exceeds the maximum supported round-trip distance of ${MAX_REQUESTED_ROUND_TRIP_DISTANCE_KM.toFixed(
            0,
          )} km. Please choose a shorter distance.`,
        },
        "Requested route distance exceeds the maximum supported round-trip distance",
      );
    }

    const key = getGenerationKey(requestBody);
    const result = await getOrGenerateRoute(key, clientIp, async () => {
      let finalWaypoints: [number, number][] | undefined;
      let route: RouteResponse;
      let routeType: "rectangle" | "roundTrip" = "roundTrip";
      const selectedPattern: RoutePattern = pattern ?? "all";
      const activePattern: Exclude<RoutePattern, "all"> =
        selectedPattern === "all"
          ? Math.random() < 0.5
            ? "circle"
            : "rectangle"
          : selectedPattern;

      if (regenerate) {
        finalWaypoints = waypoints;
        route = await generateWalkingRoute(waypoints!, orsApiKey);
      } else {
        const [startLat, startLng] = Array.isArray(startLocation)
          ? startLocation
          : [startLocation!.lat, startLocation!.lng];
        const targetDistanceMeters = distance! * 1000;

        if (activePattern === "rectangle") {
          routeType = "rectangle";
          route = await generateRectangleRoute(
            startLat,
            startLng,
            targetDistanceMeters,
            orsApiKey,
          );
        } else {
          routeType = "roundTrip";
          route = await generateRoundTripRoute(
            startLat,
            startLng,
            targetDistanceMeters,
            orsApiKey,
          );
        }
      }

      persistRouteGenerationRun({
        routeType,
        requestBody,
        status: "success",
        route: {
          distance: route.distance,
          elevationGain: route.elevation?.gain,
          waypointCount: route.waypoints?.length ?? finalWaypoints?.length,
        },
        generationSummary: route.generationSummary,
      });

      return { route, routeType, finalWaypoints };
    });

    const routeStart = result.route.coordinates[0];
    const snappedStartLocation = routeStart
      ? ([routeStart[1], routeStart[0]] as [number, number])
      : undefined;
    const requestedStart = !regenerate
      ? Array.isArray(startLocation)
        ? ([startLocation[1], startLocation[0]] as [number, number])
        : ([startLocation!.lng, startLocation!.lat] as [number, number])
      : undefined;
    const startAdjustmentMeters =
      requestedStart !== undefined &&
      routeStart !== undefined &&
      distanceBetweenLonLat(requestedStart, routeStart);

    return NextResponse.json({
      success: true,
      route: {
        coordinates: result.route.coordinates,
        distance: result.route.distance,
        elevationGain: result.route.elevation?.gain,
        waypoints: result.route.waypoints
          ? result.route.waypoints.map(
              ([lng, lat]: [number, number]) => [lat, lng] as [number, number],
            )
          : result.finalWaypoints
            ? result.finalWaypoints.map(
                ([lng, lat]: [number, number]) =>
                  [lat, lng] as [number, number],
              )
            : undefined,
        startLocation: snappedStartLocation,
        distanceFallback:
          result.route.generationSummary?.selectedAttempt?.outcome ===
          "fallback",
        startLocationAdjustmentMeters:
          startAdjustmentMeters && startAdjustmentMeters > 25
            ? Math.round(startAdjustmentMeters)
            : 0,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const invalidStartLocation =
      error instanceof RouteServiceError &&
      error.kind === "invalid-start-location";

    if (invalidStartLocation) {
      console.info("Route generation skipped: invalid start location");
    } else {
      console.error("Error generating route:", error);
    }

    const statusCode =
      error instanceof RouteGenerationRateLimitError ||
      (error instanceof RouteServiceError && error.kind === "rate-limited")
        ? 429
        : error instanceof RateLimitUnavailableError ||
            (error instanceof RouteServiceError &&
              ["quota", "unavailable"].includes(error.kind))
          ? 503
          : error instanceof RouteGenerationError ||
              (error instanceof RouteServiceError &&
                [
                  "no-route",
                  "invalid-start-location",
                  "invalid-request",
                ].includes(error.kind))
            ? 400
            : 500;

    if (!invalidStartLocation) {
      reportRouteGenerationFailure({
        requestBody: (requestBody ?? rawBody) || undefined,
        statusCode,
        errorMessage,
      });
    }

    const generationSummary =
      error instanceof RouteGenerationError ? error.summary : undefined;

    persistRouteGenerationRun({
      routeType: generationSummary?.routeType ?? "roundTrip",
      requestBody: (requestBody ?? rawBody) || undefined,
      status: invalidStartLocation ? "expected-failure" : "failed",
      ...(invalidStartLocation
        ? { failureCategory: "invalid-start-location" }
        : {}),
      errorMessage,
      generationSummary,
    });

    if (error instanceof RouteGenerationRateLimitError) {
      const decision = error.decision;
      return NextResponse.json(
        {
          errorCode: "route_rate_limited",
          error: "Too many route generation attempts. Please try again later.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.max(1, Math.ceil((decision.reset - Date.now()) / 1000)),
            ),
            "X-RateLimit-Limit": String(decision.limit),
            "X-RateLimit-Remaining": String(decision.remaining),
            "X-RateLimit-Reset": String(Math.floor(decision.reset / 1000)),
          },
        },
      );
    }

    if (error instanceof RouteServiceError) {
      if (error.kind === "invalid-start-location") {
        return NextResponse.json(
          {
            errorCode: "invalid_start_location",
            error:
              "The selected starting location is not near a walkable route. Please choose a different starting point.",
          },
          { status: 400 },
        );
      }

      if (error.kind === "rate-limited") {
        return NextResponse.json(
          {
            errorCode: "route_rate_limited",
            error: "The route service is rate limited. Please try again later.",
          },
          {
            status: 429,
            ...(error.retryAfter
              ? { headers: { "Retry-After": error.retryAfter } }
              : {}),
          },
        );
      }

      if (error.kind === "quota" || error.kind === "unavailable") {
        return NextResponse.json(
          {
            errorCode:
              error.kind === "quota"
                ? "route_quota_exceeded"
                : "route_service_unavailable",
            error: "Route service unavailable. Please try again later.",
          },
          { status: 503 },
        );
      }

      if (error.kind === "no-route") {
        return NextResponse.json(
          {
            errorCode: "route_not_found",
            error:
              "Could not find a loop with the requested distance and quality near this location. Try a different starting point or distance.",
          },
          { status: 400 },
        );
      }

      return NextResponse.json(
        { errorCode: "invalid_route_request", error: "Invalid route request." },
        { status: 400 },
      );
    }

    if (error instanceof RouteGenerationError) {
      return NextResponse.json(
        {
          errorCode: "route_not_found",
          error:
            "Could not find a loop with the requested distance and quality near this location. Try a different starting point or distance.",
        },
        { status: 400 },
      );
    }

    if (error instanceof RateLimitUnavailableError) {
      return NextResponse.json(
        {
          errorCode: "route_service_unavailable",
          error:
            "Route generation is temporarily unavailable. Please try again later.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
