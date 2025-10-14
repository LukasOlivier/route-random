"use client";

import { Clock, Ruler, Locate, LocateOff } from "lucide-react";
import ToggleModeButton from "./ToggleModeButton";
import { useRouteStore, Mode, Pace } from "../../stores/store";
import { useState } from "react";
import LocationSearch from "./LocationSearch";

export default function SidebarForm() {
  const {
    options,
    setMode,
    setPace,
    setUserLocation,
    setIsGettingLocation,
    setLocationError,
  } = useRouteStore();

  const handleLocationSelect = (location: { lat: number; lon: number }) => {
    setUserLocation([location.lat, location.lon]);
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
      onSubmit={(e) => e.preventDefault()}
      className="flex flex-col gap-4 flex-grow"
    >
      {/* Toggling between time and distance mode */}
      <div className="w-full flex gap-2">
        <ToggleModeButton
          text="Distance"
          selected={options.mode === Mode.DISTANCE}
          onClick={() => setMode(Mode.DISTANCE)}
        />
        <ToggleModeButton
          text="Time"
          selected={options.mode === Mode.TIME}
          onClick={() => setMode(Mode.TIME)}
        />
      </div>
      <div className="flex flex-col gap-4">
        {options.mode === Mode.DISTANCE ? (
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
                placeholder="e.g. 5 or 7.5"
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
                  placeholder="e.g. 30 or 45"
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
                value={options.pace}
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
              disabled={options.isGettingLocation || options.locationError}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 disabled:bg-gray-600 rounded-md text-white flex items-center"
            >
              {options.locationError ? (
                <LocateOff size={16} />
              ) : (
                <Locate
                  size={16}
                  className={options.isGettingLocation ? "animate-spin" : ""}
                />
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
