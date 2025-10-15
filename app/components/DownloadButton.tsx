"use client";

import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocationStore } from "../../stores/store";
import { downloadRouteAsGPX } from "../utils/gpxUtils";
import FloatingButton from "./FloatingButton";

export default function DownloadButton() {
  const t = useTranslations("DownloadButton");
  const { generatedRoute, isRouteAccepted } = useLocationStore();

  const handleDownload = () => {
    if (generatedRoute) {
      downloadRouteAsGPX(generatedRoute);
    }
  };

  // Only show button if route is accepted
  if (!isRouteAccepted || !generatedRoute) {
    return null;
  }

  return (
    <FloatingButton
      onClick={handleDownload}
      ariaLabel={t("ariaLabel")}
      title={t("ariaLabel")}
      showTextOnDesktop={true}
    >
      <Download size={20} />
      <span className="hidden lg:inline">{t("downloadRoute")}</span>
    </FloatingButton>
  );
}
