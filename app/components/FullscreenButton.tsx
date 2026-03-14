import React from "react";
import { useTranslations } from "next-intl";
import FloatingButton from "./FloatingButton";
import { Minimize, Maximize } from "lucide-react";

interface FullscreenButtonProps {
  isFullscreen: boolean;
  onToggle: (isFullscreen: boolean) => void;
}

export default function FullscreenButton({
  isFullscreen,
  onToggle,
}: FullscreenButtonProps) {
  const t = useTranslations("FullScreenButton");

  if (isFullscreen) {
    return (
      <FloatingButton
        onClick={() => onToggle(false)}
        ariaLabel={t("exitFullscreen")}
        hideOnDesktop={true}
      >
        <Minimize size={24} />
      </FloatingButton>
    );
  }

  return (
    <FloatingButton
      onClick={() => onToggle(true)}
      ariaLabel={t("enterFullscreen")}
      hideOnDesktop={true}
    >
      <Maximize size={24} />
    </FloatingButton>
  );
}
