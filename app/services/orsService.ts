import { getLogger } from "@/lib/logger";
import { buildRectangleWaypoints } from "@/app/utils/routePatterns";
import {
  assessRouteQuality,
  distanceBetweenLonLat,
  getRouteDistanceTolerance,
  isValidLonLat,
} from "@/app/utils/routeQuality";
import { RouteServiceError } from "./orsErrors";

export { RouteServiceError } from "./orsErrors";

const logger = getLogger("orsService");

import type {
  ORSRoute,
  RouteResponse,
  RouteGenerationAttempt,
  RouteGenerationSummary,
} from "./orsTypes";
import { requestOrsRoute } from "./orsClient";
export type {
  RouteResponse,
  RouteGenerationAttempt,
  RouteGenerationSummary,
} from "./orsTypes";

export class RouteGenerationError extends Error {
  constructor(
    message: string,
    public readonly summary: RouteGenerationSummary,
  ) {
    super(message);
    this.name = "RouteGenerationError";
  }
}

const COMMON_AVOID_FEATURES = ["ferries"];
const ROUND_TRIP_INITIAL_FACTOR = 0.82;
const ROUND_TRIP_MIN_FACTOR = 0.4;
const ROUND_TRIP_MAX_FACTOR = 1;
const ROUND_TRIP_MAX_ATTEMPTS = 5;
const RECTANGLE_INITIAL_FACTOR = 0.68;
const RECTANGLE_MIN_FACTOR = 0.4;
const RECTANGLE_MAX_FACTOR = 1;
const RECTANGLE_MAX_ATTEMPTS = 6;
const MAX_START_SNAP_DISTANCE_METERS = 150;
const MAX_ORS_ROUND_TRIP_LENGTH_METERS = 100_000;
function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizeOrsCoordinate(
  coordinate: [number, number],
): [number, number] {
  if (!isValidLonLat(coordinate)) {
    throw new RouteServiceError(
      `Invalid longitude/latitude coordinate: ${coordinate}`,
      "invalid-request",
    );
  }

  return coordinate;
}

function normalizeOrsCoordinates(
  coordinates: [number, number][],
): [number, number][] {
  return coordinates.map((coordinate) => normalizeOrsCoordinate(coordinate));
}

function getTwoDimensionalCoordinates(
  coordinates: [number, number, ...number[]][],
): [number, number][] {
  if (
    !Array.isArray(coordinates) ||
    coordinates.length < 2 ||
    coordinates.some(
      (coordinate) =>
        !Array.isArray(coordinate) ||
        coordinate.length < 2 ||
        !isValidLonLat([coordinate[0], coordinate[1]]),
    )
  ) {
    throw new RouteServiceError(
      "ORS response did not contain valid route geometry",
      "no-route",
    );
  }

  return coordinates.map(([longitude, latitude]) => [longitude, latitude]);
}

function extractWaypointsFromCoordinates(
  coordinates: [number, number][],
  numWaypoints: number = 5,
): [number, number][] {
  if (coordinates.length <= numWaypoints + 1) {
    return coordinates;
  }

  const waypoints: [number, number][] = [];

  waypoints.push(coordinates[0]);

  const step = Math.floor((coordinates.length - 1) / (numWaypoints + 1));

  for (let i = 1; i <= numWaypoints; i++) {
    const index = Math.min(i * step, coordinates.length - 1);
    waypoints.push(coordinates[index]);
  }

  if (waypoints[waypoints.length - 1] !== coordinates[coordinates.length - 1]) {
    waypoints.push(coordinates[coordinates.length - 1]);
  }

  return waypoints;
}

