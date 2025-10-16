"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvent,
  Polyline,
} from "react-leaflet";
import { LatLngTuple } from "leaflet";
import { useEffect, useRef } from "react";
import * as L from "leaflet";
import { useTranslations } from "next-intl";
import { useLocationStore } from "../../stores/store";
import { useRouteGeneration } from "../hooks/useRouteGeneration";
import {
  mapDefaults,
  blueIcon,
  userLocationIcon,
  createNumberedWaypointIcon,
  normalizeToLatLngTuple,
  shouldRecenterMap,
} from "../utils/mapUtils";
import { saveStartLocationToPreferences } from "../utils/localStorage";
import { getRouteSegmentsWithOverlaps } from "../utils/routeAnalysis";

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import MapLoading from "./MapLoading";

const MapUpdater = ({
  center,
  isTracking,
}: {
  center: LatLngTuple;
  isTracking: boolean;
}) => {
  const map = useMap();
  const prevCenterRef = useRef<LatLngTuple | null>(null);
  const isTrackingRef = useRef<boolean>(false);

  useEffect(() => {
    // Initialize prevCenterRef with current map center on first mount
    if (prevCenterRef.current === null) {
      prevCenterRef.current = [map.getCenter().lat, map.getCenter().lng];
    }

    const prevCenter = prevCenterRef.current;
    const wasTracking = isTrackingRef.current;

    if (shouldRecenterMap(prevCenter, center, isTracking, wasTracking)) {
      map.flyTo(center, mapDefaults.zoom, { animate: true, duration: 2.0 });
      prevCenterRef.current = center;
    }

    isTrackingRef.current = isTracking;
  }, [map, center, isTracking]);

  return null;
};

function MapClickHandler() {
  const { setStartLocation, generatedRoute } = useLocationStore();
  useMapEvent("click", (e) => {
    // Prevent setting new location when route is generated
    if (generatedRoute) {
      return;
    }

    const { lat, lng } = e.latlng;
    const newLocation: [number, number] = [lat, lng];
    setStartLocation(newLocation);

    // Save to localStorage using utility function
    saveStartLocationToPreferences(newLocation);
  });
  return null;
}

const Map = () => {
  const t = useTranslations("Map");
  const {
    startLocation,
    userLocation,
    generatedRoute,
    isRouteAccepted,
    isHydrated,
    isTrackingLocation,
    updateWaypoint,
    hydrate,
  } = useLocationStore();

  const { regenerateRouteFromWaypoints } = useRouteGeneration();
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

      let popupContent = `<b>${t("startLocation")}</b>`;
      if (generatedRoute && generatedRoute.distance != null) {
        popupContent = `<b>${t("routeGenerated")}</b><br>${t(
          "distance"
        )}: ${generatedRoute.distance.toFixed(2)} km`;
      }
      marker.bindPopup(popupContent).openPopup();
    }
  }, [startLocation, generatedRoute, isRouteAccepted, t]);

  const mapCenter = normalizeToLatLngTuple(
    (isTrackingLocation && userLocation) ||
      userLocation ||
      (isHydrated && startLocation) ||
      mapDefaults.defaultPosition
  );

  // Don't render until hydrated to prevent hydration mismatch
  if (!isHydrated) {
    return <MapLoading />;
  }

  const handleWaypointDrag = async (index: number, newPosition: L.LatLng) => {
    const newPos: [number, number] = [newPosition.lat, newPosition.lng];
    updateWaypoint(index, newPos);

    // Regenerate route with new waypoints
    if (generatedRoute?.waypoints) {
      const updatedWaypoints = [...generatedRoute.waypoints];
      updatedWaypoints[index] = newPos;
      await regenerateRouteFromWaypoints(updatedWaypoints);
    }
  };

  // Get route segments with overlap information
  const routeSegments = generatedRoute
    ? getRouteSegmentsWithOverlaps(generatedRoute.coordinates)
    : null;

  return (
    <MapContainer
      center={mapCenter}
      zoom={mapDefaults.zoom}
      zoomControl={true}
      scrollWheelZoom={true}
      style={{
        height: "100%",
        width: "100%",
      }}
    >
      <MapUpdater center={mapCenter} isTracking={isTrackingLocation} />
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

      {/* User location marker (when tracking) */}
      {isTrackingLocation && userLocation && (
        <Marker position={userLocation} icon={userLocationIcon}></Marker>
      )}

      {/* Generated route with overlap detection */}
      {routeSegments && (
        <>
          {/* Normal route segments */}
          {routeSegments.normalSegments.map((segment, index) => (
            <Polyline
              key={`normal-${index}`}
              positions={segment}
              color="#3388ff"
              weight={4}
              opacity={0.8}
            />
          ))}

          {/* Overlapping route segments in red */}
          {routeSegments.overlappingSegments.map((segment, index) => (
            <Polyline
              key={`overlap-${index}`}
              positions={segment}
              color="#ff0000"
              weight={5}
              opacity={0.9}
            />
          ))}
        </>
      )}

      {/* Waypoint markers */}
      {generatedRoute?.waypoints &&
        generatedRoute.waypoints.slice(1, -1).map((waypoint, index) => (
          <Marker
            key={`waypoint-${index}`}
            position={waypoint}
            icon={createNumberedWaypointIcon(index + 1)}
            draggable={!isRouteAccepted}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target;
                const position = marker.getLatLng();
                handleWaypointDrag(index + 1, position);
              },
            }}
          />
        ))}
    </MapContainer>
  );
};

export default Map;
