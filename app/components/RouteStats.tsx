"use client";

import { Ruler, Mountain } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocationStore } from "@/stores/store";
import StatBadge from "./StatBadge";

export default function RouteStats() {
  const tMap = useTranslations("Map");
  const generatedRoute = useLocationStore((s) => s.generatedRoute);

  if (!generatedRoute?.distance) return null;

  return (
    <>
      <StatBadge
        icon={<Ruler size={16} />}
        value={`${(generatedRoute.distance / 1000).toFixed(2)} km`}
        label={tMap("distance")}
      />

      {generatedRoute.elevationGain != null && (
        <StatBadge
          icon={<Mountain size={16} />}
          value={`${Math.round(generatedRoute.elevationGain)} m`}
          label={tMap("elevation")}
        />
      )}
    </>
  );
}
