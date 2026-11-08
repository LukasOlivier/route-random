import { getLogger } from "@/lib/logger";
import { CircuitBreaker } from "../utils/circuitBreaker";
import {
  classifyOrsError,
  isTransientOrsStatus,
  RouteServiceError,
} from "./orsErrors";
import type { ORSRoute } from "./orsTypes";

const logger = getLogger("orsClient");

const ORS_API_URL =
  "https://api.openrouteservice.org/v2/directions/foot-hiking/geojson";
const ORS_REQUEST_TIMEOUT_MS = 15_000;
const ORS_TRANSIENT_RETRY_DELAY_MS = 300;
const ORS_CIRCUIT_BREAKER_THRESHOLD = 3;
const ORS_CIRCUIT_BREAKER_COOLDOWN_MS = 15_000;
const orsCircuitBreaker = new CircuitBreaker(
  ORS_CIRCUIT_BREAKER_THRESHOLD,
  ORS_CIRCUIT_BREAKER_COOLDOWN_MS,
);

function buildOrsRequestHeaders(apiKey: string) {
  return {
    Accept:
      "application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8",
    Authorization: apiKey,
    "Content-Type": "application/json; charset=utf-8",
  };
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function requestOrsRoute(
  requestBody: object,
  apiKey: string,
): Promise<ORSRoute> {
  if (!orsCircuitBreaker.canRequest()) {
    throw new RouteServiceError(
      "ORS circuit breaker is temporarily open",
      "unavailable",
    );
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      ORS_REQUEST_TIMEOUT_MS,
    );

    try {
      const response = await fetch(ORS_API_URL, {
        method: "POST",
        headers: buildOrsRequestHeaders(apiKey),
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = (await response.text()).slice(0, 2_000);
        const error = classifyOrsError(
          response.status,
          errorText,
          response.headers.get("Retry-After"),
        );

        if (
          attempt === 0 &&
          error.status !== undefined &&
          isTransientOrsStatus(error.status)
        ) {
          await sleep(
            ORS_TRANSIENT_RETRY_DELAY_MS + Math.floor(Math.random() * 200),
          );
          continue;
        }

        if (error.status !== undefined && isTransientOrsStatus(error.status)) {
          orsCircuitBreaker.recordFailure();
        }
        throw error;
      }

      const data = (await response.json()) as ORSRoute;
      orsCircuitBreaker.recordSuccess();
      return data;
    } catch (error) {
      if (error instanceof RouteServiceError) {
        throw error;
      }

      if (attempt === 0) {
        logger.warn(
          { error: error instanceof Error ? error.message : String(error) },
          "Retrying transient ORS request failure",
        );
        await sleep(
          ORS_TRANSIENT_RETRY_DELAY_MS + Math.floor(Math.random() * 200),
        );
        continue;
      }

      orsCircuitBreaker.recordFailure();
      throw new RouteServiceError(
        error instanceof Error ? error.message : "ORS request failed",
        "unavailable",
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new RouteServiceError("ORS request failed", "unavailable");
}
