"use client";

import {
  useLocationStore,
  useRouteFormStore,
  Mode,
  useNotificationStore,
} from "../../stores";
import { useTranslations } from "next-intl";
import { calculateDistanceFromTime } from "../utils/routeCalculations";

type RouteErrorKind =
  | "serviceUnavailable"
  | "rateLimited"
  | "noRouteFound"
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

export function useRouteGeneration() {
  const t = useTranslations("RouteGenerationNotifications");
  const { startLocation, setGeneratedRoute } = useLocationStore();
  const showNotification = useNotificationStore((s) => s.showNotification);

  const {
    mode,
    pace,
    distance,
    time,
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

    try {
      setIsGeneratingRoute(true);

      const requestBody = {
        startLocation: startLocation,
        distance: finalDistance,
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
        setGeneratedRoute(result.route);
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
              : t("failedGenerate");

      showNotification(errorMessage, { variant: "error" });
    } finally {
      setIsGeneratingRoute(false);
    }
  };

  const regenerateRouteFromWaypoints = async (
    waypoints: [number, number][],
  ) => {
    if (!waypoints || waypoints.length === 0) return;

    try {
      setIsGeneratingRoute(true);

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
        setGeneratedRoute(result.route);
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
