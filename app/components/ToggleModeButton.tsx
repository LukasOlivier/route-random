"use client";

// A button to toggle between time based or distance based generation

interface ToggleModeButtonProps {
  text: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export default function ToggleModeButton({
  text,
  selected,
  onClick,
  disabled = false,
}: ToggleModeButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`px-4 flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
        selected
          ? "bg-blue-600 text-white hover:bg-blue-700"
          : "bg-white hover:bg-gray-50 text-black"
      } shadow-sm `}
      onClick={onClick}
    >
      {text}
    </button>
  );
}
