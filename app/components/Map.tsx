"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
  useMap,
  useMapEvent,
  Polyline,
  Popup,
} from "react-leaflet";
import { LatLngTuple } from "leaflet";
import { useEffect, useRef } from "react";
import * as L from "leaflet";
import { useLocationStore } from "../../stores/store";

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

const defaults = {
  zoom: 15,
  // London as fallback
  defaultPosition: [51.5074, -0.1278] as LatLngTuple,
};
const blueIcon = new L.Icon({
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

const MapUpdater = ({ center }: { center: LatLngTuple }) => {
  const map = useMap();
  const prevCenterRef = useRef<LatLngTuple | null>(null);

  useEffect(() => {
    // Initialize prevCenterRef with current map center on first mount
    if (prevCenterRef.current === null) {
      prevCenterRef.current = [map.getCenter().lat, map.getCenter().lng];
    }

    const prevCenter = prevCenterRef.current;

    // Only fly to new position if center has actually changed, prevents map 'shake' when loading for the first time
    if (
      !prevCenter ||
      prevCenter[0] !== center[0] ||
      prevCenter[1] !== center[1]
    ) {
      map.flyTo(center, defaults.zoom, { animate: true, duration: 2.0 });
      prevCenterRef.current = center;
    }
  }, [map, center]);

  return null;
};

// Helper function to ensure LatLngTuple format
const normalizeToLatLngTuple = (
  position: LatLngTuple | L.LatLngLiteral | null
): LatLngTuple => {
  if (!position) return defaults.defaultPosition;
  if (Array.isArray(position)) return position;
  return [position.lat, position.lng];
};

function MapClickHandler() {
  const { setStartLocation, generatedRoute } = useLocationStore();
  const map = useMapEvent("click", (e) => {
    // Prevent setting new location when route is generated
    if (generatedRoute) {
      return;
    }

    const { lat, lng } = e.latlng;
    const newLocation: [number, number] = [lat, lng];
    setStartLocation(newLocation);

    // Save to localStorage
    try {
      const saved = localStorage.getItem("routeFormPreferences");
      const preferences = saved ? JSON.parse(saved) : {};
      preferences.startLocation = newLocation;
      localStorage.setItem("routeFormPreferences", JSON.stringify(preferences));
    } catch (error) {
      console.error("Failed to save location:", error);
    }
  });
  return null;
}

const Map = () => {
  const {
    startLocation,
    userLocation,
    generatedRoute,
    isRouteAccepted,
    isHydrated,
    hydrate,
  } = useLocationStore();
  const markerRef = useRef<L.Marker>(null);

  // Hydrate the store on client-side mount
  useEffect(() => {
    if (!isHydrated) {
      hydrate();
    }
  }, [isHydrated, hydrate]);

  useEffect(() => {
    if (markerRef.current && startLocation) {
      const marker = markerRef.current;

      // Close popup if route is accepted
      if (isRouteAccepted) {
        marker.closePopup();
        return;
      }

      let popupContent = "<b>Start Location</b>";
      if (generatedRoute && generatedRoute.distance != null) {
        popupContent = `<b>Route Generated!</b><br>Distance: ${generatedRoute.distance.toFixed(
          2
        )} km`;
      }
      marker.bindPopup(popupContent).openPopup();
    }
  }, [startLocation, generatedRoute, isRouteAccepted]);

  const mapCenter = normalizeToLatLngTuple(
    userLocation || (isHydrated && startLocation) || defaults.defaultPosition
  );

  // Don't render until hydrated to prevent hydration mismatch
  if (!isHydrated) {
    return <div>Loading map...</div>;
  }

  return (
    <MapContainer
      center={mapCenter}
      zoom={defaults.zoom}
      zoomControl={true}
      scrollWheelZoom={true}
      style={{
        height: "100%",
        width: "100%",
      }}
    >
      <MapUpdater center={mapCenter} />
      <MapClickHandler />

      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors — &copy; Carto'
        url="https://tile.openstreetmap.bzh/ca/{z}/{x}/{y}.png"
      />

      {/* Start location marker */}
      {startLocation && (
        <Marker
          position={startLocation}
          icon={blueIcon}
          ref={markerRef}
        ></Marker>
      )}

      {/* Generated route */}
      {generatedRoute && (
        <Polyline
          positions={generatedRoute.coordinates.map(
            (coord) => [coord[1], coord[0]] as LatLngTuple
          )}
          color="#3388ff"
          weight={4}
          opacity={0.8}
        ></Polyline>
      )}
    </MapContainer>
  );
};

export default Map;
