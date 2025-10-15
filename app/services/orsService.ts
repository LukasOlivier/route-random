export interface ORSRoute {
  type: string;
  features: Array<{
    type: string;
    properties: {
      segments: Array<{
        distance: number;
      }>;
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
}

/**
 * Generate a walking route using OpenRouteService
 */
export async function generateWalkingRoute(
  waypoints: [number, number][],
  apiKey: string
): Promise<RouteResponse> {
  const url =
    "https://api.openrouteservice.org/v2/directions/foot-walking/geojson";

  const requestBody = {
    coordinates: waypoints,
    options: {
      avoid_features: ["ferries"],
    },
    preference: "recommended",
    units: "km",
    continue_straight: true,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept:
          "application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8",
        Authorization: apiKey,
        "Content-Type": "application/json; charset=utf-8",
      },
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
      0
    );

    return {
      coordinates,
      distance: totalDistance,
    };
  } catch (error) {
    console.error("Error calling ORS API:", error);
    throw error;
  }
}
