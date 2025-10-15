"use client";

import { Send } from "lucide-react";

interface GenerateRouteButtonProps {
  isGeneratingRoute: boolean;
  disabled?: boolean;
  onSubmit?: () => void;
  className?: string;
}

export default function GenerateRouteButton({
  isGeneratingRoute,
  disabled = false,
  onSubmit,
  className = "",
}: GenerateRouteButtonProps) {
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
    >
      <Send
        className={`inline-block mr-2 ${
          isGeneratingRoute ? "animate-pulse" : ""
        }`}
        size={16}
      />
      {isGeneratingRoute ? "Generating..." : "Generate Route"}
    </button>
  );
}
