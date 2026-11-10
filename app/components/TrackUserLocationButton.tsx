"use client";

import { useShallow } from "zustand/react/shallow";
import { Navigation, NavigationOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocationStore } from "../../stores";
import { useGeolocation } from "../hooks/useGeolocation";
import FloatingButton from "./FloatingButton";

export default function TrackUserLocationButton() {
  const t = useTranslations("TrackUserLocationButton");
  const { isTrackingLocation, setLocationTracking, setTrackedUserLocation } =
    useLocationStore(
      useShallow((state) => ({
        isTrackingLocation: state.isTrackingLocation,
        setLocationTracking: state.setLocationTracking,
        setTrackedUserLocation: state.setTrackedUserLocation,
      })),
    );
  const { startWatching, stopWatching } = useGeolocation();

  const startTracking = () => {
    const started = startWatching(
      (location) => setTrackedUserLocation(location),
      () => setLocationTracking(false),
    );

    if (started) {
      setLocationTracking(true);
    }
  };

  const stopTracking = () => {
    stopWatching();
    setLocationTracking(false);
  };

  const toggleTracking = () => {
    if (isTrackingLocation) {
      stopTracking();
    } else {
      startTracking();
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
