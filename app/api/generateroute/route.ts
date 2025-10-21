import { NextRequest, NextResponse } from "next/server";
import {
  generateCircularWaypoints,
  getNumPointsForDistance,
} from "../../utils/waypointGeneration";
import {
  generateWalkingRoute,
  generateRoundTripRoute,
} from "../../services/orsService";

// Configuration for distance tolerance
const TOLERANCE_CONFIG = {
  scalePercentage: 0.1, // 10% tolerance
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
      useRoundTrip = true, // Default to using ORS round-trip
      seed,
      preferences,
    } = body;

    // Validate ORS API key
    const orsApiKey = process.env.ORS_API_KEY;
    if (!orsApiKey) {
      return NextResponse.json(
        { error: "ORS API key not configured" },
        { status: 500 }
      );
    }

    let finalWaypoints: [number, number][] | undefined;
    let route;

    if (regenerate && waypoints) {
      // Use existing waypoints for regeneration (user moved a marker)
      finalWaypoints = waypoints;
      route = await generateWalkingRoute(waypoints, orsApiKey);
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

      // Convert distance from km to meters for ORS
      const targetDistanceMeters = distance * 1000;

      // Calculate distance tolerance
      const distanceTolerance = Math.max(
        TOLERANCE_CONFIG.minToleranceMeters,
        Math.min(
          TOLERANCE_CONFIG.maxToleranceMeters,
          targetDistanceMeters * TOLERANCE_CONFIG.scalePercentage
        )
      );

      // Prefer ORS round-trip for distances >= 2km
      const shouldUseRoundTrip =
        useRoundTrip !== false && targetDistanceMeters >= 2000;

      if (shouldUseRoundTrip) {
        // Use ORS native round-trip with retry logic
        const maxAttempts = 3;
        let bestRoute = null;
        let bestDistanceDiff = Infinity;

        // Start with a smaller correction and adjust in subsequent attempts
        const correctionFactors = [0.78, 0.72, 0.68]; // Try different adjustments

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            const attemptSeed =
              seed !== undefined ? seed + attempt - 1 : undefined;
            const numPoints = getNumPointsForDistance(distance);

            // Apply correction factor to get closer to target distance
            const adjustedDistance = Math.round(
              targetDistanceMeters * correctionFactors[attempt - 1]
            );

            const attemptRoute = await generateRoundTripRoute(
              startLat,
              startLng,
              adjustedDistance,
              orsApiKey,
              numPoints,
              attemptSeed,
              preferences
            );

            const distanceDiff = Math.abs(
              attemptRoute.distance - targetDistanceMeters
            );

            // Keep track of best attempt
            if (distanceDiff < bestDistanceDiff) {
              bestDistanceDiff = distanceDiff;
              bestRoute = attemptRoute;
            }

            // If within tolerance, use this route
            if (distanceDiff <= distanceTolerance) {
              console.log(
                `✓ Round-trip route found on attempt ${attempt}: ${attemptRoute.distance}m (target: ${targetDistanceMeters}m, diff: ${distanceDiff}m)`
              );
              route = attemptRoute;
              // Extract waypoints from the route for display
              finalWaypoints = extractWaypointsFromRoute(
                attemptRoute,
                startLng,
                startLat,
                numPoints
              );
              break;
            }
          } catch (error) {
            console.log(`Round-trip attempt ${attempt} failed:`, error);
            if (attempt === maxAttempts) throw error;
          }
        }

        // If no route within tolerance, use best attempt
        if (!route && bestRoute) {
          console.log(
            `⚠ Using best round-trip attempt: ${bestRoute.distance}m (target: ${targetDistanceMeters}m, diff: ${bestDistanceDiff}m)`
          );
          route = bestRoute;
          const numPoints = getNumPointsForDistance(distance);
          finalWaypoints = extractWaypointsFromRoute(
            bestRoute,
            startLng,
            startLat,
            numPoints
          );
        }
      }

      // Fallback to custom circular waypoint generation
      if (!route) {
        console.log("Using custom circular waypoint generation");
        finalWaypoints = generateCircularWaypoints(
          startLat,
          startLng,
          distance,
          undefined,
          correctionFactor || 0.65
        );
        route = await generateWalkingRoute(finalWaypoints, orsApiKey);
      }
    }

    return NextResponse.json({
      success: true,
      route: {
        coordinates: route.coordinates,
        distance: route.distance,
        waypoints: finalWaypoints
          ? finalWaypoints.map(([lng, lat]) => [lat, lng] as [number, number])
          : undefined,
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

/**
 * Extract waypoints from a generated route for visualization
 */
function extractWaypointsFromRoute(
  route: { coordinates: [number, number][]; distance: number },
  startLng: number,
  startLat: number,
  numPoints: number
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
