"use client";

import { RotateCcw } from "lucide-react";

interface ResetRouteButtonProps {
  onReset: () => void;
  disabled?: boolean;
  className?: string;
}

export default function ResetRouteButton({
  onReset,
  disabled = false,
  className = "",
}: ResetRouteButtonProps) {
  return (
    <button
      type="button"
      onClick={onReset}
      disabled={disabled}
      className={`bg-gray-500 hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-md transition-colors flex justify-center items-center ${className}`}
    >
      <RotateCcw className="inline-block mr-2" size={16} />
      Reset
    </button>
  );
}
