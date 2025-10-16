"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface MapLoadingOverlayProps {
  isVisible: boolean;
}

export default function MapLoadingOverlay({
  isVisible,
}: MapLoadingOverlayProps) {
  const t = useTranslations("MapLoadingOverlay");

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-[1000] rounded-lg">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex flex-col items-center gap-4 shadow-xl">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <div className="text-center">
          <h3 className="text-lg font-semibold dark:text-white text-gray-900 mb-1">
            {t("generatingRoute")}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("pleaseWait")}
          </p>
        </div>
      </div>
    </div>
  );
}
