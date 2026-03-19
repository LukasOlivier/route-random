"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

interface AcceptRouteButtonProps {
  onAccept: () => void;
  disabled?: boolean;
  className?: string;
  umamiEventName?: string;
  umamiEventData?: Record<string, string>;
}

export default function AcceptRouteButton({
  onAccept,
  disabled = false,
  className = "",
  umamiEventName = "Accept route",
  umamiEventData = {},
}: AcceptRouteButtonProps) {
  const t = useTranslations("AcceptRouteButton");

  const umamiDataAttributes = Object.fromEntries(
    Object.entries(umamiEventData).map(([key, value]) => [
      `data-umami-event-${key}`,
      value,
    ]),
  );

  return (
    <button
      type="button"
      onClick={onAccept}
      disabled={disabled}
      className={`bg-green-600 hover:bg-green-800 disabled:bg-green-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-md transition-colors flex justify-center items-center ${className}`}
      data-umami-event={umamiEventName}
      {...umamiDataAttributes}
    >
      <Check className="inline-block mr-2" size={16} />
      {t("accept")}
    </button>
  );
}
