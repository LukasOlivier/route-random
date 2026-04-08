"use client";

import { useEffect, useRef } from "react";
import { Navigation, NavigationOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocationStore, useNotificationStore } from "../../stores";
import {
  getLocationErrorMessageKey,
  getLocationPermissionState,
} from "../utils/geolocationDiagnostics";
import FloatingButton from "./FloatingButton";

export default function TrackUserLocationButton() {
  const t = useTranslations("TrackUserLocationButton");
  const showNotification = useNotificationStore((s) => s.showNotification);
  const { isTrackingLocation, setLocationTracking, setUserLocation } =
    useLocationStore();

  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const startTracking = async () => {
    if (!navigator.geolocation) {
      showNotification(t("geolocationNotSupported"), { variant: "error" });
      return;
    }

    const permissionState = await getLocationPermissionState();
    if (permissionState === "denied") {
      showNotification(t("locationPermissionDenied"), {
        variant: "error",
        durationMs: 6500,
      });
      return;
    }

    if (permissionState === "prompt") {
      showNotification(t("allowLocationPrompt"), {
        durationMs: 5000,
      });
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 5000,
    };

    const success = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      setUserLocation([latitude, longitude]);
    };

    const error = async (error: GeolocationPositionError) => {
      console.error("Error getting location:", error);
      setLocationTracking(false);

      const messageKey = await getLocationErrorMessageKey(error);
      const message = t(messageKey);
      showNotification(message, { variant: "error" });
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      success,
      error,
      options,
    );

    setLocationTracking(true);
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setLocationTracking(false);
  };

  const toggleTracking = () => {
    if (isTrackingLocation) {
      stopTracking();
    } else {
      void startTracking();
    }
  };

  return (
    <FloatingButton
      onClick={toggleTracking}
      variant={isTrackingLocation ? "active" : "default"}
      ariaLabel={isTrackingLocation ? t("stopTracking") : t("trackLocation")}
      title={isTrackingLocation ? t("stopTracking") : t("trackYourLocation")}
      hideOnDesktop={true}
      umamiEvent={
        isTrackingLocation
          ? "Stop location tracking"
          : "Start location tracking"
      }
      umamiEventData={{
        source: "floating-actions",
        action: isTrackingLocation ? "stop" : "start",
      }}
    >
      {isTrackingLocation ? (
        <Navigation size={20} />
      ) : (
        <NavigationOff size={20} />
      )}
    </FloatingButton>
  );
}
