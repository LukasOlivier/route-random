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
}

const ORS_API_URL =
  "https://api.openrouteservice.org/v2/directions/foot-walking/geojson";
const COMMON_AVOID_FEATURES = ["ferries", "steps"];

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
  const requestBody = {
    coordinates: [[startLng, startLat]],
    preference: "recommended",
    elevation: true,
    extra_info: ["surface", "waytype", "steepness"],
    options: {
      round_trip: {
        length: targetDistance,
        points: 6,
        seed: Math.floor(Math.random() * 100000),
      },
      avoid_features: COMMON_AVOID_FEATURES,
    },
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
    };
  } catch (error) {
    console.error("Error calling ORS round-trip API:", error);
    throw error;
  }
}

export async function generateWalkingRoute(
  waypoints: [number, number][],
  apiKey: string,
): Promise<RouteResponse> {
  const requestBody = {
    coordinates: waypoints,
    elevation: true,
    extra_info: ["surface", "waytype", "steepness"],
    options: {
      avoid_features: COMMON_AVOID_FEATURES,
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
