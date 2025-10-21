/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Calculate the radius in kilometers for a circular route
 * Uses the formula: radius = circumference / (2 * π)
 * Applies a correction factor to account for routing overhead
 */
export function calculateRadius(
  distance: number,
  correctionFactor: number = 0.65
): number {
  // Apply correction factor to account for routing detours and road following
  return (distance * correctionFactor) / (2 * Math.PI);
}

/**
 * Choose round-trip point count based on distance (in kilometers)
 * Optimized for better route distribution
 */
export function getNumPointsForDistance(distanceKm: number): number {
  let points = 5;
  // per multiple of 5km, add 1 point, up to max of 12
  for (let i = 5; i <= distanceKm; i += 5) {
    points++;
  }
  // keep within a sensible range
  return Math.max(3, Math.min(12, points));
}

/**
 * Generate waypoints in a circular pattern around a starting location
 */
export function generateCircularWaypoints(
  startLat: number,
  startLng: number,
  distance: number,
  numWaypoints?: number,
  correctionFactor?: number
): [number, number][] {
  // Use dynamic waypoint count if not specified
  const actualNumWaypoints = numWaypoints || getNumPointsForDistance(distance);

  const radius = calculateRadius(distance, correctionFactor);
  const waypoints: [number, number][] = [];

  // Add starting point
  waypoints.push([startLng, startLat]);

  // Earth's radius in kilometers
  const earthRadius = 6371;

  // Calculate angular distance
  const angularDistance = radius / earthRadius;

  // Convert to radians
  const lat1 = toRadians(startLat);
  const lng1 = toRadians(startLng);

  // Generate waypoints around the circle
  for (let i = 1; i <= actualNumWaypoints; i++) {
    const bearing = (2 * Math.PI * i) / actualNumWaypoints;

    // Calculate new latitude
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(angularDistance) +
        Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing)
    );

    // Calculate new longitude
    const lng2 =
      lng1 +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
        Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
      );

    waypoints.push([toDegrees(lng2), toDegrees(lat2)]);
  }

  // Add starting point again to complete the circle
  waypoints.push([startLng, startLat]);

  return waypoints;
}
