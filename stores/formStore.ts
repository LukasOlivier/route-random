import { create } from "zustand";
import { Mode, Pace } from "@/types/route";
import {
  updateSearchParams,
  syncStartLocationToParams,
} from "@/app/utils/urlParams";
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
  isGeneratingRoute: boolean;
}

interface RouteFormStore extends RouteFormData {
  setMode: (mode: Mode) => void;
  setPace: (pace: Pace) => void;
  setDistance: (distance: string) => void;
  setTime: (time: string) => void;
  setPattern: (pattern: RoutePattern) => void;
  setIsGeneratingRoute: (isGenerating: boolean) => void;
  initializeFromParams: () => void;
  syncLocationToParams: (lat: number, lon: number) => void;
}

const defaultFormData: RouteFormData = {
  mode: Mode.DISTANCE,
  pace: Pace.WALKING,
  distance: "5",
  time: "30",
  pattern: "all",
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

const syncFormDataToParams = (state: PersistedRouteFormData) => {
  updateSearchParams((params) => {
    params.set("mode", state.mode);
    params.set("pace", state.pace);
    params.set("distance", state.distance);
    params.set("time", state.time);
    params.set("pattern", state.pattern);
  });
};

export const useRouteFormStore = create<RouteFormStore>((set, get) => ({
  ...defaultFormData,

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

  syncLocationToParams: (lat, lon) => {
    syncStartLocationToParams([lat, lon]);
  },
}));
