"use client";

import { useLocationStore, useRouteFormStore, Mode } from "../../stores";
import { calculateDistanceFromTime } from "../utils/routeCalculations";

export function useRouteGeneration() {
  const { startLocation, setGeneratedRoute } = useLocationStore();

  const {
    mode,
    pace,
    distance,
    time,
    correctionFactor,
    isGeneratingRoute,
    setIsGeneratingRoute,
  } = useRouteFormStore();

  const generateRoute = async (formData?: {
    distance?: string;
    time?: string;
  }) => {
    // Get distance and time from either formData (for form submission) or store (for direct calls)
    const distanceInput = formData?.distance || distance;
    const timeInput = formData?.time || time;

    // Calculate the final distance to send
    let finalDistance: number;

    if (mode === Mode.DISTANCE) {
      if (!distanceInput) {
        alert("Please enter a distance");
        return;
      }
      finalDistance = parseFloat(distanceInput);
    } else {
      if (!timeInput) {
        alert("Please enter a time duration");
        return;
      }
      const timeMinutes = parseFloat(timeInput);
      finalDistance = calculateDistanceFromTime(timeMinutes, pace);
    }

    // Validate required fields
    if (!startLocation) {
      alert("Please select a starting location");
      return;
    }

    try {
      setIsGeneratingRoute(true);

      const requestBody = {
        startLocation: startLocation,
        distance: finalDistance,
        correctionFactor: correctionFactor,
      };

      const response = await fetch("/api/generateroute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();

      // Store the generated route in the store
      if (result.success && result.route) {
        setGeneratedRoute(result.route);
      }
    } catch (error) {
      console.error("Error generating route:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to generate route. Please try again.";
      alert(errorMessage);
    } finally {
      setIsGeneratingRoute(false);
    }
  };

  const regenerateRouteFromWaypoints = async (
    waypoints: [number, number][]
  ) => {
    if (!waypoints || waypoints.length === 0) return;

    try {
      setIsGeneratingRoute(true);

      // Convert waypoints to the format expected by the API
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
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();

      if (result.success && result.route) {
        setGeneratedRoute(result.route);
      }
    } catch (error) {
      console.error("Error regenerating route:", error);
      // Don't show alert for waypoint adjustments to avoid interrupting user
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
