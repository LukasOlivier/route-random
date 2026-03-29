"use client";

import { Ruler, Mountain } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocationStore } from "@/stores/store";

export default function RouteStats() {
  const tMap = useTranslations("Map");
  const generatedRoute = useLocationStore((s) => s.generatedRoute);

  if (!generatedRoute?.distance) return null;

  return (
    <>
      <div className="bg-white/90 backdrop-blur-sm text-gray-800 text-md font-semibold px-3 py-1.5 rounded-md shadow-md flex items-center gap-1.5">
        <Ruler size={16} aria-label={tMap("distance")} />
        <span>{(generatedRoute.distance / 1000).toFixed(2)} km</span>
      </div>

      {generatedRoute.elevationGain != null && (
        <div className="bg-white/90 backdrop-blur-sm text-gray-800 text-md font-semibold px-3 py-1.5 rounded-md shadow-md flex items-center gap-1.5">
          <Mountain size={16} aria-label={tMap("elevation")} />
          <span>{Math.round(generatedRoute.elevationGain)} m</span>
        </div>
      )}
    </>
  );
}
