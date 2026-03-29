import { Footprints } from "lucide-react";
import SidebarForm from "./SidebarForm";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";

interface SidebarProps {
  isMobile: boolean;
}

export default function Sidebar({ isMobile }: SidebarProps) {
  const t = useTranslations("Sidebar");
  const locale = useLocale();
  const router = useRouter();

  const handleLanguageChange = (newLocale: string) => {
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000`;
    router.refresh();
  };

  return (
    <>
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
    </>
  );
}
