"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import SidebarInteractive from "./SidebarInteractive";
import MobileBottomBar from "./MobileBottomBar";
import TrackUserLocationButton from "./TrackUserLocationButton";
import DownloadButton from "./DownloadButton";
import FloatingButton from "./FloatingButton";
import FullscreenButton from "./FullscreenButton";
import NotificationCenter from "./NotificationCenter";
import ShareButton from "./ShareButton";
import LegendButton from "./LegendButton";
import MapWrapper from "./MapWrapper";
import { useRouteFromUrl } from "@/app/hooks/useRouteFromUrl";
import { useLocationStore } from "@/stores/store";
import { useRouteFormStore } from "@/stores";

interface ClientPageWrapperProps {
  children?: React.ReactNode;
}

export default function ClientPageWrapper({
  children,
}: ClientPageWrapperProps) {
  const t = useTranslations("Page");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const initializeFromStorage = useLocationStore(
    (s) => s.initializeFromStorage,
  );
  const initializeFormFromStorage = useRouteFormStore(
    (s) => s.initializeFromStorage,
  );

  useEffect(() => {
    initializeFromStorage();
    initializeFormFromStorage();
  }, [initializeFromStorage, initializeFormFromStorage]);

  const { isLoading: isLoadingRoute } = useRouteFromUrl();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      <NotificationCenter offsetForSidebar={!isFullscreen} />
      <div
        className={`fixed right-4 z-[999999] flex flex-col items-end gap-2 pt-4`}
      >
        {!isFullscreen && (
          <FloatingButton
            onClick={toggleSidebar}
            ariaLabel={t("toggleMenu")}
            hideOnDesktop={true}
            umamiEvent="Toggle menu"
            umamiEventData={{ source: "floating-actions" }}
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </FloatingButton>
        )}
        {!isSidebarOpen && !isLoadingRoute && !isFullscreen && (
          <>
            <LegendButton />
            <TrackUserLocationButton />
            <DownloadButton />
            <ShareButton />
          </>
        )}
        {!isSidebarOpen && (
          <FullscreenButton
            isFullscreen={isFullscreen}
            onToggle={setIsFullscreen}
          />
        )}
      </div>
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
          <SidebarInteractive
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

      {!isFullscreen && (
        <div className="fixed top-3 left-1/2 lg:left-[62.5%] -translate-x-1/2 z-[1000] flex items-center gap-2">
          {children}
        </div>
      )}

      {!isFullscreen && <MobileBottomBar />}
    </>
  );
}
