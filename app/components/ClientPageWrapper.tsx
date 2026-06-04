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
import FeedbackWidget from "./FeedbackWidget";
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
  const [showFeedback, setShowFeedback] = useState(false);
  const [resetCount, setResetCount] = useState(0);
  const [feedbackContext, setFeedbackContext] = useState<"accept" | "no-fit">(
    "accept",
  );
  const initializeFromStorage = useLocationStore(
    (s) => s.initializeFromStorage,
  );
  const initializeFormFromStorage = useRouteFormStore(
    (s) => s.initializeFromStorage,
  );
  const generatedRoute = useLocationStore((s) => s.generatedRoute);
  const routeId = useLocationStore((s) => s.routeId);
  const isRouteAccepted = useLocationStore((s) => s.isRouteAccepted);
  const distance = useRouteFormStore((s) => s.distance);

  useEffect(() => {
    initializeFromStorage();
    initializeFormFromStorage();
  }, [initializeFromStorage, initializeFormFromStorage]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1023px)");

    if (mediaQuery.matches) {
      setIsSidebarOpen(true);
    }
  }, []);

  // Show feedback widget when route is accepted
  useEffect(() => {
    if (isRouteAccepted && generatedRoute) {
      setShowFeedback(
        Math.random() < parseFloat(process.env.FEEDBACK_PROBABILITY || "0.5"),
      );
      setFeedbackContext("accept");
      setResetCount(0); // Reset counter after accepting
    }
  }, [isRouteAccepted, generatedRoute]);

  // Track reset attempts
  useEffect(() => {
    if (!generatedRoute && isRouteAccepted === false) {
      setResetCount((prev) => {
        const newCount = prev + 1;
        // Show feedback after 3 consecutive resets
        if (newCount >= 3) {
          setShowFeedback(true);
          setFeedbackContext("no-fit");
          return 0; // Reset counter after showing feedback
        }
        return newCount;
      });
    }
  }, [generatedRoute, isRouteAccepted]);

  const { isLoading: isLoadingRoute } = useRouteFromUrl();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleFullscreenToggle = (nextIsFullscreen: boolean) => {
    setIsFullscreen(nextIsFullscreen);
    setShowFeedback(false);
  };

  return (
    <>
      <NotificationCenter offsetForSidebar={!isFullscreen} />
      <div
        className={`fixed right-4 z-999999 flex flex-col items-end gap-2 pt-4`}
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
            onToggle={handleFullscreenToggle}
          />
        )}
      </div>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-9999 lg:hidden"
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
        <div className="fixed top-3 left-1/2 lg:left-[62.5%] -translate-x-1/2 z-1000 flex items-center gap-2">
          {children}
        </div>
      )}

      {!isFullscreen && <MobileBottomBar />}

      {showFeedback && (
        <FeedbackWidget
          routeId={routeId || undefined}
          generatedDistance={generatedRoute?.distance}
          routeCoordinates={generatedRoute?.coordinates}
          requestedDistance={distance ? parseFloat(distance) : undefined}
          isAcceptFlow={feedbackContext === "accept"}
          customTitle={
            feedbackContext === "no-fit"
              ? "It seems like you can't find a fitting route... can we help?"
              : undefined
          }
          onClose={() => setShowFeedback(false)}
        />
      )}
    </>
  );
}
