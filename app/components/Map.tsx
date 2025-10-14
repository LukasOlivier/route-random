"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Circle,
  Polyline,
  ZoomControl,
  ScaleControl,
  useMapEvent,
} from "react-leaflet";
import { LatLngExpression, LatLngTuple } from "leaflet";
import { useRouteStore } from "../../stores/store";
import { useEffect } from "react";
import * as L from "leaflet";

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

const defaults = {
  zoom: 17,
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

  useEffect(() => {
    map.flyTo(center, defaults.zoom, { animate: true, duration: 0.9 });
  }, [map, center]);

  return null;
};

function MapClickHandler() {
  const { setStartLocation } = useRouteStore();
  const map = useMapEvent("click", (e) => {
    const { lat, lng } = e.latlng;
    setStartLocation([lat, lng]);
  });
  return null;
}

const Map = () => {
  const { options } = useRouteStore();

  const mapCenter = options.userLocation || defaults.defaultPosition;

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
      {options.startLocation && (
        <Marker position={options.startLocation} icon={blueIcon}>
          <Popup>Starting Location</Popup>
        </Marker>
      )}
    </MapContainer>
  );
};

export default Map;
