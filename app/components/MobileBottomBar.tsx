"use client";

import { useLocationStore } from "../../stores";
import GenerateRouteButton from "./GenerateRouteButton";
import AcceptRouteButton from "./AcceptRouteButton";
import ResetRouteButton from "./ResetRouteButton";
import { useRouteGeneration } from "../hooks/useRouteGeneration";

export default function MobileBottomBar() {
  const { generatedRoute, resetRoute, acceptRoute, isRouteAccepted } =
    useLocationStore();

  const { generateRoute, isGeneratingRoute } = useRouteGeneration();

  const handleAcceptRoute = () => {
    acceptRoute();
  };

  const handleResetRoute = () => {
    resetRoute();
  };

  return (
    <div className="absolute bottom-5 left-0 right-0 z-[9999] lg:hidden p-4">
      <div className="w-full max-w-sm mx-auto">
        {generatedRoute ? (
          <div className="flex gap-3">
            {!isRouteAccepted && (
              <AcceptRouteButton
                onAccept={handleAcceptRoute}
                className="flex-1"
              />
            )}
            <ResetRouteButton onReset={handleResetRoute} className="flex-1" />
          </div>
        ) : (
          <GenerateRouteButton
            isGeneratingRoute={isGeneratingRoute}
            onSubmit={generateRoute}
          />
        )}
      </div>
    </div>
  );
}
