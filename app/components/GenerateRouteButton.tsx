"use client";

import { Send } from "lucide-react";
import { useTranslations } from "next-intl";

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

  const umamiDataAttributes = Object.fromEntries(
    Object.entries(umamiEventData).map(([key, value]) => [
      `data-umami-event-${key}`,
      value,
    ]),
  );

  const handleClick = () => {
    if (onSubmit) {
      onSubmit();
    }
  };

  return (
    <button
      type="submit"
      disabled={isGeneratingRoute || disabled}
      onClick={onSubmit ? handleClick : undefined}
      className={`w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-md transition-colors flex justify-center items-center ${className}`}
      data-umami-event={umamiEventName}
      {...umamiDataAttributes}
    >
      <Send
        className={`inline-block mr-2 ${
          isGeneratingRoute ? "animate-pulse" : ""
        }`}
        size={16}
      />
      {isGeneratingRoute ? t("generating") : t("generateRoute")}
    </button>
  );
}
