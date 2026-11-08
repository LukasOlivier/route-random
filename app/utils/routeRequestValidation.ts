import { isValidRoutePattern, type RoutePattern } from "./routePatterns";
import { isValidLonLat } from "./routeQuality";

export type RouteStartLocation =
  [number, number] | { lat: number; lng: number };

export interface RouteGenerationRequestBody {
  startLocation?: RouteStartLocation;
  distance?: number;
  waypoints?: [number, number][];
  regenerate?: boolean;
  pattern?: RoutePattern;
}

export function isValidStartLocation(
  value: unknown,
): value is RouteStartLocation {
  if (Array.isArray(value)) {
    return (
      value.length === 2 &&
      typeof value[0] === "number" &&
      Number.isFinite(value[0]) &&
      value[0] >= -90 &&
      value[0] <= 90 &&
      typeof value[1] === "number" &&
      Number.isFinite(value[1]) &&
      value[1] >= -180 &&
      value[1] <= 180
    );
  }

  if (typeof value !== "object" || value === null) {
    return false;
  }

  const { lat, lng } = value as { lat?: unknown; lng?: unknown };
  return (
    typeof lat === "number" &&
    Number.isFinite(lat) &&
    lat >= -90 &&
    lat <= 90 &&
    typeof lng === "number" &&
    Number.isFinite(lng) &&
    lng >= -180 &&
    lng <= 180
  );
}

export function getRouteRequestValidationError(
  body: RouteGenerationRequestBody,
): string | undefined {
  if (body.regenerate !== undefined && typeof body.regenerate !== "boolean") {
    return "Invalid regenerate flag";
  }

  if (body.pattern !== undefined && !isValidRoutePattern(body.pattern)) {
    return "Invalid route pattern";
  }

  if (body.regenerate) {
    if (
      !Array.isArray(body.waypoints) ||
      body.waypoints.length < 2 ||
      body.waypoints.length > 50 ||
      body.waypoints.some((waypoint) => !isValidLonLat(waypoint))
    ) {
      return "At least two valid longitude/latitude waypoints are required";
    }

    return;
  }

  if (!isValidStartLocation(body.startLocation)) {
    return "A valid starting location is required";
  }

  if (
    typeof body.distance !== "number" ||
    !Number.isFinite(body.distance) ||
    body.distance <= 0
  ) {
    return "A valid route distance is required";
  }
}
