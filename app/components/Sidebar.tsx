import { Footprints } from "lucide-react";
import SidebarForm from "./SidebarForm";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef, useState, useEffect } from "react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const t = useTranslations("Sidebar");
  const locale = useLocale();
  const router = useRouter();
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

  const handleLanguageChange = (newLocale: string) => {
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000`;
    router.refresh();
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
      {isMobile && (
        <div className="w-1/4 bg-gray-400 h-1 rounded-full mx-auto my-2 -translate-y-3"></div>
      )}
      <header>
        <div className="flex items-base lg:justify-between gap-2 mb-1 flex-wrap">
          <h1 className="text-2xl font-bold flex items-center gap-2 dark:text-white text-black">
            <Footprints size={24} />
            {t("title")}
          </h1>

          <select
            value={locale}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="text-xs w-full xl:w-fit px-2 py-1 dark:bg-gray-800 rounded border dark:border-gray-700 border-gray-400 bg-gray-200 dark:text-white text-gray-800"
            title={t("language")}
          >
            <option value="en">EN</option>
            <option value="nl">NL</option>
          </select>
        </div>

        <h2 className="text-sm text-extra mt-1 mb-4">
          {t("subtitle")}{" "}
          <a
            className="underline"
            target="_blank"
            href="https://www.lukasolivier.be"
          >
            {t("authorLink")}
          </a>
        </h2>
      </header>

      <div className="border-t border-gray-700 my-4" />

      <SidebarForm />

      <footer className="mt-auto text-xs text-extra leading-relaxed space-y-4">
        <h3 className="text-sm font-medium dark:text-gray-300 mb-2 text-gray-800">
          {t("aboutTitle")}
        </h3>
        <p>{t("aboutDescription1")}</p>
        <p>{t("aboutDescription2")}</p>
      </footer>
    </div>
  );
}
