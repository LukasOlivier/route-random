"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import MapWrapper from "./components/MapWrapper";
import Sidebar from "./components/Sidebar";
import MobileBottomBar from "./components/MobileBottomBar";
import TrackUserLocationButton from "./components/TrackUserLocationButton";
import DownloadButton from "./components/DownloadButton";
import FloatingButton from "./components/FloatingButton";

export default function Home() {
  const t = useTranslations("Page");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <main>
      <div className="fixed right-4 z-[999999] flex flex-col items-end gap-2 pt-4">
        <FloatingButton
          onClick={toggleSidebar}
          ariaLabel={t("toggleMenu")}
          hideOnDesktop={true}
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </FloatingButton>
        {!isSidebarOpen && (
          <>
            <TrackUserLocationButton />
            <DownloadButton />
          </>
        )}
      </div>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[9999] lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <div className="flex min-h-screen w-full flex-row">
        <Sidebar isOpen={isSidebarOpen} />
        <MapWrapper />
      </div>

      {/* Mobile Bottom Bar */}
      <MobileBottomBar />
    </main>
  );
}
