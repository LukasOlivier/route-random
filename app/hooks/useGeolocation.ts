"use client";

import { useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useNotificationStore } from "../../stores";
import {
  getLocationErrorMessageKey,
  getLocationPermissionState,
} from "../utils/geolocationDiagnostics";

export type Coordinates = [number, number];

const HIGH_ACCURACY: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 5000,
};

const LOW_ACCURACY: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 30000,
  maximumAge: 30000,
};

export function useGeolocation() {
  const t = useTranslations("SidebarForm");
  const showNotification = useNotificationStore((s) => s.showNotification);
  const watchIdRef = useRef<number | null>(null);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => stopWatching, [stopWatching]);

  const reportError = useCallback(
    async (error: GeolocationPositionError) => {
      console.error("Error getting location:", error);
      const messageKey = await getLocationErrorMessageKey(error);
      showNotification(t(messageKey), { variant: "error", durationMs: 6500 });
    },
    [showNotification, t],
  );

  const showPromptHint = useCallback(() => {
    void getLocationPermissionState().then((state) => {
      if (state === "prompt") {
        showNotification(t("allowLocationPrompt"), { durationMs: 5000 });
      }
    });
  }, [showNotification, t]);

  const reportUnsupported = useCallback(() => {
    showNotification(t("geolocationNotSupported"), { variant: "error" });
  }, [showNotification, t]);

  const getCurrentLocation = useCallback(
    (onSuccess: (coords: Coordinates) => void, onFailure?: () => void) => {
      if (!navigator.geolocation) {
        reportUnsupported();
        onFailure?.();
        return;
      }

      const attempt = (options: PositionOptions) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            onSuccess([position.coords.latitude, position.coords.longitude]);
          },
          (error) => {
            if (
              options.enableHighAccuracy &&
              error.code !== error.PERMISSION_DENIED
            ) {
              attempt(LOW_ACCURACY);
              return;
            }
            void reportError(error);
            onFailure?.();
          },
          options,
        );
      };

      attempt(HIGH_ACCURACY);
      showPromptHint();
    },
    [reportError, reportUnsupported, showPromptHint],
  );

  const startWatching = useCallback(
    (onPosition: (coords: Coordinates) => void, onFailure?: () => void) => {
      if (!navigator.geolocation) {
        reportUnsupported();
        onFailure?.();
        return false;
      }

      const begin = (options: PositionOptions) => {
        stopWatching();
        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            onPosition([position.coords.latitude, position.coords.longitude]);
          },
          (error) => {
            stopWatching();
            if (
              options.enableHighAccuracy &&
              error.code !== error.PERMISSION_DENIED
            ) {
              begin(LOW_ACCURACY);
              return;
            }
            void reportError(error);
            onFailure?.();
          },
          options,
        );
      };

      begin(HIGH_ACCURACY);
      showPromptHint();
      return true;
    },
    [reportError, reportUnsupported, showPromptHint, stopWatching],
  );

  return { getCurrentLocation, startWatching, stopWatching };
}
