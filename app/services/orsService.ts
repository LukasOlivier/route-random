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
    // If we don't have enough points, return all coordinates (start, end, and any intermediate points)
    return coordinates;
  }

  const waypoints: [number, number][] = [];

  // Always include the starting location (first coordinate)
  waypoints.push(coordinates[0]);

  const step = Math.floor((coordinates.length - 1) / (numWaypoints + 1));

  for (let i = 1; i <= numWaypoints; i++) {
    const index = Math.min(i * step, coordinates.length - 1);
    waypoints.push(coordinates[index]);
  }

  // Always include the ending location (last coordinate) if not already included
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
        throw new Error(`ORS API error: ${response.status} - ${errorText}`);
      }

      const data: ORSRoute = await response.json();

      if (!data.features || data.features.length === 0) {
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

      // Update best route if this one is closer to target
      if (distanceDiff < bestDistanceDiff) {
        bestDistanceDiff = distanceDiff;
        bestRoute = route;
      }

      // If within tolerance, return immediately
      if (distanceDiff <= toleranceMeters) {
        console.log(
          `✓ Route found within tolerance: ${(totalDistance / 1000).toFixed(2)}km (target: ${(targetDistance / 1000).toFixed(2)}km, diff: ${(distanceDiff / 1000).toFixed(2)}km)`,
        );
        return route;
      }

      console.log(
        `Attempt with factor ${factor}: ${(totalDistance / 1000).toFixed(2)}km (target: ${(targetDistance / 1000).toFixed(2)}km, diff: ${(distanceDiff / 1000).toFixed(2)}km)`,
      );
    } catch (error) {
      console.log(`Retry attempt with factor ${factor} failed:`, error);
      if (factor === correctionFactors[correctionFactors.length - 1]) {
        // Last attempt failed
        throw error;
      }
    }
  }

  // Return best attempt found
  if (bestRoute) {
    console.log(
      `⚠ Using best attempt: ${(bestRoute.distance / 1000).toFixed(2)}km (target: ${(targetDistance / 1000).toFixed(2)}km, diff: ${(bestDistanceDiff / 1000).toFixed(2)}km)`,
    );
    return bestRoute;
  }

  throw new Error("No route found");
}

export async function generateWalkingRoute(
  waypoints: [number, number][],
  apiKey: string,
): Promise<RouteResponse> {
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
      throw new Error(`ORS API error: ${response.status} - ${errorText}`);
    }

    const data: ORSRoute = await response.json();

    if (!data.features || data.features.length === 0) {
      throw new Error("No route found");
    }

    const feature = data.features[0];
    const coordinates = feature.geometry.coordinates;
    const totalDistance = feature.properties.segments.reduce(
      (sum, segment) => sum + segment.distance,
      0,
    );

    const elevation = extractElevationData(data);

    return {
      coordinates,
      distance: totalDistance,
      elevation,
      waypoints,
    };
  } catch (error) {
    console.error("Error calling ORS API:", error);
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
    console.error("Error extracting elevation data:", error);
    return undefined;
  }
}
