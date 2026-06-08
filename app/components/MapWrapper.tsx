"use client";

import dynamic from "next/dynamic";
import MapLoading from "./MapLoading";

const Map = dynamic(() => import("@/app/components/Map"), {
  loading: () => <MapLoading />,
  ssr: false,
});

export default function MapWrapper() {
  return (
    <div className="w-full lg:w-9/12 h-screen">
      <Map />
    </div>
  );
}
