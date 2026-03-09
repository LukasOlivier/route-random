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
  waypoints?: [number, number][];
};

type LocationStore = {
  startLocation: LatLngExpression | LatLngTuple | null;
  userLocation: LatLngTuple | null;
  generatedRoute: GeneratedRoute | null;
  routeId: string | null;
  isRouteAccepted: boolean;
  isTrackingLocation: boolean;
  setStartLocation: (location: LatLngExpression | LatLngTuple | null) => void;
  setUserLocation: (location: LatLngTuple | null) => void;
  setGeneratedRoute: (route: GeneratedRoute | null) => void;
  setRouteId: (id: string | null) => void;
  updateWaypoint: (index: number, newPosition: [number, number]) => void;
  resetRoute: () => void;
  acceptRoute: () => Promise<void>;
  setLocationTracking: (isTracking: boolean) => void;
  initializeFromStorage: () => void;
};

export const useLocationStore = create<LocationStore>((set, get) => ({
  startLocation: null,
  userLocation: null,
  generatedRoute: null,
  routeId: null,
  isRouteAccepted: false,
  isTrackingLocation: false,
  setStartLocation: (startLocation) => {
    set({ startLocation });
    // store the start location in localStorage for persistence
    if (typeof window !== "undefined" && startLocation) {
      localStorage.setItem(
        "startLocation",
        JSON.stringify({
          lat: (startLocation as LatLngTuple)[0],
          lng: (startLocation as LatLngTuple)[1],
        }),
      );
    }
  },
  setUserLocation: (userLocation) =>
    set((state) => ({
      userLocation,
      startLocation: state.startLocation || userLocation,
    })),
  setGeneratedRoute: (generatedRoute) => set({ generatedRoute }),
  setRouteId: (routeId) => set({ routeId }),
  resetRoute: () => {
    // Clear route ID from URL
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", "/");
    }
    set({ generatedRoute: null, routeId: null, isRouteAccepted: false });
  },
  acceptRoute: async () => {
    const { generatedRoute } = get();
    set({ isRouteAccepted: true });

    if (!generatedRoute) return;

    try {
      const response = await fetch("/api/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(generatedRoute),
      });
      if (response.ok) {
        const data = await response.json();
        set({ routeId: data.id });
        window.history.pushState({}, "", `/?route=${data.id}`);
      }
    } catch (error) {
      console.error("Failed to save route to database:", error);
    }
  },
  setLocationTracking: (isTrackingLocation) => set({ isTrackingLocation }),
  initializeFromStorage: () => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("startLocation");
    if (stored) {
      const { lat, lng } = JSON.parse(stored);
      set({ startLocation: [lat, lng] as LatLngTuple });
    }
  },
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
