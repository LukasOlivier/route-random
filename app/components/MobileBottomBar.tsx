"use client";

import { useLocationStore, useRouteFormStore } from "../../stores";
import GenerateRouteButton from "./GenerateRouteButton";
import AcceptRouteButton from "./AcceptRouteButton";
import ResetRouteButton from "./ResetRouteButton";
import { calculateDistanceFromTime } from "../utils/routeCalculations";

export default function MobileBottomBar() {
  const {
    startLocation,
    generatedRoute,
    resetRoute,
    acceptRoute,
    isRouteAccepted,
    setGeneratedRoute,
  } = useLocationStore();

  const {
    mode,
    pace,
    distance,
    time,
    correctionFactor,
    isGeneratingRoute,
    setIsGeneratingRoute,
  } = useRouteFormStore();

  const generateRoute = async () => {
    // Calculate the final distance to send
    let finalDistance: number;

    if (mode === "distance") {
      if (!distance) {
        alert("Please enter a distance");
        return;
      }
      finalDistance = parseFloat(distance);
    } else {
      if (!time) {
        alert("Please enter a time duration");
        return;
      }
      const timeMinutes = parseFloat(time);
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

  const handleAcceptRoute = () => {
    acceptRoute();
  };

  const handleResetRoute = () => {
    resetRoute();
  };

  return (
    <div className="absolute bottom-5 left-0 right-0 z-[9999] md:hidden p-4">
      <div className="w-full max-w-sm mx-auto">
        {generatedRoute ? (
          <div className="flex gap-3">
            {!isRouteAccepted && (
              <AcceptRouteButton
                onAccept={handleAcceptRoute}
                className="flex-1"
              />
            )}
            <ResetRouteButton onReset={handleResetRoute} className="flex-1" />
          </div>
        ) : (
          <GenerateRouteButton
            isGeneratingRoute={isGeneratingRoute}
            onSubmit={generateRoute}
          />
        )}
      </div>
    </div>
  );
}
