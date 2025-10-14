"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { LatLngExpression, LatLngTuple } from "leaflet";
import { useRouteStore } from "../../stores/store";
import { useEffect } from "react";

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

const defaults = {
  zoom: 19,
  // London as fallback
  defaultPosition: [51.5074, -0.1278] as LatLngTuple,
};

// Component to handle map center updates
const MapUpdater = ({ center }: { center: LatLngTuple }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(center, defaults.zoom);
  }, [map, center]);

  return null;
};

const Map = () => {
  const { options } = useRouteStore();

  const mapCenter = options.userLocation || defaults.defaultPosition;

  return (
    <MapContainer
      center={mapCenter}
      zoom={defaults.zoom}
      style={{ height: "100%", width: "100%" }}
    >
      <MapUpdater center={mapCenter} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {(options.userLocation || options.startLocation) && (
        <Marker position={options.userLocation || options.startLocation!}>
          <Popup>
            {options.userLocation ? "Your Location" : "Starting Location"}
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
};

export default Map;
