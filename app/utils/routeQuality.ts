export type LonLat = [number, number];

const EARTH_RADIUS_METERS = 6_371_000;
export const MAX_LOOP_CLOSURE_METERS = 50;
export const MAX_REPEATED_SEGMENT_PERCENTAGE = 0.15;
export const MIN_SPATIAL_COMPACTNESS = 0.01;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function isValidLonLat(value: unknown): value is LonLat {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === "number" &&
    Number.isFinite(value[0]) &&
    value[0] >= -180 &&
    value[0] <= 180 &&
    typeof value[1] === "number" &&
    Number.isFinite(value[1]) &&
    value[1] >= -90 &&
    value[1] <= 90
  );
}

export function distanceBetweenLonLat(first: LonLat, second: LonLat): number {
  const latitudeDelta = toRadians(second[1] - first[1]);
  const longitudeDelta = toRadians(second[0] - first[0]);
  const firstLatitude = toRadians(first[1]);
  const secondLatitude = toRadians(second[1]);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return (
    2 *
    EARTH_RADIUS_METERS *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
}

function segmentKey(first: LonLat, second: LonLat): string {
  const pointKey = ([longitude, latitude]: LonLat) =>
    `${Math.round(longitude * 100_000)},${Math.round(latitude * 100_000)}`;
  const firstKey = pointKey(first);
  const secondKey = pointKey(second);

  return firstKey < secondKey
    ? `${firstKey}|${secondKey}`
    : `${secondKey}|${firstKey}`;
}

export interface RouteQualityMetrics {
  closureDistanceMeters: number;
  repeatedSegmentDistanceMeters: number;
  repeatedSegmentPercentage: number;
  geometryDistanceMeters: number;
  spatialCompactness: number;
}

export interface RouteQualityAssessment {
  metrics: RouteQualityMetrics;
  reason?: string;
}

export function measureRouteQuality(
  coordinates: LonLat[],
): RouteQualityMetrics {
  if (
    coordinates.length < 2 ||
    coordinates.some((coordinate) => !isValidLonLat(coordinate))
  ) {
    throw new Error("Route geometry contains invalid coordinates");
  }

  const segmentCounts = new Map<string, number>();
  let geometryDistanceMeters = 0;
  let repeatedSegmentDistanceMeters = 0;
  const firstLongitude = coordinates[0][0];
  let minimumLongitudeOffset = Infinity;
  let maximumLongitudeOffset = -Infinity;
  let minimumLatitude = Infinity;
  let maximumLatitude = -Infinity;
  for (const [longitude, latitude] of coordinates) {
    const difference =
      ((((longitude - firstLongitude + 180) % 360) + 360) % 360) - 180;
    minimumLongitudeOffset = Math.min(minimumLongitudeOffset, difference);
    maximumLongitudeOffset = Math.max(maximumLongitudeOffset, difference);
    minimumLatitude = Math.min(minimumLatitude, latitude);
    maximumLatitude = Math.max(maximumLatitude, latitude);
  }

  for (let index = 1; index < coordinates.length; index += 1) {
    const previous = coordinates[index - 1];
    const current = coordinates[index];
    const segmentDistance = distanceBetweenLonLat(previous, current);
    const key = segmentKey(previous, current);

    geometryDistanceMeters += segmentDistance;
    if (segmentCounts.has(key)) {
      repeatedSegmentDistanceMeters += segmentDistance;
    }
    segmentCounts.set(key, (segmentCounts.get(key) ?? 0) + 1);
  }

  const longitudeSpan = maximumLongitudeOffset - minimumLongitudeOffset;
  const latitudeSpan = maximumLatitude - minimumLatitude;
  const meanLatitude = (maximumLatitude + minimumLatitude) / 2;
  const boundingBoxWidthMeters =
    (longitudeSpan *
      Math.cos(toRadians(meanLatitude)) *
      (EARTH_RADIUS_METERS * Math.PI)) /
    180;
  const boundingBoxHeightMeters =
    latitudeSpan * ((EARTH_RADIUS_METERS * Math.PI) / 180);

  return {
    closureDistanceMeters: distanceBetweenLonLat(
      coordinates[0],
      coordinates[coordinates.length - 1],
    ),
    repeatedSegmentDistanceMeters,
    repeatedSegmentPercentage:
      geometryDistanceMeters === 0
        ? 1
        : repeatedSegmentDistanceMeters / geometryDistanceMeters,
    geometryDistanceMeters,
    spatialCompactness:
      geometryDistanceMeters === 0
        ? 0
        : (boundingBoxWidthMeters * boundingBoxHeightMeters) /
          geometryDistanceMeters ** 2,
  };
}

export function getRouteDistanceTolerance(
  targetDistanceMeters: number,
): number {
  return Math.max(100, targetDistanceMeters * 0.05);
}

export function assessRouteQuality(
  coordinates: LonLat[],
  distanceMeters: number,
  targetDistanceMeters?: number,
  toleranceMeters?: number,
): RouteQualityAssessment {
  const metrics = measureRouteQuality(coordinates);

  if (metrics.closureDistanceMeters > MAX_LOOP_CLOSURE_METERS) {
    return { metrics, reason: "Route does not return close to its start" };
  }

  if (metrics.repeatedSegmentPercentage > MAX_REPEATED_SEGMENT_PERCENTAGE) {
    return { metrics, reason: "Route repeats too many road segments" };
  }

  if (metrics.spatialCompactness < MIN_SPATIAL_COMPACTNESS) {
    return {
      metrics,
      reason: "Route does not cover a sufficiently broad area",
    };
  }

  if (!Number.isFinite(distanceMeters) || distanceMeters <= 0) {
    return { metrics, reason: "Route has an invalid reported distance" };
  }

  if (
    targetDistanceMeters !== undefined &&
    toleranceMeters !== undefined &&
    Math.abs(distanceMeters - targetDistanceMeters) > toleranceMeters
  ) {
    return { metrics, reason: "Route is outside the requested distance range" };
  }

  return { metrics };
}
