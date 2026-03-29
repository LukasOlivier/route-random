"use client";

import { ReactNode } from "react";
import { buildUmamiAttributes } from "../utils/umamiUtils";

export type ButtonVariant = "primary" | "success" | "danger" | "secondary";

interface ActionButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: ButtonVariant;
  icon?: ReactNode;
  children: ReactNode;
  umamiEventName?: string;
  umamiEventData?: Record<string, string>;
  type?: "button" | "submit";
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white",
  success: "bg-green-600 hover:bg-green-800 disabled:bg-green-400 text-white",
  danger: "bg-gray-500 hover:bg-gray-700 disabled:bg-gray-400 text-white",
  secondary: "bg-gray-500 hover:bg-gray-700 disabled:bg-gray-400 text-white",
};

export default function ActionButton({
  onClick,
  disabled = false,
  className = "",
  variant = "primary",
  icon,
  children,
  umamiEventName,
  umamiEventData = {},
  type = "button",
  loading = false,
}: ActionButtonProps) {
  const umamiAttributes = buildUmamiAttributes(umamiEventData);

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${variantStyles[variant]} disabled:cursor-not-allowed font-semibold py-2 px-4 rounded-md transition-colors flex justify-center items-center gap-2 ${className}`}
      data-umami-event={umamiEventName}
      {...umamiAttributes}
    >
      {icon && <span className={loading ? "animate-pulse" : ""}>{icon}</span>}
      <span>{children}</span>
    </button>
  );
}
