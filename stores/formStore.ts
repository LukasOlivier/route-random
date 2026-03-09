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
  setMode: (mode: Mode) => void;
  setPace: (pace: Pace) => void;
  setDistance: (distance: string) => void;
  setTime: (time: string) => void;
  setCorrectionFactor: (factor: number) => void;
  setIsGeneratingRoute: (isGenerating: boolean) => void;
  updateFormData: (data: Partial<RouteFormData>) => void;
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

export const useRouteFormStore = create<RouteFormStore>((set, get) => ({
  // Initial state
  ...defaultFormData,

  // Actions
  setMode: (mode) => {
    set({ mode });
  },

  setPace: (pace) => {
    set({ pace });
  },

  setDistance: (distance) => {
    set({ distance });
  },

  setTime: (time) => {
    set({ time });
  },

  setCorrectionFactor: (correctionFactor) => {
    set({ correctionFactor });
  },

  setIsGeneratingRoute: (isGeneratingRoute) => {
    set({ isGeneratingRoute });
  },

  updateFormData: (data) => {
    set(data);
  },
}));
