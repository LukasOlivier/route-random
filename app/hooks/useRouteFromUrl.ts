"use client";

import { useEffect, useState } from "react";
import { useLocationStore } from "../../stores";

export function useRouteFromUrl() {
  const { setGeneratedRoute, setRouteId, generatedRoute } = useLocationStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRouteFromUrl = async () => {
      // Don't load if we already have a route
      if (generatedRoute) return;

      const params = new URLSearchParams(window.location.search);
      const routeId = params.get("route");

      if (!routeId) return;

      // Validate UUID format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(routeId)) {
        setError("Invalid route ID");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/routes/${routeId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("Route not found");
          } else {
            setError("Failed to load route");
          }
          return;
        }

        const data = await response.json();

        if (data.success && data.route) {
          // log the route without the coordinates to avoid cluttering the console
          console.log("Loaded route from URL:", {
            id: data.route.id,
            distance: data.route.distance,
            waypoints: data.route.waypoints,
          });
          setGeneratedRoute({
            coordinates: data.route.coordinates,
            distance: data.route.distance,
            waypoints: data.route.waypoints,
          });
          setRouteId(routeId);
          // Mark route as accepted without saving to DB again (it's already saved)
          useLocationStore.setState({ isRouteAccepted: true });

          // Set start location from first waypoint so the marker appears
          if (data.route.waypoints?.length) {
            const [lat, lng] = data.route.waypoints[0];
            useLocationStore.getState().setStartLocation([lat, lng]);
          }
        }
      } catch (err) {
        console.error("Error loading route from URL:", err);
        setError("Failed to load route");
      } finally {
        setIsLoading(false);
      }
    };

    loadRouteFromUrl();
  }, [generatedRoute, setGeneratedRoute, setRouteId]);

  const clearUrlRoute = () => {
    window.history.pushState({}, "", "/");
  };

  return { isLoading, error, clearUrlRoute };
}
