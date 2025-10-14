"use client";

import { useState } from "react";
import { MapPin, Clock, Ruler, Locate, LocateOff } from "lucide-react";
import ToggleModeButton from "./ToggleModeButton";

enum Mode {
  TIME = "time",
  DISTANCE = "distance",
}

enum Pace {
  WALKING = "walking",
  RUNNING = "running",
  CYCLING = "cycling",
}

export default function SidebarForm() {
  const [currentMode, setCurrentMode] = useState<Mode>(Mode.DISTANCE);
  const [currentPace, setCurrentPace] = useState<Pace>(Pace.WALKING);

  // State for location input and loading state for geolocation
  const [location, setLocation] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<boolean>(false);

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
        setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
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
          selected={currentMode === Mode.DISTANCE}
          onClick={() => setCurrentMode(Mode.DISTANCE)}
        />
        <ToggleModeButton
          text="Time"
          selected={currentMode === Mode.TIME}
          onClick={() => setCurrentMode(Mode.TIME)}
        />
      </div>
      <div className="flex flex-col gap-4">
        {currentMode === Mode.DISTANCE ? (
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
                onChange={(e) => setCurrentPace(e.target.value as Pace)}
                value={currentPace}
              >
                {paceItems}
              </select>
            </div>
          </div>
        )}
        {/* Search starting location */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium mb-1 ">
            Starting Location:
          </label>
          <div className="flex gap-1">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                id="location"
                name="location"
                type="text"
                placeholder="Enter a location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={isGettingLocation || locationError}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 disabled:bg-gray-600 rounded-md text-white flex items-center"
            >
              {locationError ? <LocateOff size={16} /> : <Locate size={16} />}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