function getRouteDistance(data: ORSRoute): number {
  const segments = data.features?.[0]?.properties?.segments;
  if (
    !Array.isArray(segments) ||
    segments.length === 0 ||
    segments.some(
      (segment) =>
        typeof segment.distance !== "number" ||
        !Number.isFinite(segment.distance) ||
        segment.distance < 0,
    )
  ) {
    throw new RouteServiceError(
      "ORS response did not contain valid route segments",
      "no-route",
    );
  }

  const distance = segments.reduce((sum, segment) => sum + segment.distance, 0);

  if (distance <= 0) {
    throw new RouteServiceError(
      "ORS response did not contain a valid route distance",
      "no-route",
    );
  }

  return distance;
}

function validateOrsRouteQuality(
  coordinates: [number, number][],
  distance: number,
  targetDistance?: number,
  toleranceMeters?: number,
) {
  try {
    return assessRouteQuality(
      coordinates,
      distance,
      targetDistance,
      toleranceMeters,
    );
  } catch (error) {
    throw new RouteServiceError(
      error instanceof Error ? error.message : "Invalid route geometry",
      "no-route",
    );
  }
}

function isUnroutableStartFailure(error: RouteServiceError): boolean {
  return /routable point within a radius|cannot find point|route start is too far/i.test(
    error.message,
  );
}

