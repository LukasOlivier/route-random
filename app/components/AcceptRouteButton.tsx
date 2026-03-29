"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import ActionButton from "./ActionButton";

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

  return (
    <ActionButton
      onClick={onAccept}
      disabled={disabled}
      variant="success"
      icon={<Check size={16} />}
      className={className}
      umamiEventName={umamiEventName}
      umamiEventData={umamiEventData}
    >
      {t("accept")}
    </ActionButton>
  );
}
