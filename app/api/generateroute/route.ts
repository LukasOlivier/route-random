import { NextRequest, NextResponse } from "next/server";
import {
  generateCircularWaypoints,
  addRandomnessToWaypoints,
} from "../../utils/waypointGeneration";
import { generateWalkingRoute } from "../../services/orsService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { startLocation, distance } = body;

    // Validate required fields
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

    // Validate ORS API key
    const orsApiKey = process.env.ORS_API_KEY;
    if (!orsApiKey) {
      return NextResponse.json(
        { error: "ORS API key not configured" },
        { status: 500 }
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
    const baseWaypoints = generateCircularWaypoints(
      startLat,
      startLng,
      distance
    );

    // Add some randomness to make routes more interesting
    const waypoints = addRandomnessToWaypoints(baseWaypoints, 0.2);

    console.log("Generated waypoints:", waypoints);

    // Generate the actual walking route using ORS
    const route = await generateWalkingRoute(waypoints, orsApiKey);

    console.log("Route generated successfully:", {
      coordinatesCount: route.coordinates.length,
      distance: route.distance,
    });

    return NextResponse.json({
      success: true,
      route: {
        coordinates: route.coordinates,
        distance: route.distance,
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
