"use client";

import { useShallow } from "zustand/react/shallow";

import { useEffect, useState } from "react";
import { isValidRouteId, updateSearchParams } from "../utils/urlParams";
import { getLastRouteIdFromStorage, useLocationStore } from "../../stores";

export function useRouteFromUrl() {
  const { setGeneratedRoute, setRouteId, generatedRoute } = useLocationStore(
    useShallow((state) => ({
      setGeneratedRoute: state.setGeneratedRoute,
      setRouteId: state.setRouteId,
      generatedRoute: state.generatedRoute,
    })),
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const loadRouteFromUrl = async () => {
      if (generatedRoute) return;

      const params = new URLSearchParams(window.location.search);
      let routeId = params.get("route");

      if (!routeId) {
        routeId = getLastRouteIdFromStorage();
        if (routeId) {
          const storedRouteId = routeId;
          updateSearchParams((params) => params.set("route", storedRouteId));
        }
      }

      if (!routeId) return;

      if (!isValidRouteId(routeId)) {
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch(`/api/routes/${routeId}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          if (response.status === 404) {
            console.error("Route not found");
          } else {
            console.error("Failed to load route");
          }
          return;
        }

        const data = await response.json();

        if (data.success && data.route) {
          setGeneratedRoute({
            coordinates: data.route.coordinates,
            distance: data.route.distance,
          });
          setRouteId(routeId);
          useLocationStore.setState({ isRouteAccepted: true });
        }
      } catch (err) {
        if (!controller.signal.aborted)
          console.error("Error loading route from URL:", err);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    void loadRouteFromUrl();
    return () => controller.abort();
  }, [generatedRoute, setGeneratedRoute, setRouteId]);

  return { isLoading };
}
