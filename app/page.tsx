"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import MapWrapper from "./components/MapWrapper";
import Sidebar from "./components/Sidebar";
import MobileBottomBar from "./components/MobileBottomBar";
import TrackUserLocationButton from "./components/TrackUserLocationButton";
import DownloadButton from "./components/DownloadButton";

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <main>
      {/* Mobile menu button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 right-4 z-[999999] md:hidden bg-gray-900 text-white p-2 rounded-md "
        aria-label="Toggle menu"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <TrackUserLocationButton />
      <DownloadButton />

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50  md:hidden"
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
