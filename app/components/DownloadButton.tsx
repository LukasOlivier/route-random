"use client";

import { Download } from "lucide-react";
import { useLocationStore } from "../../stores/store";
import { downloadRouteAsGPX } from "../utils/gpxUtils";
import FloatingButton from "./FloatingButton";

export default function DownloadButton() {
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
      ariaLabel="Download route as GPX"
      title="Download route as GPX"
      showTextOnDesktop={true}
    >
      <Download size={20} />
      <span className="hidden md:inline">Download route as GPX</span>
    </FloatingButton>
  );
}
