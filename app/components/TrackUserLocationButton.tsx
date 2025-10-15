"use client";

import { useEffect, useRef } from "react";
import { Navigation, NavigationOff } from "lucide-react";
import { useLocationStore } from "../../stores/store";
import FloatingButton from "./FloatingButton";

export default function TrackUserLocationButton() {
  const { isTrackingLocation, setLocationTracking, setUserLocation } =
    useLocationStore();

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const startTracking = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
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

      let message = "Unable to get your location.";
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message =
            "Location access denied. Please enable location permissions.";
          break;
        case error.POSITION_UNAVAILABLE:
          message = "Location information unavailable.";
          break;
        case error.TIMEOUT:
          message = "Location request timed out.";
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
      ariaLabel={
        isTrackingLocation ? "Stop tracking location" : "Track location"
      }
      title={
        isTrackingLocation ? "Stop tracking location" : "Track your location"
      }
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
