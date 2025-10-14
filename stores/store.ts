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

type LocationStore = {
  startLocation: LatLngExpression | LatLngTuple | null;
  userLocation: LatLngTuple | null;
  setStartLocation: (location: LatLngExpression | LatLngTuple | null) => void;
  setUserLocation: (location: LatLngTuple | null) => void;
};

export const useLocationStore = create<LocationStore>((set) => ({
  startLocation: null,
  userLocation: null,
  setStartLocation: (startLocation) => set({ startLocation }),
  setUserLocation: (userLocation) =>
    set((state) => ({
      userLocation,
      // Only set as start location if no start location is already set
      startLocation: state.startLocation || userLocation,
    })),
}));

export { Mode, Pace };
