import { ComponentType } from "react";
import { useLocationStore } from "../../stores/store";

export function withRouteGuard<P extends object>(
  Component: ComponentType<P>,
): ComponentType<P> {
  return function GuardedComponent(props: P) {
    const { generatedRoute, isRouteAccepted } = useLocationStore();

    if (!isRouteAccepted || !generatedRoute) {
      return null;
    }

    return <Component {...props} />;
  };
}