export async function generateRoundTripRoute(
  startLat: number,
  startLng: number,
  targetDistance: number,
  apiKey: string,
): Promise<RouteResponse> {
  logger.info(
    { startLat, startLng, targetDistance },
    "Starting round trip route generation",
  );

  const toleranceMeters = getRouteDistanceTolerance(targetDistance);
  let bestDistanceDiff = Infinity;
  let bestAttempt: RouteGenerationAttempt | undefined;
  let selectedAttempt: RouteGenerationAttempt | undefined;
  let bestDistanceCandidate:
    { route: RouteResponse; attempt: RouteGenerationAttempt } | undefined;
  let currentFactor = ROUND_TRIP_INITIAL_FACTOR;
  const attempts: RouteGenerationAttempt[] = [];

  for (let attempt = 0; attempt < ROUND_TRIP_MAX_ATTEMPTS; attempt += 1) {
    const factor = currentFactor;

    try {
      const correctedDistance = Math.round(
        Math.min(targetDistance * factor, MAX_ORS_ROUND_TRIP_LENGTH_METERS),
      );
      const normalizedStart = normalizeOrsCoordinate([startLng, startLat]);
      const seed = Math.floor(Math.random() * 100000);

      const requestBody = {
        coordinates: [normalizedStart],
        preference: "recommended",
        elevation: true,
        extra_info: ["surface", "waytype", "steepness", "traildifficulty"],
        options: {
          round_trip: {
            length: correctedDistance,
            points: 6,
            seed,
          },
          avoid_features: COMMON_AVOID_FEATURES,
          profile_params: {
            weightings: {
              green: 1,
              quiet: 1,
            },
          },
        },
      };

      const data = await requestOrsRoute(requestBody, apiKey);

      if (!data.features || data.features.length === 0) {
        logger.warn({ factor }, "ORS API returned no features");
        throw new RouteServiceError("No route found", "no-route");
      }

      const feature = data.features[0];
      const coordinates = getTwoDimensionalCoordinates(
        feature.geometry.coordinates,
      );

      if (
        distanceBetweenLonLat(normalizedStart, coordinates[0]) >
        MAX_START_SNAP_DISTANCE_METERS
      ) {
        throw new RouteServiceError(
          "The route start is too far from the requested starting point",
          "no-route",
        );
      }

      const totalDistance = getRouteDistance(data);

      const elevation = extractElevationData(data);
      const waypoints = extractWaypointsFromCoordinates(coordinates, 5);
      const route: RouteResponse = {
        coordinates,
        distance: totalDistance,
        elevation,
        waypoints,
      };

      const distanceDiff = Math.abs(totalDistance - targetDistance);
      const quality = validateOrsRouteQuality(
        route.coordinates,
        route.distance,
        targetDistance,
        toleranceMeters,
      );
      const nonDistanceQuality = validateOrsRouteQuality(
        route.coordinates,
        route.distance,
      );
      const attempt: RouteGenerationAttempt = {
        factor,
        correctedDistance,
        routeDistance: totalDistance,
        distanceDiff,
        toleranceMeters,
        outcome: quality.reason ? "retry" : "success",
        ...(quality.reason ? { errorMessage: quality.reason } : {}),
        quality: quality.metrics,
        seed,
      };
      attempts.push(attempt);
      if (distanceDiff < bestDistanceDiff) {
        bestDistanceDiff = distanceDiff;
        bestAttempt = attempt;
      }
      if (
        !nonDistanceQuality.reason &&
        (!bestDistanceCandidate ||
          distanceDiff < bestDistanceCandidate.attempt.distanceDiff!)
      ) {
        bestDistanceCandidate = { route, attempt };
      }

      if (!quality.reason) {
        selectedAttempt = attempt;
        logger.info(
          {
            factor,
            distance: (totalDistance / 1000).toFixed(2),
            target: (targetDistance / 1000).toFixed(2),
            diff: (distanceDiff / 1000).toFixed(2),
          },
          "Route found within tolerance",
        );
        return {
          ...route,
          generationSummary: {
            routeType: "roundTrip",
            targetDistance,
            toleranceMeters,
            attempts,
            bestAttempt,
            selectedAttempt,
          },
        };
      }

      currentFactor = clamp(
        factor * (targetDistance / Math.max(totalDistance, 1)),
        ROUND_TRIP_MIN_FACTOR,
        ROUND_TRIP_MAX_FACTOR,
      );

      attempt.nextFactor = currentFactor;

      logger.debug(
        {
          factor,
          nextFactor: currentFactor,
          distance: (totalDistance / 1000).toFixed(2),
          target: (targetDistance / 1000).toFixed(2),
          diff: (distanceDiff / 1000).toFixed(2),
        },
        "Route attempt",
      );
    } catch (error) {
      if (!(error instanceof RouteServiceError) || error.kind !== "no-route") {
        throw error;
      }
      if (isUnroutableStartFailure(error)) {
        throw error;
      }

      attempts.push({
        factor,
        toleranceMeters,
        outcome: "error",
        errorMessage: error instanceof Error ? error.message : String(error),
      });

      currentFactor = clamp(
        currentFactor,
        ROUND_TRIP_MIN_FACTOR,
        ROUND_TRIP_MAX_FACTOR,
      );

      logger.warn(
        {
          factor,
          error: error instanceof Error ? error.message : String(error),
        },
        "Retry attempt failed",
      );
    }
  }

  if (bestDistanceCandidate) {
    const { route, attempt } = bestDistanceCandidate;
    attempt.outcome = "fallback";
    selectedAttempt = attempt;
    logger.warn(
      {
        targetDistance,
        routeDistance: route.distance,
        distanceDiff: attempt.distanceDiff,
        toleranceMeters,
      },
      "Returning closest valid round-trip route outside requested distance tolerance",
    );
    return {
      ...route,
      generationSummary: {
        routeType: "roundTrip",
        targetDistance,
        toleranceMeters,
        attempts,
        bestAttempt,
        selectedAttempt,
      },
    };
  }

  logger.error(
    {
      targetDistance,
      routeType: "roundTrip",
      attempts,
      bestAttempt,
    },
    "Failed to generate route after all attempts",
  );
  throw new RouteGenerationError("No route found", {
    routeType: "roundTrip",
    targetDistance,
    toleranceMeters,
    attempts,
    bestAttempt,
  });
}

