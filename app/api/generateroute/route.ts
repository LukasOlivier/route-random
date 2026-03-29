import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import {
  generateCircularWaypoints,
  getNumPointsForDistance,
} from "../../utils/waypointGeneration";
import {
  generateWalkingRoute,
  generateRoundTripRoute,
} from "../../services/orsService";
import { notifyDiscord } from "@/app/utils/discordNotifications";

const TOLERANCE_CONFIG = {
  scalePercentage: 0.1,
  minToleranceMeters: 500,
  maxToleranceMeters: 2000,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      startLocation,
      distance,
      correctionFactor,
      waypoints,
      regenerate,
      useRoundTrip = true,
      seed,
      preferences,
    } = body;

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

      const distanceTolerance = Math.max(
        TOLERANCE_CONFIG.minToleranceMeters,
        Math.min(
          TOLERANCE_CONFIG.maxToleranceMeters,
          targetDistanceMeters * TOLERANCE_CONFIG.scalePercentage,
        ),
      );

      const shouldUseRoundTrip =
        useRoundTrip !== false && targetDistanceMeters >= 2000;

      if (shouldUseRoundTrip) {
        const maxAttempts = 3;
        let bestRoute = null;
        let bestDistanceDiff = Infinity;

        const correctionFactors = [0.78, 0.72, 0.68];

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            const attemptSeed =
              seed !== undefined ? seed + attempt - 1 : undefined;
            const numPoints = getNumPointsForDistance(distance);

            const adjustedDistance = Math.round(
              targetDistanceMeters * correctionFactors[attempt - 1],
            );

            const attemptRoute = await generateRoundTripRoute(
              startLat,
              startLng,
              adjustedDistance,
              orsApiKey,
              numPoints,
              attemptSeed,
              preferences,
            );

            const distanceDiff = Math.abs(
              attemptRoute.distance - targetDistanceMeters,
            );

            if (distanceDiff < bestDistanceDiff) {
              bestDistanceDiff = distanceDiff;
              bestRoute = attemptRoute;
            }

            if (distanceDiff <= distanceTolerance) {
              console.log(
                `✓ Round-trip route found on attempt ${attempt}: ${attemptRoute.distance}m (target: ${targetDistanceMeters}m, diff: ${distanceDiff}m)`,
              );
              route = attemptRoute;
              finalWaypoints = extractWaypointsFromRoute(
                attemptRoute,
                startLng,
                startLat,
                numPoints,
              );
              break;
            }
          } catch (error) {
            console.log(`Round-trip attempt ${attempt} failed:`, error);
            if (attempt === maxAttempts) throw error;
          }
        }

        if (!route && bestRoute) {
          console.log(
            `⚠ Using best round-trip attempt: ${bestRoute.distance}m (target: ${targetDistanceMeters}m, diff: ${bestDistanceDiff}m)`,
          );
          route = bestRoute;
          const numPoints = getNumPointsForDistance(distance);
          finalWaypoints = extractWaypointsFromRoute(
            bestRoute,
            startLng,
            startLat,
            numPoints,
          );
        }
      }

      if (!route) {
        console.log("Using custom circular waypoint generation");
        finalWaypoints = generateCircularWaypoints(
          startLat,
          startLng,
          distance,
          undefined,
          correctionFactor || 0.65,
        );
        route = await generateWalkingRoute(finalWaypoints, orsApiKey);
      }
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

function extractWaypointsFromRoute(
  route: { coordinates: [number, number][]; distance: number },
  startLng: number,
  startLat: number,
  numPoints: number,
): [number, number][] {
  const waypoints: [number, number][] = [[startLng, startLat]];

  const coordinates = route.coordinates;
  if (Array.isArray(coordinates) && coordinates.length > 0) {
    const totalPoints = coordinates.length;
    const step = Math.floor(totalPoints / numPoints);

    for (let i = 1; i < numPoints; i++) {
      const index = Math.min(i * step, totalPoints - 1);
      waypoints.push(coordinates[index]);
    }
  }

  waypoints.push([startLng, startLat]);
  return waypoints;
}
