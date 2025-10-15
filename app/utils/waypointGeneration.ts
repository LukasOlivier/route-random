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
 */
export function calculateRadius(distance: number): number {
  return distance / (2 * Math.PI);
}

/**
 * Generate waypoints in a circular pattern around a starting location
 */
export function generateCircularWaypoints(
  startLat: number,
  startLng: number,
  distance: number,
  numWaypoints: number = 8
): [number, number][] {
  const radius = calculateRadius(distance);
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
  for (let i = 1; i <= numWaypoints; i++) {
    const bearing = (2 * Math.PI * i) / numWaypoints;

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

/**
 * Add some randomness to waypoints to make routes more interesting
 */
export function addRandomnessToWaypoints(
  waypoints: [number, number][],
  randomnessFactor: number = 0.3
): [number, number][] {
  return waypoints.map((waypoint, index) => {
    // Don't modify start and end points
    if (index === 0 || index === waypoints.length - 1) {
      return waypoint;
    }

    // Add random offset within the randomness factor
    const [lng, lat] = waypoint;
    const randomOffsetLng = (Math.random() - 0.5) * randomnessFactor * 0.01;
    const randomOffsetLat = (Math.random() - 0.5) * randomnessFactor * 0.01;

    return [lng + randomOffsetLng, lat + randomOffsetLat] as [number, number];
  });
}
