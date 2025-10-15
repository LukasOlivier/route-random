import { Footprints } from "lucide-react";
import SidebarForm from "./SidebarForm";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";

interface SidebarProps {
  isOpen?: boolean;
}

export default function Sidebar({ isOpen = false }: SidebarProps) {
  const t = useTranslations("Sidebar");
  const locale = useLocale();
  const router = useRouter();

  const handleLanguageChange = (newLocale: string) => {
    // Set the locale cookie
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000`; // 1 year

    // Refresh the page to apply the new locale
    router.refresh();
  };

  return (
    <div
      className={`h-screen primary-bg  flex flex-col p-6 transition-transform duration-300 ease-in-out ${
        isOpen
          ? "fixed inset-0 z-[10000] lg:relative lg:w-1/4 lg:translate-x-0"
          : "hidden lg:flex lg:w-1/4"
      }`}
    >
      {/* Header */}
      <header>
        <div className="flex items-base lg:justify-between gap-2 mb-1 flex-wrap">
          <h1 className="text-2xl font-bold flex items-center gap-2 dark:text-white text-black">
            <Footprints size={24} />
            {t("title")}
          </h1>

          {/* Compact Language Selector */}
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
