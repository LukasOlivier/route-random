"use client";

import dynamic from "next/dynamic";
import MapLoading from "./MapLoading";

const Map = dynamic(() => import("@/app/components/Map"), {
  loading: () => <MapLoading />,
  ssr: false,
});

export default function MapWrapper() {
  return (
    <div className="w-full lg:w-4/5 h-screen">
      <Map />
    </div>
  );
}
