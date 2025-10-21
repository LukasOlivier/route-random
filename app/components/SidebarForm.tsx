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
import { useTranslations } from "next-intl";

export default function SidebarForm() {
  const t = useTranslations("SidebarForm");

  const {
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
    setMode,
    setPace,
    setDistance,
    setTime,
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
      alert(t("geolocationNotSupported"));
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
        alert(t("locationError"));
        setIsGettingLocation(false);
        setLocationError(true);
      }
    );
  };

  const paceOptions = [
    { value: Pace.WALKING, label: t("walkingPace") },
    { value: Pace.RUNNING, label: t("runningPace") },
    { value: Pace.CYCLING, label: t("cyclingPace") },
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
          text={t("distanceMode")}
          selected={mode === Mode.DISTANCE}
          disabled={!!generatedRoute}
          onClick={() => {
            setMode(Mode.DISTANCE);
          }}
        />
        <ToggleModeButton
          text={t("timeMode")}
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
              {t("desiredDistance")}
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
                placeholder={t("distancePlaceholder")}
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
                {t("desiredDuration")}
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
                  placeholder={t("timePlaceholder")}
                  required
                />
              </div>
            </div>
            <div>
              {/* Pacing selector */}
              <label htmlFor="pace" className="block text-sm font-medium mb-1 ">
                {t("pace")}
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
            {t("startingLocation")}
          </label>
          <div className="flex gap-1">
            <div className="flex-1">
              <LocationSearch
                onLocationSelect={handleLocationSelect}
                placeholder={t("searchLocationPlaceholder")}
                disabled={!!generatedRoute}
              />
            </div>
            <button
              type="button"
              title={t("useCurrentLocation")}
              aria-label={t("useCurrentLocation")}
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

        {/* Submit button or Accept/Reset buttons */}
        <div className="mt-10 hidden lg:block">
          {generatedRoute ? (
            <div className="flex gap-2 flex-wrap">
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