export async function generateRectangleRoute(
  startLat: number,
  startLng: number,
  targetDistance: number,
  apiKey: string,
): Promise<RouteResponse> {
  logger.info(
    { startLat, startLng, targetDistance },
    "Starting rectangle route generation",
  );

  let currentFactor = RECTANGLE_INITIAL_FACTOR;
  let bestDistanceDiff = Infinity;
  let bestAttempt: RouteGenerationAttempt | undefined;
  let selectedAttempt: RouteGenerationAttempt | undefined;
  let bestDistanceCandidate:
    { route: RouteResponse; attempt: RouteGenerationAttempt } | undefined;
  const toleranceMeters = getRouteDistanceTolerance(targetDistance);
  const attempts: RouteGenerationAttempt[] = [];

  for (let attempt = 0; attempt < RECTANGLE_MAX_ATTEMPTS; attempt += 1) {
    const factor = currentFactor;

    try {
      const waypoints = buildRectangleWaypoints(
        startLat,
        startLng,
        targetDistance,
        factor,
      );
      const route = await generateWalkingRoute(waypoints, apiKey);
      const distanceDiff = Math.abs(route.distance - targetDistance);
      const quality = validateOrsRouteQuality(
        route.coordinates,
        route.distance,
        targetDistance,
        toleranceMeters,
      );
      const routeAttempt: RouteGenerationAttempt = {
        factor,
        routeDistance: route.distance,
        distanceDiff,
        toleranceMeters,
        outcome: quality.reason ? "retry" : "success",
        ...(quality.reason ? { errorMessage: quality.reason } : {}),
        quality: quality.metrics,
      };

      if (distanceDiff < bestDistanceDiff) {
        bestDistanceDiff = distanceDiff;
        bestAttempt = routeAttempt;
      }
      if (
        !bestDistanceCandidate ||
        distanceDiff < bestDistanceCandidate.attempt.distanceDiff!
      ) {
        bestDistanceCandidate = { route, attempt: routeAttempt };
      }

      if (!quality.reason) {
        selectedAttempt = routeAttempt;
        attempts.push(routeAttempt);
        logger.info(
          {
            factor,
            distance: (route.distance / 1000).toFixed(2),
            target: (targetDistance / 1000).toFixed(2),
            diff: (distanceDiff / 1000).toFixed(2),
          },
          "Rectangle route found within tolerance",
        );
        return {
          ...route,
          generationSummary: {
            routeType: "rectangle",
            targetDistance,
            toleranceMeters,
            attempts,
            bestAttempt,
            selectedAttempt,
          },
        };
      }

      currentFactor = clamp(
        factor * (targetDistance / Math.max(route.distance, 1)),
        RECTANGLE_MIN_FACTOR,
        RECTANGLE_MAX_FACTOR,
      );

      routeAttempt.nextFactor = currentFactor;
      attempts.push(routeAttempt);

      logger.debug(
        {
          factor,
          nextFactor: currentFactor,
          distance: (route.distance / 1000).toFixed(2),
          target: (targetDistance / 1000).toFixed(2),
          diff: (distanceDiff / 1000).toFixed(2),
        },
        "Rectangle route attempt",
      );
    } catch (error) {
      if (!(error instanceof RouteServiceError) || error.kind !== "no-route") {
        throw error;
      }
      if (/route start is too far/i.test(error.message)) {
        throw error;
      }

      logger.warn(
        {
          factor,
          error: error instanceof Error ? error.message : String(error),
        },
        "Rectangle retry attempt failed",
      );

      attempts.push({
        factor,
        toleranceMeters,
        outcome: "error",
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (bestDistanceCandidate) {
    const { route, attempt } = bestDistanceCandidate;
    attempt.outcome = "fallback";
    selectedAttempt = attempt;
    logger.warn(
      {
        targetDistance,
        routeDistance: route.distance,
        distanceDiff: attempt.distanceDiff,
        toleranceMeters,
      },
      "Returning closest valid rectangle route outside requested distance tolerance",
    );
    return {
      ...route,
      generationSummary: {
        routeType: "rectangle",
        targetDistance,
        toleranceMeters,
        attempts,
        bestAttempt,
        selectedAttempt,
      },
    };
  }

  logger.error(
    {
      targetDistance,
      routeType: "rectangle",
      attempts,
      bestAttempt,
    },
    "Failed to generate rectangle route after all attempts",
  );
  throw new RouteGenerationError("No route found", {
    routeType: "rectangle",
    targetDistance,
    toleranceMeters,
    attempts,
    bestAttempt,
  });
}

export async function generateWalkingRoute(
  waypoints: [number, number][],
  apiKey: string,
): Promise<RouteResponse> {
  logger.info(
    { waypointCount: waypoints.length },
    "Starting walking route generation",
  );

  const normalizedWaypoints = normalizeOrsCoordinates(waypoints);
  if (normalizedWaypoints.length < 2) {
    throw new RouteServiceError(
      "At least two waypoints are required",
      "invalid-request",
    );
  }

  const requestBody = {
    coordinates: normalizedWaypoints,
    elevation: true,
    extra_info: ["surface", "waytype", "steepness", "traildifficulty"],
    options: {
      avoid_features: COMMON_AVOID_FEATURES,
      profile_params: {
        weightings: {
          green: 1,
          quiet: 1,
        },
      },
    },
    preference: "recommended",
  };

  try {
    const data = await requestOrsRoute(requestBody, apiKey);

    if (!data.features || data.features.length === 0) {
      logger.warn("ORS API returned no features for walking route");
      throw new RouteServiceError("No route found", "no-route");
    }

    const feature = data.features[0];
    const coordinates = getTwoDimensionalCoordinates(
      feature.geometry.coordinates,
    );

    const totalDistance = getRouteDistance(data);

    const elevation = extractElevationData(data);
    const startDisplacement = distanceBetweenLonLat(
      normalizedWaypoints[0],
      coordinates[0],
    );
    if (startDisplacement > MAX_START_SNAP_DISTANCE_METERS) {
      throw new RouteServiceError(
        "The route start is too far from the requested starting point",
        "no-route",
      );
    }

    const routeQuality = validateOrsRouteQuality(coordinates, totalDistance);
    if (routeQuality.reason) {
      throw new RouteServiceError(routeQuality.reason, "no-route");
    }

    const routeWaypoints = [...normalizedWaypoints];
    routeWaypoints[0] = coordinates[0];
    routeWaypoints[routeWaypoints.length - 1] =
      coordinates[coordinates.length - 1];

    logger.info(
      {
        distance: (totalDistance / 1000).toFixed(2),
        waypointCount: normalizedWaypoints.length,
      },
      "Walking route generated successfully",
    );

    return {
      coordinates,
      distance: totalDistance,
      elevation,
      waypoints: routeWaypoints,
    };
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        waypointCount: normalizedWaypoints.length,
      },
      "Error calling ORS API",
    );
    throw error;
  }
}

function extractElevationData(route: ORSRoute):
  | {
      gain: number;
      loss: number;
      min: number;
      max: number;
      profile: number[];
    }
  | undefined {
  try {
    const feature = route.features?.[0];
    if (!feature) return undefined;

    const elevationData = (feature.properties as { elevation?: number[] })
      ?.elevation;
    let profile: number[] = [];
    let min = Infinity;
    let max = -Infinity;

    if (Array.isArray(elevationData)) {
      profile = elevationData;
      min = Math.min(...elevationData);
      max = Math.max(...elevationData);
    }

    let totalGain = 0;
    let totalLoss = 0;

    feature.properties.segments.forEach(
      (segment: { ascent?: number; descent?: number }) => {
        if (segment.ascent) totalGain += segment.ascent;
        if (segment.descent) totalLoss += segment.descent;
      },
    );

    if (totalGain > 0 || totalLoss > 0 || profile.length > 0) {
      return {
        gain: Math.round(totalGain),
        loss: Math.round(totalLoss),
        min: min === Infinity ? 0 : Math.round(min),
        max: max === -Infinity ? 0 : Math.round(max),
        profile,
      };
    }

    return undefined;
  } catch (error) {
    logger.warn(
      { error: error instanceof Error ? error.message : String(error) },
      "Error extracting elevation data",
    );
    return undefined;
  }
}
