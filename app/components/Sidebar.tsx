"use client";

import { Footprints } from "lucide-react";
import SidebarForm from "./SidebarForm";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Select from "react-select";
import type {
  FormatOptionLabelMeta,
  OnChangeValue,
  StylesConfig,
} from "react-select";
import ReactCountryFlag from "react-country-flag";
import Image from "next/image";

interface SidebarProps {
  isMobile: boolean;
}

interface LanguageOption {
  value: string;
  label: string;
  countryCode: string;
}

export default function Sidebar({ isMobile }: SidebarProps) {
  const t = useTranslations("Sidebar");
  const locale = useLocale();
  const router = useRouter();

  const languageOptions: LanguageOption[] = [
    { value: "en", label: "EN", countryCode: "GB" },
    { value: "nl", label: "NL", countryCode: "NL" },
    { value: "fr", label: "FR", countryCode: "FR" },
    { value: "de", label: "DE", countryCode: "DE" },
    { value: "es", label: "ES", countryCode: "ES" },
    { value: "pl", label: "PL", countryCode: "PL" },
  ];

  const customStyles: StylesConfig<LanguageOption, false> = {
    control: (provided, state) => ({
      ...provided,
      background: "#1f2937", // gray-800
      borderColor: state.isFocused ? "#4b5563" : "#374151", // gray-600 / gray-700
      boxShadow: state.isFocused ? "0 0 0 1px #374151" : "none",
      minHeight: 34,
      paddingLeft: 8,
      paddingRight: 6,
      color: "#fff",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#fff",
    }),
    menu: (provided) => ({
      ...provided,
      background: "#111827", // gray-900
      color: "#fff",
      borderRadius: 6,
      overflow: "hidden",
    }),
    option: (provided, state) => ({
      ...provided,
      background: state.isFocused ? "#374151" : "transparent",
      color: "#fff",
      cursor: "pointer",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#9ca3af", // gray-400
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: "#cbd5e1",
    }),
    indicatorSeparator: () => ({ display: "none" }),
    menuPortal: (provided) => ({ ...provided, zIndex: 10001 }),
  };

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
          <h2 className="text-2xl font-bold flex items-center gap-2 dark:text-white text-black">
            <Footprints size={24} />
            {t("title")}
          </h2>

          <div className="w-full xl:w-fit">
            <Select
              value={languageOptions.find((option) => option.value === locale)}
              onChange={(option: OnChangeValue<LanguageOption, false>) => {
                if (option) {
                  handleLanguageChange(option.value);
                }
              }}
              options={languageOptions}
              styles={customStyles}
              menuPortalTarget={
                typeof document !== "undefined" ? document.body : undefined
              }
              menuPosition="fixed"
              menuPlacement="auto"
              formatOptionLabel={(
                option: LanguageOption,
                _meta: FormatOptionLabelMeta<LanguageOption>,
              ) => (
                <div className="flex items-center gap-2">
                  <ReactCountryFlag
                    svg
                    countryCode={option.countryCode}
                    style={{ width: 20, height: 14 }}
                  />
                  <span>{option.label}</span>
                </div>
              )}
              className="react-select-container"
              classNamePrefix="react-select"
              isSearchable={false}
              aria-label={t("language")}
            />
          </div>
        </div>

        <h2 className="text-sm text-extra my-2">
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

      <div className="border-t border-gray-700 my-2" />
      <SidebarForm />

      <footer className="mt-auto text-xs text-extra leading-relaxed space-y-2">
        <h3 className="text-sm font-medium dark:text-gray-300 mb-2 text-gray-800">
          {t("aboutTitle")}
        </h3>
        <p>{t("aboutDescription1")}</p>
        <p>{t("aboutDescription2")}</p>
        <nav className="mb-4">
          <Link
            href="/about"
            className="block text-xs font-medium dark:text-gray-300 text-gray-800 hover:underline"
          >
            {t("aboutLink")}
          </Link>
        </nav>
        <div className="flex items-center gap-3 mb-4 justify-end">
          <Link
            href="https://discord.gg/nnQGn86K2n"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Join our Discord"
            className="opacity-60 hover:opacity-100 transition-opacity"
          >
            <Image
              src="/discord.svg"
              alt="Discord"
              width={24}
              height={24}
              className="invert"
            />
          </Link>
          <Link
            href="https://github.com/LukasOlivier/route-random"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View on GitHub"
            className="opacity-60 hover:opacity-100 transition-opacit"
          >
            <Image
              src="/github.svg"
              alt="GitHub"
              width={24}
              height={24}
              className="invert"
            />
          </Link>
        </div>
      </footer>
    </>
  );
}
