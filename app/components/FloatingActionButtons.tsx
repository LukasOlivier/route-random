"use client";

import { Send, Check, RotateCcw } from "lucide-react";
import { useLocationStore } from "../../stores/store";

interface FloatingActionButtonsProps {
  onGenerateRoute: () => void;
  isGeneratingRoute: boolean;
  mode: string;
  distance: string;
  time: string;
  startLocation: any;
}

export default function FloatingActionButtons({
  onGenerateRoute,
  isGeneratingRoute,
  mode,
  distance,
  time,
  startLocation,
}: FloatingActionButtonsProps) {
  const { generatedRoute, isRouteAccepted, acceptRoute, resetRoute } =
    useLocationStore();

  const handleAcceptRoute = () => {
    acceptRoute();
  };

  const handleResetRoute = () => {
    resetRoute();
  };

  const canGenerate =
    startLocation &&
    ((mode === "distance" && distance) || (mode === "time" && time));

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[1000] md:hidden">
      {generatedRoute ? (
        <div className="flex gap-2">
          {!isRouteAccepted && (
            <button
              type="button"
              onClick={handleAcceptRoute}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg shadow-lg transition-colors flex justify-center items-center"
            >
              <Check className="inline-block mr-2" size={18} />
              Accept Route
            </button>
          )}
          <button
            type="button"
            onClick={handleResetRoute}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg shadow-lg transition-colors flex justify-center items-center"
          >
            <RotateCcw className="inline-block mr-2" size={18} />
            Reset
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onGenerateRoute}
          disabled={isGeneratingRoute || !canGenerate}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg shadow-lg transition-colors flex justify-center items-center"
        >
          <Send
            className={`inline-block mr-2 ${
              isGeneratingRoute ? "animate-pulse" : ""
            }`}
            size={18}
          />
          {isGeneratingRoute ? "Generating..." : "Generate Route"}
        </button>
      )}
    </div>
  );
}
