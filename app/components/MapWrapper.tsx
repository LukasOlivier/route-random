"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

export default function Page() {
  const Map = useMemo(
    () =>
      dynamic(() => import("@/app/components/Map"), {
        loading: () => <p>A map is loading</p>,
        ssr: false,
      }),
    []
  );

  return (
    <>
      <div className="w-3/4 h-[100vh]">
        <Map />
      </div>
    </>
  );
}
