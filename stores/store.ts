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
  waypoints?: [number, number][];
};

type LocationStore = {
  startLocation: LatLngExpression | LatLngTuple | null;
  userLocation: LatLngTuple | null;
  generatedRoute: GeneratedRoute | null;
  isRouteAccepted: boolean;
  isHydrated: boolean;
  isTrackingLocation: boolean;
  setStartLocation: (location: LatLngExpression | LatLngTuple | null) => void;
  setUserLocation: (location: LatLngTuple | null) => void;
  setGeneratedRoute: (route: GeneratedRoute | null) => void;
  updateWaypoint: (index: number, newPosition: [number, number]) => void;
  resetRoute: () => void;
  acceptRoute: () => void;
  hydrate: () => void;
  setLocationTracking: (isTracking: boolean) => void;
};

export const useLocationStore = create<LocationStore>((set, get) => ({
  startLocation: null,
  userLocation: null,
  generatedRoute: null,
  isRouteAccepted: false,
  isHydrated: false,
  isTrackingLocation: false,
  setStartLocation: (startLocation) => set({ startLocation }),
  setUserLocation: (userLocation) =>
    set((state) => ({
      userLocation,
      startLocation: state.startLocation || userLocation,
    })),
  setGeneratedRoute: (generatedRoute) => set({ generatedRoute }),
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
  setLocationTracking: (isTrackingLocation) => set({ isTrackingLocation }),
  updateWaypoint: (index, newPosition) => {
    set((state) => {
      if (!state.generatedRoute?.waypoints) return state;

      const updatedWaypoints = [...state.generatedRoute.waypoints];
      updatedWaypoints[index] = newPosition;

      return {
        generatedRoute: {
          ...state.generatedRoute,
          waypoints: updatedWaypoints,
        },
      };
    });
  },
}));

export { Mode, Pace };
export type { GeneratedRoute };
