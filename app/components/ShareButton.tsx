"use client";

import { useRef } from "react";
import { Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocationStore } from "../../stores/store";
import FloatingButton from "./FloatingButton";
import { withRouteGuard } from "./withRouteGuard";

function ShareButtonContent() {
  const t = useTranslations("ShareButton");
  const { routeId } = useLocationStore();
  const isSharingRef = useRef(false);

  const shareRoute = async () => {
    if (isSharingRef.current) {
      return;
    }

    isSharingRef.current = true;
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
      if (
        error instanceof DOMException &&
        (error.name === "AbortError" ||
          error.name === "InvalidStateError" ||
          error.message.toLowerCase().includes("share canceled"))
      ) {
        return;
      }

      console.error("Error sharing route:", error);
    } finally {
      isSharingRef.current = false;
    }
  };

  if (!routeId) {
    return null;
  }

  return (
    <FloatingButton
      onClick={shareRoute}
      ariaLabel={t("ariaLabel")}
      title={t("ariaLabel")}
      showTextOnDesktop={true}
      umamiEvent="Share route"
      umamiEventData={{ source: "floating-actions", route_id: String(routeId) }}
    >
      <Share2 size={20} />
      <span className="hidden lg:inline">{t("shareRoute")}</span>
    </FloatingButton>
  );
}

export default withRouteGuard(ShareButtonContent);
