"use client";

import { useShallow } from "zustand/react/shallow";

import { useLocationStore } from "../../stores";
import GenerateRouteButton from "./GenerateRouteButton";
import AcceptRouteButton from "./AcceptRouteButton";
import ResetRouteButton from "./ResetRouteButton";
import { useRouteGeneration } from "../hooks/useRouteGeneration";

export default function MobileBottomBar() {
  const { generatedRoute, resetRoute, acceptRoute, isRouteAccepted } =
    useLocationStore(
      useShallow((state) => ({
        generatedRoute: state.generatedRoute,
        resetRoute: state.resetRoute,
        acceptRoute: state.acceptRoute,
        isRouteAccepted: state.isRouteAccepted,
      })),
    );

  const { generateRoute, isGeneratingRoute } = useRouteGeneration();

  const handleAcceptRoute = () => {
    acceptRoute();
  };

  const handleResetRoute = () => {
    resetRoute();
  };

  return (
    <div className="absolute bottom-5 left-0 right-0 z-9999 lg:hidden p-4">
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
