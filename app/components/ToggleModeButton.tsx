"use client";

// A button to toggle between time based or distance based generation

interface ToggleModeButtonProps {
  text: string;
  selected: boolean;
  onClick: () => void;
}

export default function ToggleModeButton({
  text,
  selected,
  onClick,
}: ToggleModeButtonProps) {
  return (
    <button
      type="button"
      className={`px-4 flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
        selected
          ? "bg-blue-500 text-white"
          : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
      } shadow-sm `}
      onClick={onClick}
    >
      {text}
    </button>
  );
}
