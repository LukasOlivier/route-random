import { GeneratedRoute } from "../../stores/store";

interface FormPreferences {
  mode?: string;
  pace?: string;
  distance?: string;
  time?: string;
  correctionFactor?: number;
  startLocation?: [number, number] | null;
}

/**
 * Load data from localStorage with error handling
 */
function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") {
    return defaultValue;
  }

  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error(`Failed to load ${key} from localStorage:`, error);
  }

  return defaultValue;
}

/**
 * Save data to localStorage with error handling
 */
function saveToLocalStorage(key: string, data: any): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to save ${key} to localStorage:`, error);
  }
}

/**
 * Remove data from localStorage with error handling
 */
function removeFromLocalStorage(key: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove ${key} from localStorage:`, error);
  }
}

/**
 * Load form preferences from localStorage
 */
export function loadFormPreferences(): FormPreferences {
  return loadFromLocalStorage("routeFormPreferences", {});
}

/**
 * Load start location from localStorage
 */
export function loadStartLocation(): [number, number] | null {
  const preferences = loadFormPreferences();
  return preferences.startLocation || null;
}

/**
 * Load accepted route from localStorage
 */
export function loadAcceptedRoute(): GeneratedRoute | null {
  return loadFromLocalStorage("acceptedRoute", null);
}

/**
 * Check if there's an accepted route in localStorage
 */
export function hasAcceptedRoute(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const saved = localStorage.getItem("acceptedRoute");
    return saved !== null;
  } catch (error) {
    console.error("Failed to check accepted route from localStorage:", error);
    return false;
  }
}

/**
 * Save accepted route to localStorage
 */
export function saveAcceptedRoute(route: GeneratedRoute): void {
  saveToLocalStorage("acceptedRoute", route);
}

/**
 * Remove accepted route from localStorage
 */
export function removeAcceptedRoute(): void {
  removeFromLocalStorage("acceptedRoute");
}
