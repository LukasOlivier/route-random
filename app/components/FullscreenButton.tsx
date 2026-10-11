import React from "react";
import { useTranslations } from "next-intl";
import FloatingButton from "./FloatingButton";
import { Eye, EyeOff } from "lucide-react";

interface FullscreenButtonProps {
  isFullscreen: boolean;
  onToggle: (isFullscreen: boolean) => void;
}

export default function FullscreenButton({
  isFullscreen,
  onToggle,
}: FullscreenButtonProps) {
  const t = useTranslations("MapFocusButton");

  if (isFullscreen) {
    return (
      <FloatingButton
        onClick={() => onToggle(false)}
        ariaLabel={t("exitMapFocus")}
        hideOnDesktop={true}
      >
        <Eye size={24} />
      </FloatingButton>
    );
  }

  return (
    <FloatingButton
      onClick={() => onToggle(true)}
      ariaLabel={t("enterMapFocus")}
      hideOnDesktop={true}
    >
      <EyeOff size={24} />
    </FloatingButton>
  );
}
