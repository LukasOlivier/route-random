"use client";

import { useEffect, useRef } from "react";
import { Navigation, NavigationOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocationStore } from "../../stores/store";
import FloatingButton from "./FloatingButton";

export default function TrackUserLocationButton() {
  const t = useTranslations("TrackUserLocationButton");
  const { isTrackingLocation, setLocationTracking, setUserLocation } =
    useLocationStore();

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const startTracking = () => {
    if (!navigator.geolocation) {
      alert(t("geolocationNotSupported"));
      return;
    }

    const options = {
      enableHighAccuracy: true, // Uses GPS when available
      timeout: 10000, // 10 seconds timeout for each location request
      maximumAge: 5000, // Accepts cached locations up to 5 seconds old
    };

    const success = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      setUserLocation([latitude, longitude]);
    };

    const error = (error: GeolocationPositionError) => {
      console.error("Error getting location:", error);
      setLocationTracking(false);

      let message = t("unableToGetLocation");
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = t("locationAccessDenied");
          break;
        case error.POSITION_UNAVAILABLE:
          message = t("locationUnavailable");
          break;
        case error.TIMEOUT:
          message = t("locationTimeout");
          break;
      }
      alert(message);
    };

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      success,
      error,
      options
    );

    setLocationTracking(true);
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setLocationTracking(false);
  };

  const toggleTracking = () => {
    if (isTrackingLocation) {
      stopTracking();
    } else {
      startTracking();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  return (
    <FloatingButton
      onClick={toggleTracking}
      variant={isTrackingLocation ? "active" : "default"}
      ariaLabel={isTrackingLocation ? t("stopTracking") : t("trackLocation")}
      title={isTrackingLocation ? t("stopTracking") : t("trackYourLocation")}
      hideOnDesktop={true}
    >
      {isTrackingLocation ? (
        <Navigation size={20} />
      ) : (
        <NavigationOff size={20} />
      )}
    </FloatingButton>
  );
}
