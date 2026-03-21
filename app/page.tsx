"use client";

import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import MapWrapper from "./components/MapWrapper";
import Sidebar from "./components/Sidebar";
import MobileBottomBar from "./components/MobileBottomBar";
import TrackUserLocationButton from "./components/TrackUserLocationButton";
import DownloadButton from "./components/DownloadButton";
import FloatingButton from "./components/FloatingButton";
import FullscreenButton from "./components/FullscreenButton";
import ShareButton from "./components/ShareButton";
import { useRouteFromUrl } from "./hooks/useRouteFromUrl";
import { useLocationStore } from "@/stores/store";
import { useRouteFormStore } from "@/stores";

export default function Home() {
  const t = useTranslations("Page");
  const tMap = useTranslations("Map");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const initializeFromStorage = useLocationStore(
    (s) => s.initializeFromStorage,
  );
  const initializeFormFromStorage = useRouteFormStore(
    (s) => s.initializeFromStorage,
  );
  const generatedRoute = useLocationStore((s) => s.generatedRoute);

  // Load start location from localStorage
  useEffect(() => {
    initializeFromStorage();
    initializeFormFromStorage();
  }, [initializeFromStorage, initializeFormFromStorage]);

  // Load route from URL if present
  const { isLoading: isLoadingRoute } = useRouteFromUrl();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <main>
      <div
        className={`fixed right-4 z-[999999] flex flex-col items-end gap-2 pt-4`}
      >
        {!isSidebarOpen && !isLoadingRoute && !isFullscreen && (
          <>
            <FloatingButton
              onClick={toggleSidebar}
              ariaLabel={t("toggleMenu")}
              hideOnDesktop={true}
              umamiEvent="Toggle menu"
              umamiEventData={{ source: "floating-actions" }}
            >
              <Menu size={24} />
            </FloatingButton>
            <TrackUserLocationButton />
            <DownloadButton />
            <ShareButton />
          </>
        )}
        <FullscreenButton
          isFullscreen={isFullscreen}
          onToggle={setIsFullscreen}
        />
      </div>

      {/* Mobile overlay - click to close sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[9999] lg:hidden"
          onClick={toggleSidebar}
          data-umami-event="Close menu overlay"
          data-umami-event-source="mobile"
        />
      )}

      <div className="flex min-h-screen w-full flex-row">
        {!isFullscreen && (
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
        )}

        {isLoadingRoute ? (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
            Loading route...
          </div>
        ) : (
          <MapWrapper />
        )}
      </div>

      {!isFullscreen && generatedRoute?.distance != null && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-sm text-gray-800 text-md font-semibold px-4 py-1.5 rounded-md shadow-md">
          {tMap("distance")}: {(generatedRoute.distance / 1000).toFixed(2)} km
        </div>
      )}

      {/* Mobile Bottom Bar */}
      {!isFullscreen && <MobileBottomBar />}
    </main>
  );
}
