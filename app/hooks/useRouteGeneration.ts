"use client";

import { useShallow } from "zustand/react/shallow";

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

import {
  requestGeneratedRoute,
  sanitizeRouteErrorKind,
  type GeneratedRouteResult,
} from "../services/routeClient";
import { isValidStartLocation } from "../utils/routeRequestValidation";

function tryStartRouteGeneration(): boolean {
  const store = useRouteFormStore.getState();
  if (store.isGeneratingRoute) return false;
  store.setIsGeneratingRoute(true);
  return true;
}

export function useRouteGeneration() {
  const t = useTranslations("RouteGenerationNotifications");
  const { startLocation, setGeneratedRoute, setStartLocation } =
    useLocationStore(
      useShallow((state) => ({
        startLocation: state.startLocation,
        setGeneratedRoute: state.setGeneratedRoute,
        setStartLocation: state.setStartLocation,
      })),
    );
  const showNotification = useNotificationStore((s) => s.showNotification);

  const {
    mode,
    pace,
    distance,
    time,
    pattern,
    isGeneratingRoute,
    setIsGeneratingRoute,
  } = useRouteFormStore(
    useShallow((state) => ({
      mode: state.mode,
      pace: state.pace,
      distance: state.distance,
      time: state.time,
      pattern: state.pattern,
      isGeneratingRoute: state.isGeneratingRoute,
      setIsGeneratingRoute: state.setIsGeneratingRoute,
    })),
  );

  const applyRoute = (route: GeneratedRouteResult["route"]) => {
    if (!route) return;
    setGeneratedRoute({
      coordinates: route.coordinates,
      distance: route.distance,
      elevationGain: route.elevationGain,
      waypoints: route.waypoints,
    });
    if (
      Array.isArray(route.startLocation) &&
      isValidStartLocation(route.startLocation)
    ) {
      setStartLocation(route.startLocation);
    }
  };

  const notifyError = (
    error: unknown,
    fallback: "failedGenerate" | "failedRegenerate",
  ) => {
    const kind = sanitizeRouteErrorKind(error);
    const messages = {
      serviceUnavailable: "routeServiceUnavailable",
      rateLimited: "routeRateLimited",
      noRouteFound: "noRouteFound",
      distanceTooLong: "routeDistanceTooLong",
      generic: fallback,
    } as const;
    showNotification(
      t(messages[kind], {
        maxDistanceKm: MAX_REQUESTED_ROUND_TRIP_DISTANCE_KM.toFixed(0),
      }),
      { variant: "error" },
    );
  };

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
        startLocation: Array.isArray(startLocation)
          ? ([startLocation[0], startLocation[1]] as [number, number])
          : { lat: startLocation.lat, lng: startLocation.lng },
        distance: finalDistance,
        pattern,
      };

      const result = await requestGeneratedRoute(requestBody);

      if (result.success && result.route) {
        const {
          startLocationAdjustmentMeters,
          distanceFallback,
          ...routeData
        } = result.route;
        applyRoute(result.route);

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
      notifyError(error, "failedGenerate");
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
      const waypointsForApi = waypoints.map(([lat, lng]): [number, number] => [
        lng,
        lat,
      ]);

      const requestBody = {
        waypoints: waypointsForApi,
        regenerate: true,
      };

      const result = await requestGeneratedRoute(requestBody);

      applyRoute(result.route);
    } catch (error) {
      console.error("Error regenerating route:", error);
      notifyError(error, "failedRegenerate");
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
