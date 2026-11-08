import { useShallow } from "zustand/react/shallow";
import { ComponentType } from "react";
import { useLocationStore } from "../../stores/store";

export function withRouteGuard<P extends object>(
  Component: ComponentType<P>,
): ComponentType<P> {
  return function GuardedComponent(props: P) {
    const { generatedRoute, isRouteAccepted } = useLocationStore(
      useShallow((state) => ({
        generatedRoute: state.generatedRoute,
        isRouteAccepted: state.isRouteAccepted,
      })),
    );

    if (!isRouteAccepted || !generatedRoute) {
      return null;
    }

    return <Component {...props} />;
  };
}
