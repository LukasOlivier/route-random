"use client";

import { useEffect, useState } from "react";
import { useLocationStore } from "../../stores";

export function useRouteFromUrl() {
  const { setGeneratedRoute, setRouteId, generatedRoute } = useLocationStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadRouteFromUrl = async () => {
      if (generatedRoute) return;

      const params = new URLSearchParams(window.location.search);
      const routeId = params.get("route");

      if (!routeId) return;

      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(routeId)) {
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch(`/api/routes/${routeId}`);

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
          console.log("Loaded route from URL:", {
            id: data.route.id,
            distance: data.route.distance,
            waypoints: data.route.waypoints,
          });
          setGeneratedRoute({
            coordinates: data.route.coordinates,
            distance: data.route.distance,
          });
          setRouteId(routeId);
          useLocationStore.setState({ isRouteAccepted: true });
        }
      } catch (err) {
        console.error("Error loading route from URL:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadRouteFromUrl();
  }, [generatedRoute, setGeneratedRoute, setRouteId]);

  return { isLoading };
}
