"use client";

import dynamic from "next/dynamic";
import MapLoading from "./MapLoading";

const Map = dynamic(() => import("@/app/components/Map"), {
  loading: () => <MapLoading />,
  ssr: false,
});

export default function MapWrapper() {
  return (
    <div className="w-full lg:w-3/4 h-[100vh]">
      <Map />
    </div>
  );
}
