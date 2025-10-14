import { create } from "zustand";
import { LatLngExpression, LatLngTuple } from "leaflet";

enum Mode {
  TIME = "time",
  DISTANCE = "distance",
}

enum Pace {
  WALKING = "walking",
  RUNNING = "running",
  CYCLING = "cycling",
}

type RouteGenerationOptions = {
  startLocation: LatLngExpression | LatLngTuple | null;
  mode: Mode;
  distance: number | null;
  time: number | null;
  pace: Pace;
  locationInput: string; // Address string for geocoding
  userLocation: LatLngTuple | null; // Actual coordinates from geolocation
  isGettingLocation: boolean;
  locationError: boolean;
};

type RouteStore = {
  options: RouteGenerationOptions;
  setMode: (mode: Mode) => void;
  setDistance: (distance: number | null) => void;
  setTime: (time: number | null) => void;
  setPace: (pace: Pace) => void;
  setUserLocation: (location: LatLngTuple | null) => void;
  setStartLocation: (location: LatLngExpression | LatLngTuple | null) => void;
  setIsGettingLocation: (isGetting: boolean) => void;
  setLocationError: (hasError: boolean) => void;
};

export const useRouteStore = create<RouteStore>((set, get) => ({
  options: {
    startLocation: null,
    mode: Mode.DISTANCE,
    distance: null,
    time: null,
    pace: Pace.WALKING,
    locationInput: "",
    userLocation: null,
    isGettingLocation: false,
    locationError: false,
  },
  setMode: (mode) =>
    set((state) => ({
      options: { ...state.options, mode },
    })),
  setDistance: (distance) =>
    set((state) => ({
      options: { ...state.options, distance },
    })),
  setTime: (time) =>
    set((state) => ({
      options: { ...state.options, time },
    })),
  setPace: (pace) =>
    set((state) => ({
      options: { ...state.options, pace },
    })),
  setUserLocation: (userLocation) =>
    set((state) => ({
      options: {
        ...state.options,
        userLocation,
        startLocation: userLocation, // Set as start location when user location is obtained
      },
    })),
  setStartLocation: (startLocation) =>
    set((state) => ({
      options: { ...state.options, startLocation },
    })),
  setIsGettingLocation: (isGettingLocation) =>
    set((state) => ({
      options: { ...state.options, isGettingLocation },
    })),
  setLocationError: (locationError) =>
    set((state) => ({
      options: { ...state.options, locationError },
    })),
}));

export { Mode, Pace };
