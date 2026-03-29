"use client";

import { Send } from "lucide-react";
import { useTranslations } from "next-intl";
import ActionButton from "./ActionButton";

interface GenerateRouteButtonProps {
  isGeneratingRoute: boolean;
  disabled?: boolean;
  onSubmit?: () => void;
  className?: string;
  umamiEventName?: string;
  umamiEventData?: Record<string, string>;
}

export default function GenerateRouteButton({
  isGeneratingRoute,
  disabled = false,
  onSubmit,
  className = "",
  umamiEventName = "Generate route",
  umamiEventData = {},
}: GenerateRouteButtonProps) {
  const t = useTranslations("GenerateRouteButton");

  return (
    <ActionButton
      type="submit"
      onClick={onSubmit}
      disabled={disabled}
      loading={isGeneratingRoute}
      variant="primary"
      icon={<Send size={16} />}
      className={`w-full ${className}`}
      umamiEventName={umamiEventName}
      umamiEventData={umamiEventData}
    >
      {isGeneratingRoute ? t("generating") : t("generateRoute")}
    </ActionButton>
  );
}
