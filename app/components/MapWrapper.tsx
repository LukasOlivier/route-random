"use client";

import dynamic from "next/dynamic";
import MapLoading from "./MapLoading";

const Map = dynamic(
  async () => {
    const leaflet = await import("leaflet");
    Object.assign(globalThis, { L: leaflet });
    await import("leaflet-rotate");
    return import("@/app/components/Map");
  },
  {
    loading: () => <MapLoading />,
    ssr: false,
  },
);

export default function MapWrapper() {
  return (
    <div className="w-full lg:w-9/12 h-screen">
      <Map />
    </div>
  );
}
