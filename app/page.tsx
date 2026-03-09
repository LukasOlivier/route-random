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
import ShareButton from "./components/ShareButton";
import { useRouteFromUrl } from "./hooks/useRouteFromUrl";
import { useLocationStore } from "@/stores/store";

export default function Home() {
  const t = useTranslations("Page");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const initializeFromStorage = useLocationStore(
    (s) => s.initializeFromStorage,
  );

  // Load start location from localStorage
  useEffect(() => {
    initializeFromStorage();
  }, [initializeFromStorage]);

  // Load route from URL if present
  const { isLoading: isLoadingRoute } = useRouteFromUrl();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <main>
      <div className="fixed right-4 z-[999999] flex flex-col items-end gap-2 pt-4">
        {!isSidebarOpen && !isLoadingRoute && (
          <>
            <FloatingButton
              onClick={toggleSidebar}
              ariaLabel={t("toggleMenu")}
              hideOnDesktop={true}
            >
              <Menu size={24} />
            </FloatingButton>
            <TrackUserLocationButton />
            <DownloadButton />
            <ShareButton />
          </>
        )}
      </div>

      {/* Mobile overlay - click to close sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[9999] lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <div className="flex min-h-screen w-full flex-row">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {isLoadingRoute ? (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
            Loading route...
          </div>
        ) : (
          <MapWrapper />
        )}
      </div>

      {/* Mobile Bottom Bar */}
      <MobileBottomBar />
    </main>
  );
}
