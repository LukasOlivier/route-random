"use client";

import {
  useLocationStore,
  useRouteFormStore,
  Mode,
  useNotificationStore,
} from "../../stores";
import { useTranslations } from "next-intl";
import {
  calculateDistanceFromTime,
  isRequestedRoundTripDistanceTooLong,
  MAX_REQUESTED_ROUND_TRIP_DISTANCE_KM,
} from "../utils/routeCalculations";

type RouteErrorKind =
  | "serviceUnavailable"
  | "rateLimited"
  | "noRouteFound"
  | "distanceTooLong"
  | "generic";

function sanitizeRouteErrorKind(error: unknown): RouteErrorKind {
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
    if (errorData?.errorCode === "route_rate_limited") {
      return "rateLimited";
    }

    if (errorData?.errorCode === "route_service_unavailable") {
      return "serviceUnavailable";
    }

    if (errorData?.errorCode === "route_not_found") {
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

function tryStartRouteGeneration(): boolean {
  const store = useRouteFormStore.getState();
  if (store.isGeneratingRoute) return false;
  store.setIsGeneratingRoute(true);
  return true;
}

export function useRouteGeneration() {
  const t = useTranslations("RouteGenerationNotifications");
  const { startLocation, setGeneratedRoute, setStartLocation } =
    useLocationStore();
  const showNotification = useNotificationStore((s) => s.showNotification);

  const {
    mode,
    pace,
    distance,
    time,
    pattern,
    isGeneratingRoute,
    setIsGeneratingRoute,
  } = useRouteFormStore();

  const generateRoute = async (formData?: {
    distance?: string;
    time?: string;
  }) => {
    const distanceInput = formData?.distance || distance;
    const timeInput = formData?.time || time;

    let finalDistance: number;

    if (mode === Mode.DISTANCE) {
      if (!distanceInput) {
        showNotification(t("enterDistance"), { variant: "error" });
        return;
      }
      finalDistance = parseFloat(distanceInput);
    } else {
      if (!timeInput) {
        showNotification(t("enterTimeDuration"), {
          variant: "error",
        });
        return;
      }
      const timeMinutes = parseFloat(timeInput);
      finalDistance = calculateDistanceFromTime(timeMinutes, pace);
    }

    if (!startLocation) {
      showNotification(t("selectStartLocation"), {
        variant: "error",
      });
      return;
    }

    if (!Number.isFinite(finalDistance) || finalDistance <= 0) {
      showNotification(t("enterDistance"), { variant: "error" });
      return;
    }

    if (isRequestedRoundTripDistanceTooLong(finalDistance)) {
      showNotification(
        t("routeDistanceTooLong", {
          maxDistanceKm: MAX_REQUESTED_ROUND_TRIP_DISTANCE_KM.toFixed(0),
        }),
        { variant: "error" },
      );
      return;
    }

    if (!tryStartRouteGeneration()) return;

    try {
      const requestBody = {
        startLocation: startLocation,
        distance: finalDistance,
        pattern,
      };

      const response = await fetch("/api/generateroute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorKind = await getResponseErrorKind(response);
        throw new Error(errorKind);
      }

      const result = await response.json();

      if (result.success && result.route) {
        const {
          startLocation: snappedStart,
          startLocationAdjustmentMeters,
          ...routeData
        } = result.route;
        setGeneratedRoute(routeData);
        if (
          Array.isArray(snappedStart) &&
          snappedStart.length === 2 &&
          Number.isFinite(snappedStart[0]) &&
          Number.isFinite(snappedStart[1])
        ) {
          setStartLocation([snappedStart[0], snappedStart[1]]);
        }

        if (
          typeof startLocationAdjustmentMeters === "number" &&
          startLocationAdjustmentMeters > 0
        ) {
          showNotification(
            t("startLocationAdjusted", {
              distanceMeters: Math.round(startLocationAdjustmentMeters),
            }),
            { variant: "info" },
          );
        }
      }
    } catch (error) {
      console.error("Error generating route:", error);
      const errorKind = sanitizeRouteErrorKind(error);

      const errorMessage =
        errorKind === "serviceUnavailable"
          ? t("routeServiceUnavailable")
          : errorKind === "rateLimited"
            ? t("routeRateLimited")
            : errorKind === "noRouteFound"
              ? t("noRouteFound")
              : errorKind === "distanceTooLong"
                ? t("routeDistanceTooLong", {
                    maxDistanceKm:
                      MAX_REQUESTED_ROUND_TRIP_DISTANCE_KM.toFixed(0),
                  })
                : t("failedGenerate");

      showNotification(errorMessage, { variant: "error" });
    } finally {
      setIsGeneratingRoute(false);
    }
  };

  const regenerateRouteFromWaypoints = async (
    waypoints: [number, number][],
  ) => {
    if (!waypoints || waypoints.length < 2 || !tryStartRouteGeneration()) {
      return;
    }

    try {
      const waypointsForApi = waypoints.map(([lat, lng]) => [lng, lat]);

      const requestBody = {
        waypoints: waypointsForApi,
        regenerate: true,
      };

      const response = await fetch("/api/generateroute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorKind = await getResponseErrorKind(response);
        throw new Error(errorKind);
      }

      const result = await response.json();

      if (result.success && result.route) {
        const snappedStart = result.route.startLocation;
        const routeData = { ...result.route };
        delete routeData.startLocation;
        delete routeData.startLocationAdjustmentMeters;
        setGeneratedRoute(routeData);
        if (
          Array.isArray(snappedStart) &&
          snappedStart.length === 2 &&
          Number.isFinite(snappedStart[0]) &&
          Number.isFinite(snappedStart[1])
        ) {
          setStartLocation([snappedStart[0], snappedStart[1]]);
        }
      } else {
        throw new Error("generic");
      }
    } catch (error) {
      console.error("Error regenerating route:", error);
      const errorKind = sanitizeRouteErrorKind(error);

      const errorMessage =
        errorKind === "serviceUnavailable"
          ? t("routeServiceUnavailable")
          : errorKind === "rateLimited"
            ? t("routeRateLimited")
            : errorKind === "noRouteFound"
              ? t("noRouteFound")
              : errorKind === "distanceTooLong"
                ? t("routeDistanceTooLong")
                : t("failedRegenerate");

      showNotification(errorMessage, { variant: "error" });
    } finally {
      setIsGeneratingRoute(false);
    }
  };

  return {
    generateRoute,
    regenerateRouteFromWaypoints,
    isGeneratingRoute,
  };
}
