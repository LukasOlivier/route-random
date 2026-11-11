import type { GeneratedRoute } from "@/types/route";
import type { RouteGenerationRequestBody } from "../utils/routeRequestValidation";

export type RouteErrorKind =
  | "serviceUnavailable"
  | "rateLimited"
  | "noRouteFound"
  | "distanceTooLong"
  | "generic";

export function sanitizeRouteErrorKind(error: unknown): RouteErrorKind {
  if (!(error instanceof Error)) {
    return "generic";
  }

  const message = error.message;
  if (message === "rateLimited") {
    return "rateLimited";
  }

  if (message === "serviceUnavailable") {
    return "serviceUnavailable";
  }

  if (message === "noRouteFound") {
    return "noRouteFound";
  }

  if (message === "distanceTooLong") {
    return "distanceTooLong";
  }

  if (
    message.includes("ORS API error: 429") ||
    message.includes("HTTP error! status: 429")
  ) {
    return "rateLimited";
  }

  if (
    message.includes("ORS API error") ||
    message.includes("HTTP error! status: 5")
  ) {
    return "serviceUnavailable";
  }

  if (message.includes("No route found")) {
    return "noRouteFound";
  }

  if (message.includes("route_distance_too_long")) {
    return "distanceTooLong";
  }

  return "generic";
}

async function getResponseErrorKind(
  response: Response,
): Promise<RouteErrorKind> {
  if (response.status === 429) {
    return "rateLimited";
  }

  if (response.status >= 500) {
    return "serviceUnavailable";
  }

  try {
    const errorData = await response.json();
    if (errorData?.errorCode === "route_distance_too_long")
      return "distanceTooLong";
    if (errorData?.errorCode === "route_rate_limited") {
      return "rateLimited";
    }

    if (errorData?.errorCode === "route_service_unavailable") {
      return "serviceUnavailable";
    }

    if (errorData?.errorCode === "route_not_found") {
      return "noRouteFound";
    }

    if (errorData?.errorCode === "invalid_start_location") {
      return "noRouteFound";
    }

    const errorMessage =
      typeof errorData?.error === "string" ? errorData.error : "";

    if (errorMessage.includes("429") || errorMessage.includes("Rate Limit")) {
      return "rateLimited";
    }

    if (
      errorMessage.includes("No route found") ||
      errorMessage.includes("Could not generate a route for this location")
    ) {
      return "noRouteFound";
    }
  } catch {
    // Ignore and fall back below.
  }

  return "generic";
}

export interface GeneratedRouteResult {
  success: boolean;
  route?: GeneratedRoute & {
    startLocation?: [number, number];
    startLocationAdjustmentMeters?: number;
    distanceFallback?: boolean;
  };
}

export async function requestGeneratedRoute(
  body: RouteGenerationRequestBody,
): Promise<GeneratedRouteResult> {
  const response = await fetch("/api/generateroute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await getResponseErrorKind(response));
  const result: GeneratedRouteResult = await response.json();
  if (!result.success || !result.route) throw new Error("generic");
  return result;
}
