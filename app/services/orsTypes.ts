import type { RouteQualityMetrics } from "../utils/routeQuality";

export interface ORSRoute {
  type: string;
  features: Array<{
    type: string;
    properties: {
      segments: Array<{
        distance: number;
        ascent?: number;
        descent?: number;
      }>;
      elevation?: number[];
    };
    geometry: {
      coordinates: [number, number, ...number[]][];
      type: string;
    };
  }>;
}

export interface RouteResponse {
  coordinates: [number, number][];
  distance: number;
  elevation?: {
    gain: number;
    loss: number;
    min: number;
    max: number;
    profile: number[];
  };
  waypoints?: [number, number][];
  generationSummary?: RouteGenerationSummary;
}

export interface RouteGenerationAttempt {
  factor: number;
  correctedDistance?: number;
  routeDistance?: number;
  distanceDiff?: number;
  toleranceMeters: number;
  nextFactor?: number;
  outcome: "success" | "retry" | "error" | "fallback";
  errorMessage?: string;
  seed?: number;
  quality?: RouteQualityMetrics;
}

export interface RouteGenerationSummary {
  routeType: "roundTrip" | "rectangle";
  targetDistance: number;
  toleranceMeters: number;
  attempts: RouteGenerationAttempt[];
  bestAttempt?: RouteGenerationAttempt;
  selectedAttempt?: RouteGenerationAttempt;
}
