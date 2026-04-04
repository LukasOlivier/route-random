"use client";

import { Fragment, useEffect } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useNotificationStore } from "../../stores";
import type { AppNotification } from "../../stores/notificationStore";

function renderMessage(message: string) {
  const pattern = /((?:https?:\/\/|www\.)\S+|buymeacoffee\.com\/lukasolivier)/g;
  const parts = message.split(pattern);

  return parts.map((part, index) => {
    if (!part) {
      return null;
    }

    const isLink =
      /^https?:\/\/\S+$/.test(part) ||
      /^www\.\S+$/.test(part) ||
      part === "buymeacoffee.com/lukasolivier";

    if (isLink) {
      const href = part.startsWith("http") ? part : `https://${part}`;
      return (
        <a
          key={`${part}-${index}`}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="underline decoration-white/60 underline-offset-2 transition hover:decoration-white"
        >
          {part}
        </a>
      );
    }

    return <Fragment key={`${part}-${index}`}>{part}</Fragment>;
  });
}

function iconForVariant(variant: AppNotification["variant"]) {
  if (variant === "error") {
    return <AlertCircle size={18} className="text-red-300" />;
  }

  if (variant === "success") {
    return <CheckCircle2 size={18} className="text-emerald-300" />;
  }

  return <Info size={18} className="text-sky-300" />;
}

function classNameForVariant(variant: AppNotification["variant"]) {
  if (variant === "error") {
    return "border-red-500/50";
  }

  if (variant === "success") {
    return "border-emerald-500/50";
  }

  return "border-sky-500/50";
}

interface NotificationCenterProps {
  offsetForSidebar?: boolean;
}

export default function NotificationCenter({
  offsetForSidebar = false,
}: NotificationCenterProps) {
  const t = useTranslations("Notifications");
  const { notifications, dismissNotification } = useNotificationStore();

  useEffect(() => {
    const timers = notifications.map((notification) =>
      window.setTimeout(() => {
        dismissNotification(notification.id);
      }, notification.durationMs),
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [notifications, dismissNotification]);

  if (notifications.length === 0) {
    return null;
  }

  const positionClass = offsetForSidebar
    ? "left-1/2 lg:left-[62.5%]"
    : "left-1/2";

  return (
    <div
      className={`pointer-events-none fixed top-4 z-[1000001] w-[calc(100%-1rem)] max-w-md -translate-x-1/2 space-y-2 transition-all sm:w-full ${positionClass}`}
    >
      {notifications.map((notification) => (
        <div
          key={notification.id}
          role="status"
          aria-live="polite"
          className={`pointer-events-auto flex items-start gap-3 rounded-lg border bg-gray-900/95 px-4 py-3 text-white shadow-lg backdrop-blur ${classNameForVariant(notification.variant)}`}
        >
          <div className="mt-0.5 shrink-0">
            {iconForVariant(notification.variant)}
          </div>
          <p className="flex-1 text-sm leading-5">
            {renderMessage(notification.message)}
          </p>
          <button
            type="button"
            onClick={() => dismissNotification(notification.id)}
            className="shrink-0 rounded p-1 text-gray-300 transition hover:bg-white/10 hover:text-white"
            aria-label={t("close")}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
