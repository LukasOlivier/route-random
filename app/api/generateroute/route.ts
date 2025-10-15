import { NextRequest, NextResponse } from "next/server";
import { generateCircularWaypoints } from "../../utils/waypointGeneration";
import { generateWalkingRoute } from "../../services/orsService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { startLocation, distance, correctionFactor, waypoints, regenerate } =
      body;

    // Validate ORS API key
    const orsApiKey = process.env.ORS_API_KEY;
    if (!orsApiKey) {
      return NextResponse.json(
        { error: "ORS API key not configured" },
        { status: 500 }
      );
    }

    let finalWaypoints: [number, number][];

    if (regenerate && waypoints) {
      // Use existing waypoints for regeneration (user moved a marker)
      finalWaypoints = waypoints;
    } else {
      if (!startLocation) {
        return NextResponse.json(
          { error: "Starting location is required" },
          { status: 400 }
        );
      }

      if (!distance || distance <= 0) {
        return NextResponse.json(
          { error: "Valid distance is required" },
          { status: 400 }
        );
      }

      // Extract coordinates from startLocation
      let startLat: number, startLng: number;
      if (Array.isArray(startLocation)) {
        [startLat, startLng] = startLocation;
      } else {
        startLat = startLocation.lat;
        startLng = startLocation.lng;
      }

      // Generate circular waypoints
      finalWaypoints = generateCircularWaypoints(
        startLat,
        startLng,
        distance,
        undefined,
        correctionFactor || 0.65
      );
    }

    // Generate the actual route using ORS
    const route = await generateWalkingRoute(finalWaypoints, orsApiKey);

    return NextResponse.json({
      success: true,
      route: {
        coordinates: route.coordinates,
        distance: route.distance,
        waypoints: finalWaypoints.map(
          ([lng, lat]) => [lat, lng] as [number, number]
        ),
      },
    });
  } catch (error) {
    console.error("Error generating route:", error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("ORS API error")) {
        return NextResponse.json(
          { error: "Route service unavailable. Please try again later." },
          { status: 503 }
        );
      }
      if (error.message.includes("No route found")) {
        return NextResponse.json(
          {
            error:
              "Could not generate a route for this location. Try a different starting point.",
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
