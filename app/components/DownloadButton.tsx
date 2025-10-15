"use client";

import { Download } from "lucide-react";
import { useLocationStore } from "../../stores/store";
import { downloadRouteAsGPX } from "../utils/gpxUtils";

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
    <button
      onClick={handleDownload}
      className="fixed top-28 right-4 z-[999999] md:top-4 h-10 w-10 md:w-fit md:px-3 md:flex md:gap-2 rounded-md transition-colors flex items-center justify-center bg-gray-900 text-white hover:bg-gray-800 border border-gray-700"
      aria-label="Download route as GPX"
      title="Download route as GPX"
    >
      <Download size={20} />
      <span>Download route as GPX</span>
    </button>
  );
}
