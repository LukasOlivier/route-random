import { create } from "zustand";
import { Mode, Pace } from "./store";

export interface RouteFormData {
  mode: Mode;
  pace: Pace;
  distance: string;
  time: string;
  correctionFactor: number;
  isGeneratingRoute: boolean;
}

interface RouteFormStore extends RouteFormData {
  isHydrated: boolean;
  setMode: (mode: Mode) => void;
  setPace: (pace: Pace) => void;
  setDistance: (distance: string) => void;
  setTime: (time: string) => void;
  setCorrectionFactor: (factor: number) => void;
  setIsGeneratingRoute: (isGenerating: boolean) => void;
  updateFormData: (data: Partial<RouteFormData>) => void;
  loadFromLocalStorage: () => void;
  saveToLocalStorage: () => void;
  hydrate: () => void;
}

const STORAGE_KEY = "routeFormPreferences";

// Default form values
const defaultFormData: RouteFormData = {
  mode: Mode.DISTANCE,
  pace: Pace.WALKING,
  distance: "5",
  time: "30",
  correctionFactor: 0.65,
  isGeneratingRoute: false,
};

export const useRouteFormStore = create<RouteFormStore>((set, get) => ({
  // Initial state
  ...defaultFormData,
  isHydrated: false,

  // Actions
  setMode: (mode) => {
    set({ mode });
    get().saveToLocalStorage();
  },

  setPace: (pace) => {
    set({ pace });
    get().saveToLocalStorage();
  },

  setDistance: (distance) => {
    set({ distance });
    get().saveToLocalStorage();
  },

  setTime: (time) => {
    set({ time });
    get().saveToLocalStorage();
  },

  setCorrectionFactor: (correctionFactor) => {
    set({ correctionFactor });
    get().saveToLocalStorage();
  },

  setIsGeneratingRoute: (isGeneratingRoute) => {
    set({ isGeneratingRoute });
  },

  updateFormData: (data) => {
    set(data);
    get().saveToLocalStorage();
  },

  loadFromLocalStorage: () => {
    if (typeof window === "undefined") return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const preferences = JSON.parse(saved);
        set({
          mode: preferences.mode || defaultFormData.mode,
          pace: preferences.pace || defaultFormData.pace,
          distance: preferences.distance || defaultFormData.distance,
          time: preferences.time || defaultFormData.time,
          correctionFactor:
            preferences.correctionFactor || defaultFormData.correctionFactor,
        });
      }
    } catch (error) {
      console.error("Failed to load form preferences:", error);
    }
  },

  saveToLocalStorage: () => {
    if (typeof window === "undefined") return;

    try {
      const { mode, pace, distance, time, correctionFactor } = get();
      const preferences = {
        mode,
        pace,
        distance,
        time,
        correctionFactor,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error("Failed to save form preferences:", error);
    }
  },

  hydrate: () => {
    get().loadFromLocalStorage();
    set({ isHydrated: true });
  },
}));
