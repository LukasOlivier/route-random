import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import {
  generateWalkingRoute,
  generateRoundTripRoute,
} from "../../services/orsService";
import { notifyDiscord } from "@/app/utils/discordNotifications";
import { getLogger } from "@/lib/logger";

const logger = getLogger("api.generateroute");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { startLocation, distance, waypoints, regenerate } = body;

    logger.debug(
      {
        regenerate,
        hasWaypoints: !!waypoints,
        hasStartLocation: !!startLocation,
        distance,
      },
      "Route generation request received",
    );

    const orsApiKey = process.env.ORS_API_KEY;
    if (!orsApiKey) {
      logger.error("ORS_API_KEY environment variable not configured");
      return NextResponse.json(
        { error: "ORS API key not configured" },
        { status: 500 },
      );
    }

    let finalWaypoints: [number, number][] | undefined;
    let route;

    if (regenerate && waypoints) {
      logger.info(
        { waypointCount: waypoints.length },
        "Regenerating walking route from existing waypoints",
      );
      finalWaypoints = waypoints;
      route = await generateWalkingRoute(waypoints, orsApiKey);
    } else {
      if (!startLocation) {
        logger.warn("Route generation request missing start location");
        return NextResponse.json(
          { error: "Starting location is required" },
          { status: 400 },
        );
      }

      if (!distance || distance <= 0) {
        logger.warn(
          { distance },
          "Route generation request with invalid distance",
        );
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
      logger.info(
        { startLat, startLng, distanceKm: distance },
        "Generating round trip route",
      );

      route = await generateRoundTripRoute(
        startLat,
        startLng,
        targetDistanceMeters,
        orsApiKey,
      );
    }

    logger.info(
      { distance: (route.distance / 1000).toFixed(2) },
      "Route generated successfully",
    );

    return NextResponse.json({
      success: true,
      route: {
        coordinates: route.coordinates,
        distance: route.distance,
        elevationGain: route.elevation?.gain,
        waypoints: route.waypoints
          ? route.waypoints.map(([lng, lat]) => [lat, lng] as [number, number])
          : finalWaypoints
            ? finalWaypoints.map(([lng, lat]) => [lat, lng] as [number, number])
            : undefined,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    logger.error(
      {
        error: errorMessage,
        errorType:
          error instanceof Error ? error.constructor.name : typeof error,
      },
      "Route generation failed",
    );

    after(() =>
      notifyDiscord({
        event: "route_generation_failed",
        errorMessage,
      }),
    );

    if (error instanceof Error) {
      if (error.message.includes("ORS API error")) {
        logger.warn("ORS API service error");
        return NextResponse.json(
          { error: "Route service unavailable. Please try again later." },
          { status: 503 },
        );
      }
      if (error.message.includes("No route found")) {
        logger.warn("No valid route found for requested parameters");
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
