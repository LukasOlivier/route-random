import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import {
  generateWalkingRoute,
  generateRectangleRoute,
  generateRoundTripRoute,
  RouteGenerationError,
} from "../../services/orsService";
import { checkRouteGenerationRateLimit } from "@/app/utils/rateLimit";
import { notifyDiscord } from "@/app/utils/discordNotifications";
import {
  MAX_REQUESTED_ROUND_TRIP_DISTANCE_KM,
  isRequestedRoundTripDistanceTooLong,
} from "@/app/utils/routeCalculations";
import {
  isValidRoutePattern,
  type RoutePattern,
} from "@/app/utils/routePatterns";
import type { RouteResponse } from "../../services/orsService";
import { initializeDatabase, saveRouteGenerationRun } from "@/lib/db";

type RouteStartLocation = [number, number] | { lat: number; lng: number };

interface RouteGenerationRequestBody {
  startLocation?: RouteStartLocation;
  distance?: number;
  waypoints?: [number, number][];
  regenerate?: boolean;
  pattern?: RoutePattern;
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
  status: "success" | "failed";
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

    const rateLimitDecision = await checkRouteGenerationRateLimit(clientIp);
    if (!rateLimitDecision.allowed) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((rateLimitDecision.reset - Date.now()) / 1000),
      );

      return respondWithRouteGenerationFailure(
        rawBody || undefined,
        429,
        {
          errorCode: "route_generation_rate_limited",
          error:
            "Too many route generation attempts. Please wait a bit and try again.",
        },
        "Rate limit reached before route generation request body was read",
        {
          "Retry-After": String(retryAfterSeconds),
          "X-RateLimit-Limit": String(rateLimitDecision.limit),
          "X-RateLimit-Remaining": String(rateLimitDecision.remaining),
          "X-RateLimit-Reset": String(
            Math.floor(rateLimitDecision.reset / 1000),
          ),
        },
      );
    }

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

    let finalWaypoints: [number, number][] | undefined;
    let route: RouteResponse;
    let routeType: "rectangle" | "roundTrip" = "roundTrip";
    const selectedPattern: RoutePattern = isValidRoutePattern(pattern)
      ? pattern
      : "all";
    const activePattern: Exclude<RoutePattern, "all"> =
      selectedPattern === "all"
        ? Math.random() < 0.5
          ? "circle"
          : "rectangle"
        : selectedPattern;

    if (regenerate && waypoints) {
      finalWaypoints = waypoints;
      route = await generateWalkingRoute(waypoints, orsApiKey);
    } else {
      if (!startLocation) {
        return respondWithRouteGenerationFailure(
          requestBody,
          400,
          { error: "Starting location is required" },
          "Starting location is required",
        );
      }

      if (!distance || distance <= 0) {
        return respondWithRouteGenerationFailure(
          requestBody,
          400,
          { error: "Valid distance is required" },
          "Valid distance is required",
        );
      }

      if (isRequestedRoundTripDistanceTooLong(distance)) {
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

      let startLat: number, startLng: number;
      if (Array.isArray(startLocation)) {
        [startLat, startLng] = startLocation;
      } else {
        startLat = startLocation.lat;
        startLng = startLocation.lng;
      }

      const targetDistanceMeters = distance * 1000;
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

    return NextResponse.json({
      success: true,
      route: {
        coordinates: route.coordinates,
        distance: route.distance,
        elevationGain: route.elevation?.gain,
        waypoints: route.waypoints
          ? route.waypoints.map(
              ([lng, lat]: [number, number]) => [lat, lng] as [number, number],
            )
          : finalWaypoints
            ? finalWaypoints.map(
                ([lng, lat]: [number, number]) =>
                  [lat, lng] as [number, number],
              )
            : undefined,
      },
    });
  } catch (error) {
    console.error("Error generating route:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const statusCode =
      error instanceof Error
        ? error.message.includes("429") || error.message.includes("Rate Limit")
          ? 429
          : error.message.includes("ORS API error")
            ? 503
            : error.message.includes("No route found")
              ? 400
              : error.message.includes("route_distance_too_long")
                ? 400
                : 500
        : 500;

    reportRouteGenerationFailure({
      requestBody: (requestBody ?? rawBody) || undefined,
      statusCode,
      errorMessage,
    });

    const generationSummary =
      error instanceof RouteGenerationError ? error.summary : undefined;

    persistRouteGenerationRun({
      routeType: generationSummary?.routeType ?? "roundTrip",
      requestBody: (requestBody ?? rawBody) || undefined,
      status: "failed",
      errorMessage,
      generationSummary,
    });

    if (error instanceof Error) {
      if (
        error.message.includes("429") ||
        error.message.includes("Rate Limit")
      ) {
        return NextResponse.json(
          {
            errorCode: "route_rate_limited",
            error:
              "Too many users are generating routes right now. Please try again later.",
          },
          { status: 429 },
        );
      }
      if (error.message.includes("ORS API error")) {
        return NextResponse.json(
          {
            errorCode: "route_service_unavailable",
            error: "Route service unavailable. Please try again later.",
          },
          { status: 503 },
        );
      }
      if (error.message.includes("No route found")) {
        return NextResponse.json(
          {
            errorCode: "route_not_found",
            error:
              "Could not generate a route for this location. Try a different starting point.",
          },
          { status: 400 },
        );
      }
      if (error.message.includes("route_distance_too_long")) {
        return NextResponse.json(
          {
            errorCode: "route_distance_too_long",
            error: `Requested route distance exceeds the maximum supported round-trip distance of ${MAX_REQUESTED_ROUND_TRIP_DISTANCE_KM.toFixed(
              0,
            )} km. Please choose a shorter distance.`,
          },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
