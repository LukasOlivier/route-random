import { create } from "zustand";
import { Mode, Pace } from "./store";

const ROUTE_FORM_STORAGE_KEY = "routeFormData";

type PersistedRouteFormData = Pick<
  RouteFormData,
  "mode" | "pace" | "distance" | "time"
>;

interface RouteFormData {
  mode: Mode;
  pace: Pace;
  distance: string;
  time: string;
  correctionFactor: number;
  isGeneratingRoute: boolean;
}

interface RouteFormStore extends RouteFormData {
  setMode: (mode: Mode) => void;
  setPace: (pace: Pace) => void;
  setDistance: (distance: string) => void;
  setTime: (time: string) => void;
  setIsGeneratingRoute: (isGenerating: boolean) => void;
  initializeFromStorage: () => void;
}

// Default form values
const defaultFormData: RouteFormData = {
  mode: Mode.DISTANCE,
  pace: Pace.WALKING,
  distance: "5",
  time: "30",
  correctionFactor: 0.65,
  isGeneratingRoute: false,
};

const persistFormData = (state: RouteFormData) => {
  if (typeof window === "undefined") return;

  const dataToPersist: PersistedRouteFormData = {
    mode: state.mode,
    pace: state.pace,
    distance: state.distance,
    time: state.time,
  };

  localStorage.setItem(ROUTE_FORM_STORAGE_KEY, JSON.stringify(dataToPersist));
};

const isValidMode = (value: unknown): value is Mode => {
  return value === Mode.DISTANCE || value === Mode.TIME;
};

const isValidPace = (value: unknown): value is Pace => {
  return (
    value === Pace.WALKING || value === Pace.RUNNING || value === Pace.CYCLING
  );
};

export const useRouteFormStore = create<RouteFormStore>((set, get) => ({
  // Initial state
  ...defaultFormData,

  // Actions
  setMode: (mode) => {
    set({ mode });
    persistFormData(get());
  },

  setPace: (pace) => {
    set({ pace });
    persistFormData(get());
  },

  setDistance: (distance) => {
    set({ distance });
    persistFormData(get());
  },

  setTime: (time) => {
    set({ time });
    persistFormData(get());
  },

  setIsGeneratingRoute: (isGeneratingRoute) => {
    set({ isGeneratingRoute });
  },

  initializeFromStorage: () => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem(ROUTE_FORM_STORAGE_KEY);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as Partial<PersistedRouteFormData>;

      set({
        mode: isValidMode(parsed.mode) ? parsed.mode : defaultFormData.mode,
        pace: isValidPace(parsed.pace) ? parsed.pace : defaultFormData.pace,
        distance:
          typeof parsed.distance === "string"
            ? parsed.distance
            : defaultFormData.distance,
        time:
          typeof parsed.time === "string" ? parsed.time : defaultFormData.time,
      });
    } catch {
      localStorage.removeItem(ROUTE_FORM_STORAGE_KEY);
    }
  },
}));
