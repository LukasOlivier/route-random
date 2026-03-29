"use client";

import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import ActionButton from "./ActionButton";

interface ResetRouteButtonProps {
  onReset: () => void;
  disabled?: boolean;
  className?: string;
  umamiEventName?: string;
  umamiEventData?: Record<string, string>;
}

export default function ResetRouteButton({
  onReset,
  disabled = false,
  className = "",
  umamiEventName = "Reset route",
  umamiEventData = {},
}: ResetRouteButtonProps) {
  const t = useTranslations("ResetRouteButton");

  return (
    <ActionButton
      onClick={onReset}
      disabled={disabled}
      variant="secondary"
      icon={<RotateCcw size={16} />}
      className={className}
      umamiEventName={umamiEventName}
      umamiEventData={umamiEventData}
    >
      {t("reset")}
    </ActionButton>
  );
}
