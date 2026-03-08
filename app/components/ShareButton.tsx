"use client";

import { Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocationStore } from "../../stores/store";
import { downloadRouteAsGPX } from "../utils/gpxUtils";
import FloatingButton from "./FloatingButton";

export default function ShareButton() {
  const t = useTranslations("ShareButton");
  const { generatedRoute, isRouteAccepted } = useLocationStore();

  const shareRoute = async () => {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: document.title,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch (error) {
      console.error("Error sharing route:", error);
    }
  };

  // Only show button if route is accepted
  if (!isRouteAccepted || !generatedRoute) {
    return null;
  }

  return (
    <FloatingButton
      onClick={shareRoute}
      ariaLabel={t("ariaLabel")}
      title={t("ariaLabel")}
      showTextOnDesktop={true}
    >
      <Share2 size={20} />
      <span className="hidden lg:inline">{t("shareRoute")}</span>
    </FloatingButton>
  );
}
