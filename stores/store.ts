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

type GeneratedRoute = {
  coordinates: [number, number][];
  distance: number;
};

type LocationStore = {
  startLocation: LatLngExpression | LatLngTuple | null;
  userLocation: LatLngTuple | null;
  generatedRoute: GeneratedRoute | null;
  correctionFactor: number;
  setStartLocation: (location: LatLngExpression | LatLngTuple | null) => void;
  setUserLocation: (location: LatLngTuple | null) => void;
  setGeneratedRoute: (route: GeneratedRoute | null) => void;
  setCorrectionFactor: (factor: number) => void;
};

export const useLocationStore = create<LocationStore>((set) => ({
  startLocation: null,
  userLocation: null,
  generatedRoute: null,
  correctionFactor: 0.65, // Default value
  setStartLocation: (startLocation) => set({ startLocation }),
  setUserLocation: (userLocation) =>
    set((state) => ({
      userLocation,
      // Only set as start location if no start location is already set
      startLocation: state.startLocation || userLocation,
    })),
  setGeneratedRoute: (generatedRoute) => set({ generatedRoute }),
  setCorrectionFactor: (correctionFactor) => set({ correctionFactor }),
}));

export { Mode, Pace };
export type { GeneratedRoute };
