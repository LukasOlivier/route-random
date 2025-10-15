import { create } from "zustand";
import { LatLngExpression, LatLngTuple } from "leaflet";
import {
  loadStartLocation,
  loadAcceptedRoute,
  hasAcceptedRoute,
  saveAcceptedRoute,
  removeAcceptedRoute,
} from "../app/utils/localStorage";

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
  isRouteAccepted: boolean;
  isHydrated: boolean;
  setStartLocation: (location: LatLngExpression | LatLngTuple | null) => void;
  setUserLocation: (location: LatLngTuple | null) => void;
  setGeneratedRoute: (route: GeneratedRoute | null) => void;
  setCorrectionFactor: (factor: number) => void;
  resetRoute: () => void;
  acceptRoute: () => void;
  hydrate: () => void;
};

export const useLocationStore = create<LocationStore>((set, get) => ({
  startLocation: null,
  userLocation: null,
  generatedRoute: null,
  correctionFactor: 0.65,
  isRouteAccepted: false,
  isHydrated: false,
  setStartLocation: (startLocation) => set({ startLocation }),
  setUserLocation: (userLocation) =>
    set((state) => ({
      userLocation,
      startLocation: state.startLocation || userLocation,
    })),
  setGeneratedRoute: (generatedRoute) => set({ generatedRoute }),
  setCorrectionFactor: (correctionFactor) => set({ correctionFactor }),
  resetRoute: () => {
    removeAcceptedRoute();
    set({ generatedRoute: null, isRouteAccepted: false });
  },
  acceptRoute: () => {
    set((state) => {
      if (state.generatedRoute) {
        saveAcceptedRoute(state.generatedRoute);
      }
      return { isRouteAccepted: true };
    });
  },
  hydrate: () => {
    set({
      startLocation: loadStartLocation(),
      generatedRoute: loadAcceptedRoute(),
      isRouteAccepted: hasAcceptedRoute(),
      isHydrated: true,
    });
  },
}));

export { Mode, Pace };
export type { GeneratedRoute };
