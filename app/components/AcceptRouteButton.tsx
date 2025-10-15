"use client";

import { Check } from "lucide-react";

interface AcceptRouteButtonProps {
  onAccept: () => void;
  disabled?: boolean;
  className?: string;
}

export default function AcceptRouteButton({
  onAccept,
  disabled = false,
  className = "",
}: AcceptRouteButtonProps) {
  return (
    <button
      type="button"
      onClick={onAccept}
      disabled={disabled}
      className={`bg-green-600 hover:bg-green-800 disabled:bg-green-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-md transition-colors flex justify-center items-center ${className}`}
    >
      <Check className="inline-block mr-2" size={16} />
      Accept
    </button>
  );
}
