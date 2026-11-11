"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { useTranslations } from "next-intl";

const ANDROID_PACKAGE_ID = "be.lukasolivier.route_random.twa";
const INSTALL_URL =
  "https://play.google.com/store/apps/details?id=be.lukasolivier.route_random.twa";
const DISMISSAL_STORAGE_KEY = "android-app-install-prompt-dismissed-until";
const DISMISSAL_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;

interface RelatedApp {
  platform?: string;
  id?: string;
}

interface NavigatorWithAppDetection extends Navigator {
  userAgentData?: {
    platform?: string;
  };
  getInstalledRelatedApps?: () => Promise<RelatedApp[]>;
}

export default function AndroidAppInstallPrompt() {
  const t = useTranslations("AndroidAppInstallPrompt");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const browserNavigator = navigator as NavigatorWithAppDetection;
    const platform = browserNavigator.userAgentData?.platform;
    const isAndroid = platform
      ? /android/i.test(platform)
      : /Android/i.test(browserNavigator.userAgent);

    if (!isAndroid) return;

    try {
      const dismissedUntil = Number(
        window.localStorage.getItem(DISMISSAL_STORAGE_KEY),
      );
      if (dismissedUntil > Date.now()) return;
    } catch {
      // Storage can be unavailable in restricted browser contexts.
    }

    const checkInstalledApp = async () => {
      try {
        const installedApps =
          await browserNavigator.getInstalledRelatedApps?.();
        const isInstalled = installedApps?.some(
          (app) => app.platform === "play" && app.id === ANDROID_PACKAGE_ID,
        );

        if (!isInstalled) setIsVisible(true);
      } catch {
        setIsVisible(true);
      }
    };

    void checkInstalledApp();
  }, []);

  const dismissPrompt = () => {
    try {
      window.localStorage.setItem(
        DISMISSAL_STORAGE_KEY,
        String(Date.now() + DISMISSAL_PERIOD_MS),
      );
    } catch {
      // The prompt is still dismissed for the current page session.
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label={t("ariaLabel")}
      className="fixed inset-x-3 bottom-20 z-[1000002] mx-auto flex max-w-md items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 text-gray-900 shadow-xl dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
    >
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{t("title")}</p>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          {t("description")}
        </p>
        <a
          href={INSTALL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <Download size={18} aria-hidden="true" />
          {t("install")}
        </a>
      </div>
      <button
        type="button"
        onClick={dismissPrompt}
        aria-label={t("dismiss")}
        className="shrink-0 rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
      >
        <X size={18} aria-hidden="true" />
      </button>
    </aside>
  );
}
