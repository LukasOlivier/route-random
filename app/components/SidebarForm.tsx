"use client";

import { useState } from "react";
import { Clock, Ruler, Locate, LocateOff, Send } from "lucide-react";
import ToggleModeButton from "./ToggleModeButton";
import { useLocationStore, Mode, Pace } from "../../stores/store";
import LocationSearch from "./LocationSearch";
import { calculateDistanceFromTime } from "../utils/routeCalculations";

export default function SidebarForm() {
  const { startLocation, setUserLocation, setGeneratedRoute } =
    useLocationStore();

  // Local form state
  const [mode, setMode] = useState<Mode>(Mode.DISTANCE);
  const [pace, setPace] = useState<Pace>(Pace.WALKING);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [isGeneratingRoute, setIsGeneratingRoute] = useState(false);

  const handleLocationSelect = (location: { lat: number; lon: number }) => {
    setUserLocation([location.lat, location.lon]);
  };

  const generateRoute = async (e: React.FormEvent) => {
    console.log("Generating route...");
    e.preventDefault();

    const formData = new FormData(e.target as HTMLFormElement);
    const distanceInput = formData.get("distance") as string;
    const timeInput = formData.get("time") as string;

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
      console.log("Route generated:", result);

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

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      setLocationError(true);
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        setIsGettingLocation(false);
        setLocationError(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to get your current location.");
        setIsGettingLocation(false);
        setLocationError(true);
      }
    );
  };

  const paceOptions = [
    { value: Pace.WALKING, label: "Walking Pace (5 km/h)" },
    { value: Pace.RUNNING, label: "Running Pace (10 km/h)" },
    { value: Pace.CYCLING, label: "Cycling Pace (15 km/h)" },
  ];

  const paceItems = paceOptions.map((pace) => (
    <option
      key={pace.value}
      value={pace.value}
      className="bg-gray-800 text-gray-200 p-2"
    >
      {pace.label}
    </option>
  ));

  return (
    <form
      onSubmit={(e) => generateRoute(e)}
      className="flex flex-col gap-4 flex-grow"
    >
      {/* Toggling between time and distance mode */}
      <div className="w-full flex gap-2">
        <ToggleModeButton
          text="Distance"
          selected={mode === Mode.DISTANCE}
          onClick={() => setMode(Mode.DISTANCE)}
        />
        <ToggleModeButton
          text="Time"
          selected={mode === Mode.TIME}
          onClick={() => setMode(Mode.TIME)}
        />
      </div>
      <div className="flex flex-col gap-4">
        {mode === Mode.DISTANCE ? (
          <div>
            {/* Distance specific fields */}
            <label
              htmlFor="distance"
              className="block text-sm font-medium mb-1"
            >
              Desired distance (in km):
            </label>
            <div className="relative">
              <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                id="distance"
                name="distance"
                type="number"
                step="0.1"
                min="0.1"
                defaultValue="5"
                placeholder="e.g. 5 or 7.5"
                className="w-full bg-gray-800 rounded-md pl-10 pr-3 py-2 border border-gray-700"
                required
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Time specific fields */}
            <div>
              <label htmlFor="time" className="block text-sm font-medium mb-1">
                Desired Duration (in minutes):
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  id="time"
                  name="time"
                  type="number"
                  min="1"
                  defaultValue="30"
                  placeholder="e.g. 30 or 45"
                  className="w-full bg-gray-800 rounded-md pl-10 pr-3 py-2 border border-gray-700"
                  required
                />
              </div>
            </div>
            <div>
              {/* Pacing selector */}
              <label htmlFor="pace" className="block text-sm font-medium mb-1 ">
                Pace:
              </label>
              <select
                className="w-full bg-gray-800 rounded-md px-3 py-2 border border-gray-700"
                onChange={(e) => setPace(e.target.value as Pace)}
                value={pace}
                id="pace"
                name="pace"
              >
                {paceItems}
              </select>
            </div>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Starting Location
          </label>
          <div className="flex gap-1">
            <div className="flex-1">
              <LocationSearch
                onLocationSelect={handleLocationSelect}
                placeholder="Search starting location..."
              />
            </div>
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={isGettingLocation || locationError}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 disabled:bg-gray-600 rounded-md text-white flex items-center"
            >
              {locationError ? (
                <LocateOff size={16} />
              ) : (
                <Locate
                  size={16}
                  className={isGettingLocation ? "animate-spin" : ""}
                />
              )}
            </button>
          </div>
        </div>

        {/* Submit button */}
        <div className="mt-auto">
          <button
            type="submit"
            disabled={isGeneratingRoute}
            className="w-full bg-blue-500 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-md transition-colors flex justify-center items-center"
          >
            <Send
              className={`inline-block mr-2 ${
                isGeneratingRoute ? "animate-pulse" : ""
              }`}
              size={16}
            />
            {isGeneratingRoute ? "Generating..." : "Generate Route"}
          </button>
        </div>
      </div>
    </form>
  );
}
