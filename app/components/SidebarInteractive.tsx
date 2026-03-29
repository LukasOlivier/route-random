"use client";

import { useRef, useState, useEffect } from "react";
import Sidebar from "./Sidebar";

interface SidebarInteractiveProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function SidebarInteractive({
  isOpen = false,
  onClose,
}: SidebarInteractiveProps) {
  const touchStartY = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    setIsMobile(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY.current;
    setDragOffset(Math.max(0, deltaY));
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchEndY - touchStartY.current;

    setIsDragging(false);

    if (deltaY > 100 && onClose) {
      setDragOffset(window.innerHeight);
      setTimeout(() => {
        onClose();
        setDragOffset(0);
      }, 200);
    } else {
      setDragOffset(0);
    }
    touchStartY.current = null;
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={
        isMobile
          ? {
              transform: isOpen
                ? `translateY(${dragOffset}px)`
                : "translateY(100%)",
              transition: isDragging ? "none" : "transform 0.1s ease-out",
            }
          : undefined
      }
      className={`primary-bg flex flex-col p-6 ${
        isMobile
          ? `fixed left-0 right-0 bottom-0 z-[10000] h-[75vh] overflow-y-auto rounded-t-2xl shadow-2xl ${!isOpen ? "pointer-events-none" : ""}`
          : "h-screen w-1/4"
      }`}
    >
      <Sidebar isMobile={isMobile} />
    </div>
  );
}
