import { create } from "zustand";
import { Mode, Pace } from "./store";
import {
  isValidRoutePattern,
  type RoutePattern,
} from "../app/utils/routePatterns";

type PersistedRouteFormData = Pick<
  RouteFormData,
  "mode" | "pace" | "distance" | "time" | "pattern"
>;

interface RouteFormData {
  mode: Mode;
  pace: Pace;
  distance: string;
  time: string;
  pattern: RoutePattern;
  correctionFactor: number;
  isGeneratingRoute: boolean;
}

interface RouteFormStore extends RouteFormData {
  routesGeneratedInSession: number;
  setMode: (mode: Mode) => void;
  setPace: (pace: Pace) => void;
  setDistance: (distance: string) => void;
  setTime: (time: string) => void;
  setPattern: (pattern: RoutePattern) => void;
  setIsGeneratingRoute: (isGenerating: boolean) => void;
  incrementRoutesGenerated: () => void;
  resetSessionCount: () => void;
  initializeFromParams: () => void;
  syncLocationToParams: (lat: number, lon: number) => void;
}

const defaultFormData: RouteFormData = {
  mode: Mode.DISTANCE,
  pace: Pace.WALKING,
  distance: "5",
  time: "30",
  pattern: "all",
  correctionFactor: 0.65,
  isGeneratingRoute: false,
};

const isValidMode = (value: unknown): value is Mode => {
  return value === Mode.DISTANCE || value === Mode.TIME;
};

const isValidPace = (value: unknown): value is Pace => {
  return (
    value === Pace.WALKING || value === Pace.RUNNING || value === Pace.CYCLING
  );
};

const syncFormDataToParams = (
  state: PersistedRouteFormData,
  params?: URLSearchParams,
) => {
  if (typeof window === "undefined") return;
  const sp = params ?? new URLSearchParams(window.location.search);
  sp.set("mode", state.mode);
  sp.set("pace", state.pace);
  sp.set("distance", state.distance);
  sp.set("time", state.time);
  sp.set("pattern", state.pattern);
  const newUrl = `${window.location.pathname}?${sp.toString()}`;
  window.history.replaceState(null, "", newUrl);
};

export const useRouteFormStore = create<RouteFormStore>((set, get) => ({
  ...defaultFormData,
  routesGeneratedInSession: 0,

  setMode: (mode) => {
    set({ mode });
    syncFormDataToParams(get());
  },
  setPace: (pace) => {
    set({ pace });
    syncFormDataToParams(get());
  },
  setDistance: (distance) => {
    set({ distance });
    syncFormDataToParams(get());
  },
  setTime: (time) => {
    set({ time });
    syncFormDataToParams(get());
  },
  setPattern: (pattern) => {
    set({ pattern });
    syncFormDataToParams(get());
  },
  setIsGeneratingRoute: (isGeneratingRoute) => {
    set({ isGeneratingRoute });
  },
  incrementRoutesGenerated: () => {
    set((state) => ({
      routesGeneratedInSession: state.routesGeneratedInSession + 1,
    }));
  },
  resetSessionCount: () => {
    set({ routesGeneratedInSession: 0 });
  },

  initializeFromParams: () => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const mode = sp.get("mode");
    const pace = sp.get("pace");
    const distance = sp.get("distance");
    const time = sp.get("time");
    const pattern = sp.get("pattern");
    set({
      mode: isValidMode(mode) ? mode : defaultFormData.mode,
      pace: isValidPace(pace) ? pace : defaultFormData.pace,
      distance: distance ?? defaultFormData.distance,
      time: time ?? defaultFormData.time,
      pattern: isValidRoutePattern(pattern) ? pattern : defaultFormData.pattern,
    });
  },

  syncLocationToParams: (lat: number, lon: number) => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    sp.set("lat", lat.toString());
    sp.set("lon", lon.toString());
    const newUrl = `${window.location.pathname}?${sp.toString()}`;
    window.history.replaceState(null, "", newUrl);
  },
}));
