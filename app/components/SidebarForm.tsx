"use client";

import { useState, useEffect } from "react";
import { Clock, Ruler, Locate, LocateOff } from "lucide-react";
import ToggleModeButton from "./ToggleModeButton";
import GenerateRouteButton from "./GenerateRouteButton";
import AcceptRouteButton from "./AcceptRouteButton";
import ResetRouteButton from "./ResetRouteButton";
import { useLocationStore, Mode, Pace, useRouteFormStore } from "../../stores";
import LocationSearch from "./LocationSearch";
import { useRouteGeneration } from "../hooks/useRouteGeneration";

export default function SidebarForm() {
  const {
    startLocation,
    setUserLocation,
    generatedRoute,
    resetRoute,
    acceptRoute,
    isRouteAccepted,
    isHydrated,
    hydrate,
  } = useLocationStore();

  const {
    mode,
    pace,
    distance,
    time,
    correctionFactor,
    setMode,
    setPace,
    setDistance,
    setTime,
    setCorrectionFactor,
    hydrate: hydrateForm,
    isHydrated: isFormHydrated,
  } = useRouteFormStore();

  const { generateRoute, isGeneratingRoute } = useRouteGeneration();

  // Local state for location functionality
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState(false);

  // Hydrate both stores on client-side mount
  useEffect(() => {
    if (!isHydrated) {
      hydrate();
    }
    if (!isFormHydrated) {
      hydrateForm();
    }
  }, [isHydrated, hydrate, isFormHydrated, hydrateForm]);

  const handleLocationSelect = (location: { lat: number; lon: number }) => {
    const newLocation: [number, number] = [location.lat, location.lon];
    setUserLocation(newLocation);
  };

  const handleGenerateRoute = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData(e.target as HTMLFormElement);
    const distanceInput = formData.get("distance") as string;
    const timeInput = formData.get("time") as string;

    // Call the hook's generateRoute function with form data
    await generateRoute({
      distance: distanceInput,
      time: timeInput,
    });
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
        const newLocation: [number, number] = [latitude, longitude];
        setUserLocation(newLocation);
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
      className="dark:bg-gray-800 dark:text-gray-200 p-2 bg-gray-300 text-gray-800"
    >
      {pace.label}
    </option>
  ));

  const handleAcceptRoute = () => {
    acceptRoute();
  };

  const handleResetRoute = () => {
    resetRoute();
  };

  return (
    <form
      onSubmit={handleGenerateRoute}
      className="flex flex-col gap-4 flex-grow"
    >
      {/* Toggling between time and distance mode */}
      <div className="w-full flex gap-2">
        <ToggleModeButton
          text="Distance"
          selected={mode === Mode.DISTANCE}
          disabled={!!generatedRoute}
          onClick={() => {
            setMode(Mode.DISTANCE);
          }}
        />
        <ToggleModeButton
          text="Time"
          selected={mode === Mode.TIME}
          disabled={!!generatedRoute}
          onClick={() => {
            setMode(Mode.TIME);
          }}
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
                value={distance}
                disabled={!!generatedRoute}
                onChange={(e) => {
                  setDistance(e.target.value);
                }}
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
                  value={time}
                  disabled={!!generatedRoute}
                  onChange={(e) => {
                    setTime(e.target.value);
                  }}
                  placeholder="e.g. 30 or 45"
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
                className="w-full dark:bg-gray-800 rounded-md px-3 py-2 border dark:border-gray-700 border-gray-400 bg-gray-200 dark:text-white"
                disabled={!!generatedRoute}
                onChange={(e) => {
                  setPace(e.target.value as Pace);
                }}
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
                disabled={!!generatedRoute}
              />
            </div>
            <button
              type="button"
              title="Use current location"
              aria-label="Use current location"
              onClick={getCurrentLocation}
              disabled={isGettingLocation || locationError || !!generatedRoute}
              className="px-3 py-2 dark:bg-gray-800 dark:hover:bg-gray-700 border dark:border-gray-700 rounded-md dark:text-white flex items-center bg-gray-200 hover:bg-gray-300 transition-colors border-gray-400"
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

        {/* Route Complexity Slider */}
        <div>
          <label
            className="block text-sm font-medium dark:text-gray-300 text-gray-800 mb-2 items-center gap-2"
            htmlFor="complexity"
          >
            Route Complexity: {Math.round(correctionFactor * 100)}%
          </label>
          <input
            type="range"
            name="complexity"
            id="complexity"
            min="0.3"
            max="1.0"
            step="0.05"
            value={correctionFactor}
            disabled={!!generatedRoute}
            onChange={(e) => {
              setCorrectionFactor(parseFloat(e.target.value));
            }}
            className="w-full h-2 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider bg-gray-300"
          />
          <p className="text-xs text-extra mt-1">
            When generated routes are too short, consider increasing the
            complexity.
          </p>
        </div>

        {/* Submit button or Accept/Reset buttons */}
        <div className="mt-10 hidden md:block">
          {generatedRoute ? (
            <div className="flex gap-2">
              {!isRouteAccepted && (
                <AcceptRouteButton
                  onAccept={handleAcceptRoute}
                  className="flex-1"
                />
              )}
              <ResetRouteButton onReset={handleResetRoute} className="flex-1" />
            </div>
          ) : (
            <GenerateRouteButton isGeneratingRoute={isGeneratingRoute} />
          )}
        </div>
      </div>
    </form>
  );
}
