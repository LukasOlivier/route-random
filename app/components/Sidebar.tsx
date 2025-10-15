import { Footprints } from "lucide-react";
import SidebarForm from "./SidebarForm";
import { useTranslations } from "next-intl";

interface SidebarProps {
  isOpen?: boolean;
}

export default function Sidebar({ isOpen = false }: SidebarProps) {
  const t = useTranslations("Sidebar");

  return (
    <div
      className={`h-screen primary-bg  flex flex-col p-6 transition-transform duration-300 ease-in-out ${
        isOpen
          ? "fixed inset-0 z-[99999] md:relative md:w-1/4 md:translate-x-0"
          : "hidden md:flex md:w-1/4"
      }`}
    >
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2 dark:text-white text-black">
          <Footprints size={24} />
          {t("title")}
        </h1>
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

      {/* Separator element */}
      <div className="border-t border-gray-700 my-4" />

      {/* Form for adjusting route generation settings */}
      <SidebarForm />

      {/* Footer */}
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
