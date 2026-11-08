"use client";

import { useShallow } from "zustand/react/shallow";

import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocationStore } from "../../stores/store";
import { downloadRouteAsGPX } from "../utils/gpxUtils";
import FloatingButton from "./FloatingButton";
import { withRouteGuard } from "./withRouteGuard";

function DownloadButtonContent() {
  const t = useTranslations("DownloadButton");
  const { generatedRoute } = useLocationStore(
    useShallow((state) => ({ generatedRoute: state.generatedRoute })),
  );

  const handleDownload = () => {
    if (generatedRoute) {
      downloadRouteAsGPX(generatedRoute);
    }
  };

  return (
    <FloatingButton
      onClick={handleDownload}
      ariaLabel={t("ariaLabel")}
      title={t("ariaLabel")}
      showTextOnDesktop={true}
      umamiEvent="Download GPX"
      umamiEventData={{ source: "floating-actions", format: "gpx" }}
    >
      <Download size={20} />
      <span className="hidden lg:inline">{t("downloadRoute")}</span>
    </FloatingButton>
  );
}

export default withRouteGuard(DownloadButtonContent);
