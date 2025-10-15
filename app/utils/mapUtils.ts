import * as L from "leaflet";
import { LatLngTuple } from "leaflet";

export const mapDefaults = {
  zoom: 15,
  // London as fallback
  defaultPosition: [51.5074, -0.1278] as LatLngTuple,
};

export const blueIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#4285F4"/>
        <circle cx="12" cy="9" r="3" fill="white"/>
      </svg>
    `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

export const userLocationIcon = new L.DivIcon({
  className: "user-location-marker",
  html: `
    <div class="user-location-marker">
      <div class="user-location-pulse"></div>
      <div class="user-location-dot"></div>
    </div>
  `,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  popupAnchor: [0, -13],
});

export const waypointIcon = new L.Icon({
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
        <circle cx="12" cy="12" r="8" fill="#ff6b35" stroke="white" stroke-width="2"/>
        <circle cx="12" cy="12" r="3" fill="white"/>
        <path d="M8 8l8 8M16 8l-8 8" stroke="#ff6b35" stroke-width="1" opacity="0.5"/>
      </svg>
    `),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

/**
 * Helper function to ensure LatLngTuple format
 */
export const normalizeToLatLngTuple = (
  position: LatLngTuple | L.LatLngLiteral | null
): LatLngTuple => {
  if (!position) return mapDefaults.defaultPosition;
  if (Array.isArray(position)) return position;
  return [position.lat, position.lng];
};

/**
 * Calculate distance between two lat/lng coordinates
 * Returns distance in degrees (for small distances)
 */
export const calculateCoordinateDistance = (
  coord1: LatLngTuple,
  coord2: LatLngTuple
): number => {
  return Math.sqrt(
    Math.pow(coord1[0] - coord2[0], 2) + Math.pow(coord1[1] - coord2[1], 2)
  );
};

/**
 * Determine if map should recenter based on tracking state and distance
 */
export const shouldRecenterMap = (
  prevCenter: LatLngTuple | null,
  newCenter: LatLngTuple,
  isTracking: boolean,
  wasTracking: boolean,
  distanceThreshold: number = 0.001
): boolean => {
  if (!prevCenter) return true; // First load
  if (isTracking && !wasTracking) return true; // Just started tracking
  if (!isTracking && calculateCoordinateDistance(prevCenter, newCenter) > 0)
    return true; // Manual location change
  if (
    isTracking &&
    calculateCoordinateDistance(prevCenter, newCenter) > distanceThreshold
  )
    return true; // Significant movement

  return false;
};

export const createNumberedWaypointIcon = (number: number) =>
  new L.Icon({
    iconUrl:
      "data:image/svg+xml;base64," +
      btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
        <circle cx="16" cy="16" r="12" fill="#ff6b35" stroke="white" stroke-width="2"/>
        <text x="16" y="20" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12" font-weight="bold">${number}</text>
      </svg>
    `),
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
