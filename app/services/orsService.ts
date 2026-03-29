import { getLogger } from "@/lib/logger";

const logger = getLogger("orsService");

export interface ORSRoute {
  type: string;
  features: Array<{
    type: string;
    properties: {
      segments: Array<{
        distance: number;
        ascent?: number;
        descent?: number;
      }>;
      elevation?: number[];
    };
    geometry: {
      coordinates: [number, number][];
      type: string;
    };
  }>;
}

export interface RouteResponse {
  coordinates: [number, number][];
  distance: number;
  elevation?: {
    gain: number;
    loss: number;
    min: number;
    max: number;
    profile: number[];
  };
  waypoints?: [number, number][];
}

const ORS_API_URL =
  "https://api.openrouteservice.org/v2/directions/foot-hiking/geojson";
const COMMON_AVOID_FEATURES = ["ferries"];

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

function buildOrsRequestHeaders(apiKey: string) {
  return {
    Accept:
      "application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8",
    Authorization: apiKey,
    "Content-Type": "application/json; charset=utf-8",
  };
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

  const correctionFactors = [0.82, 0.75, 0.68];
  const toleranceMeters = Math.max(500, targetDistance * 0.1);

  let bestRoute: RouteResponse | null = null;
  let bestDistanceDiff = Infinity;

  for (const factor of correctionFactors) {
    try {
      const correctedDistance = Math.round(targetDistance * factor);

      const requestBody = {
        coordinates: [[startLng, startLat]],
        preference: "recommended",
        elevation: true,
        extra_info: ["surface", "waytype", "steepness", "traildifficulty"],
        options: {
          round_trip: {
            length: correctedDistance,
            points: 6,
            seed: Math.floor(Math.random() * 100000),
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

      const response = await fetch(ORS_API_URL, {
        method: "POST",
        headers: buildOrsRequestHeaders(apiKey),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.warn(
          {
            status: response.status,
            factor,
            correctedDistance,
            errorText,
          },
          "ORS API returned error status",
        );
        throw new Error(`ORS API error: ${response.status} - ${errorText}`);
      }

      const data: ORSRoute = await response.json();

      if (!data.features || data.features.length === 0) {
        logger.warn({ factor }, "ORS API returned no features");
        throw new Error("No route found");
      }

      const feature = data.features[0];
      const coordinates = feature.geometry.coordinates;
      const totalDistance = feature.properties.segments.reduce(
        (sum, segment) => sum + segment.distance,
        0,
      );

      const elevation = extractElevationData(data);
      const waypoints = extractWaypointsFromCoordinates(coordinates, 5);
      const route: RouteResponse = {
        coordinates,
        distance: totalDistance,
        elevation,
        waypoints,
      };

      const distanceDiff = Math.abs(totalDistance - targetDistance);

      if (distanceDiff < bestDistanceDiff) {
        bestDistanceDiff = distanceDiff;
        bestRoute = route;
      }

      if (distanceDiff <= toleranceMeters) {
        logger.info(
          {
            factor,
            distance: (totalDistance / 1000).toFixed(2),
            target: (targetDistance / 1000).toFixed(2),
            diff: (distanceDiff / 1000).toFixed(2),
          },
          "Route found within tolerance",
        );
        return route;
      }

      logger.debug(
        {
          factor,
          distance: (totalDistance / 1000).toFixed(2),
          target: (targetDistance / 1000).toFixed(2),
          diff: (distanceDiff / 1000).toFixed(2),
        },
        "Route attempt",
      );
    } catch (error) {
      logger.warn(
        {
          factor,
          error: error instanceof Error ? error.message : String(error),
        },
        "Retry attempt failed",
      );
      if (factor === correctionFactors[correctionFactors.length - 1]) {
        throw error;
      }
    }
  }

  if (bestRoute) {
    logger.info(
      {
        distance: (bestRoute.distance / 1000).toFixed(2),
        target: (targetDistance / 1000).toFixed(2),
        diff: (bestDistanceDiff / 1000).toFixed(2),
      },
      "Using best attempt instead of ideal match",
    );
    return bestRoute;
  }

  logger.error(
    { targetDistance },
    "Failed to generate route after all attempts",
  );
  throw new Error("No route found");
}

export async function generateWalkingRoute(
  waypoints: [number, number][],
  apiKey: string,
): Promise<RouteResponse> {
  logger.info(
    { waypointCount: waypoints.length },
    "Starting walking route generation",
  );

  const requestBody = {
    coordinates: waypoints,
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
    const response = await fetch(ORS_API_URL, {
      method: "POST",
      headers: buildOrsRequestHeaders(apiKey),
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(
        { status: response.status, errorText },
        "ORS API error for walking route",
      );
      throw new Error(`ORS API error: ${response.status} - ${errorText}`);
    }

    const data: ORSRoute = await response.json();

    if (!data.features || data.features.length === 0) {
      logger.warn("ORS API returned no features for walking route");
      throw new Error("No route found");
    }

    const feature = data.features[0];
    const coordinates = feature.geometry.coordinates;
    const totalDistance = feature.properties.segments.reduce(
      (sum, segment) => sum + segment.distance,
      0,
    );

    const elevation = extractElevationData(data);

    logger.info(
      {
        distance: (totalDistance / 1000).toFixed(2),
        waypointCount: waypoints.length,
      },
      "Walking route generated successfully",
    );

    return {
      coordinates,
      distance: totalDistance,
      elevation,
      waypoints,
    };
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        waypointCount: waypoints.length,
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
