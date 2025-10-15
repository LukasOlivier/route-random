"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import MapLoading from "./MapLoading";

export default function Page() {
  const Map = useMemo(
    () =>
      dynamic(() => import("@/app/components/Map"), {
        loading: () => <MapLoading />,
        ssr: false,
      }),
    []
  );

  return (
    <>
      <div className="w-full lg:w-3/4 h-[100vh]">
        <Map />
      </div>
    </>
  );
}
