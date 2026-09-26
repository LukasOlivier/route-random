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
  elevationGain?: number;
  waypoints?: [number, number][];
};

type LocationStore = {
  startLocation: LatLngExpression | LatLngTuple | null;
  isStartLocationFromStorage: boolean;
  userLocation: LatLngTuple | null;
  generatedRoute: GeneratedRoute | null;
  routeId: string | null;
  isRouteAccepted: boolean;
  isTrackingLocation: boolean;
  setStartLocation: (location: LatLngExpression | LatLngTuple | null) => void;
  setUserLocation: (location: LatLngTuple | null) => void;
  setTrackedUserLocation: (location: LatLngTuple | null) => void;
  setGeneratedRoute: (route: GeneratedRoute | null) => void;
  setRouteId: (id: string | null) => void;
  updateWaypoint: (index: number, newPosition: [number, number]) => void;
  resetRoute: () => void;
  acceptRoute: () => Promise<void>;
  setLocationTracking: (isTracking: boolean) => void;
  initializeFromStorage: () => void;
};

const START_LOCATION_STORAGE_KEY = "startLocation";
const LAST_ROUTE_ID_STORAGE_KEY = "lastRouteId";

function persistStartLocationToStorage(
  startLocation: LatLngExpression | LatLngTuple | null,
) {
  if (typeof window === "undefined") return;

  try {
    if (startLocation && Array.isArray(startLocation)) {
      localStorage.setItem(
        START_LOCATION_STORAGE_KEY,
        JSON.stringify({
          lat: startLocation[0],
          lng: startLocation[1],
        }),
      );
      return;
    }

    localStorage.removeItem(START_LOCATION_STORAGE_KEY);
  } catch {
    // Ignore storage failures and keep the app usable.
  }
}

function readStartLocationFromStorage(): LatLngTuple | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(START_LOCATION_STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as { lat?: unknown; lng?: unknown };
    const lat = Number(parsed.lat);
    const lng = Number(parsed.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      localStorage.removeItem(START_LOCATION_STORAGE_KEY);
      return null;
    }

    return [lat, lng] as LatLngTuple;
  } catch {
    return null;
  }
}

function persistRouteIdToStorage(routeId: string | null) {
  if (typeof window === "undefined") return;

  try {
    if (routeId) {
      localStorage.setItem(LAST_ROUTE_ID_STORAGE_KEY, routeId);
    } else {
      localStorage.removeItem(LAST_ROUTE_ID_STORAGE_KEY);
    }
  } catch {
    // Ignore storage failures and keep the app usable.
  }
}

export function getLastRouteIdFromStorage() {
  if (typeof window === "undefined") return null;

  try {
    return localStorage.getItem(LAST_ROUTE_ID_STORAGE_KEY);
  } catch {
    return null;
  }
}

function syncStartLocationToParams(location: LatLngTuple) {
  if (typeof window === "undefined") return;

  const sp = new URLSearchParams(window.location.search);
  sp.set("lat", String(location[0]));
  sp.set("lon", String(location[1]));
  const newUrl = `${window.location.pathname}?${sp.toString()}`;
  window.history.replaceState(null, "", newUrl);
}

export const useLocationStore = create<LocationStore>((set, get) => ({
  startLocation: null,
  isStartLocationFromStorage: false,
  userLocation: null,
  generatedRoute: null,
  routeId: null,
  isRouteAccepted: false,
  isTrackingLocation: false,
  setStartLocation: (startLocation) => {
    set({ startLocation, isStartLocationFromStorage: false });
    if (Array.isArray(startLocation)) {
      syncStartLocationToParams(startLocation);
    }
    persistStartLocationToStorage(startLocation);
  },
  setUserLocation: (userLocation) => {
    set({
      userLocation,
      startLocation: userLocation,
      isStartLocationFromStorage: false,
    });

    if (typeof window !== "undefined") {
      if (userLocation) {
        localStorage.setItem(
          "startLocation",
          JSON.stringify({
            lat: userLocation[0],
            lng: userLocation[1],
          }),
        );
      } else {
        localStorage.removeItem("startLocation");
      }
    }
  },
  setTrackedUserLocation: (userLocation) => {
    set({ userLocation });
  },
  setGeneratedRoute: (generatedRoute) => set({ generatedRoute }),
  setRouteId: (routeId) => {
    set({ routeId });
    persistRouteIdToStorage(routeId);
  },
  resetRoute: () => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      sp.delete("route");
      const newUrl = `${window.location.pathname}?${sp.toString()}`;
      window.history.replaceState(null, "", newUrl);
    }
    set({ generatedRoute: null, routeId: null, isRouteAccepted: false });
    persistRouteIdToStorage(null);
  },
  acceptRoute: async () => {
    const { generatedRoute } = get();
    set({ isRouteAccepted: true });

    if (!generatedRoute) return;

    try {
      const routeToSave = {
        coordinates: generatedRoute.coordinates,
        distance: generatedRoute.distance,
        elevationGain: generatedRoute.elevationGain,
      };
      const response = await fetch("/api/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(routeToSave),
      });
      if (response.ok) {
        const data = await response.json();
        set({ routeId: data.id });
        persistRouteIdToStorage(data.id);
        if (typeof window !== "undefined") {
          const sp = new URLSearchParams(window.location.search);
          sp.set("route", data.id);
          const newUrl = `${window.location.pathname}?${sp.toString()}`;
          window.history.replaceState(null, "", newUrl);
        }
      }
    } catch (error) {
      console.error("Failed to save route to database:", error);
    }
  },
  setLocationTracking: (isTrackingLocation) => set({ isTrackingLocation }),
  initializeFromStorage: () => {
    if (typeof window === "undefined") return;
    const storedLocation = readStartLocationFromStorage();
    if (storedLocation) {
      set({
        startLocation: storedLocation,
        isStartLocationFromStorage: true,
      });
      syncStartLocationToParams(storedLocation);
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
