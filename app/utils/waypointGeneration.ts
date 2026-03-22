function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

function calculateRadius(
  distance: number,
  correctionFactor: number = 0.65,
): number {
  return (distance * correctionFactor) / (2 * Math.PI);
}

export function getNumPointsForDistance(distanceKm: number): number {
  let points = 5;
  for (let i = 5; i <= distanceKm; i += 5) {
    points++;
  }
  return Math.max(3, Math.min(12, points));
}

export function generateCircularWaypoints(
  startLat: number,
  startLng: number,
  distance: number,
  numWaypoints?: number,
  correctionFactor?: number,
): [number, number][] {
  const actualNumWaypoints = numWaypoints || getNumPointsForDistance(distance);

  const radius = calculateRadius(distance, correctionFactor);
  const waypoints: [number, number][] = [];

  waypoints.push([startLng, startLat]);
  const earthRadius = 6371;

  const angularDistance = radius / earthRadius;
  const lat1 = toRadians(startLat);
  const lng1 = toRadians(startLng);

  for (let i = 1; i <= actualNumWaypoints; i++) {
    const bearing = (2 * Math.PI * i) / actualNumWaypoints;

    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(angularDistance) +
        Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing),
    );

    const lng2 =
      lng1 +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
        Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2),
      );

    waypoints.push([toDegrees(lng2), toDegrees(lat2)]);
  }

  waypoints.push([startLng, startLat]);

  return waypoints;
}
