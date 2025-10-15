"use client";

import { ReactNode } from "react";

interface FloatingButtonProps {
  onClick: () => void;
  children: ReactNode;
  className?: string;
  variant?: "default" | "active";
  ariaLabel: string;
  title?: string;
  hideOnDesktop?: boolean;
  showTextOnDesktop?: boolean;
}

export default function FloatingButton({
  onClick,
  children,
  className = "",
  variant = "default",
  ariaLabel,
  title,
  hideOnDesktop = false,
  showTextOnDesktop = false,
}: FloatingButtonProps) {
  const baseClasses = `h-10 w-10 rounded-md transition-colors flex items-center justify-center`;

  const variantClasses = {
    default:
      "dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800 bg-white text-black hover:bg-gray-200",
    active: "bg-blue-600 text-white hover:bg-blue-700",
  };

  const responsiveClasses = hideOnDesktop
    ? "md:hidden"
    : showTextOnDesktop
    ? "md:w-fit md:px-3 md:gap-2"
    : "";

  const borderClasses =
    variant === "default" ? "border dark:border-gray-700 border-gray-200" : "";

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${responsiveClasses} ${borderClasses} ${className}`}
      aria-label={ariaLabel}
      title={title || ariaLabel}
    >
      {children}
    </button>
  );
}
