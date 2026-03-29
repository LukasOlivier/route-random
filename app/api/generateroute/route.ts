import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import {
  generateWalkingRoute,
  generateRoundTripRoute,
} from "../../services/orsService";
import { notifyDiscord } from "@/app/utils/discordNotifications";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { startLocation, distance, waypoints, regenerate } = body;

    const orsApiKey = process.env.ORS_API_KEY;
    if (!orsApiKey) {
      return NextResponse.json(
        { error: "ORS API key not configured" },
        { status: 500 },
      );
    }

    let finalWaypoints: [number, number][] | undefined;
    let route;

    if (regenerate && waypoints) {
      finalWaypoints = waypoints;
      route = await generateWalkingRoute(waypoints, orsApiKey);
    } else {
      if (!startLocation) {
        return NextResponse.json(
          { error: "Starting location is required" },
          { status: 400 },
        );
      }

      if (!distance || distance <= 0) {
        return NextResponse.json(
          { error: "Valid distance is required" },
          { status: 400 },
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
      route = await generateRoundTripRoute(
        startLat,
        startLng,
        targetDistanceMeters,
        orsApiKey,
      );
    }

    return NextResponse.json({
      success: true,
      route: {
        coordinates: route.coordinates,
        distance: route.distance,
        elevationGain: route.elevation?.gain,
        waypoints: finalWaypoints
          ? finalWaypoints.map(([lng, lat]) => [lat, lng] as [number, number])
          : undefined,
      },
    });
  } catch (error) {
    console.error("Error generating route:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    after(() =>
      notifyDiscord({
        event: "route_generation_failed",
        errorMessage,
      }),
    );

    if (error instanceof Error) {
      if (error.message.includes("ORS API error")) {
        return NextResponse.json(
          { error: "Route service unavailable. Please try again later." },
          { status: 503 },
        );
      }
      if (error.message.includes("No route found")) {
        return NextResponse.json(
          {
            error:
              "Could not generate a route for this location. Try a different starting point.",
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
