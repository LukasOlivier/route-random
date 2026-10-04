import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { saveRoute, initializeDatabase } from "@/lib/db";
import { notifyDiscord } from "@/app/utils/discordNotifications";
import { getLogger } from "@/lib/logger";

const logger = getLogger("api.routes");

let initialized = false;

const MAX_SAVED_ROUTE_COORDINATES = 10_000;

function isValidRoutePayload(
  value: unknown,
): value is { coordinates: [number, number][]; distance: number } {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const { coordinates, distance } = value as {
    coordinates?: unknown;
    distance?: unknown;
  };

  return (
    typeof distance === "number" &&
    Number.isFinite(distance) &&
    distance > 0 &&
    Array.isArray(coordinates) &&
    coordinates.length > 0 &&
    coordinates.length <= MAX_SAVED_ROUTE_COORDINATES &&
    coordinates.every(
      (coordinate) =>
        Array.isArray(coordinate) &&
        coordinate.length === 2 &&
        coordinate.every(
          (value) => typeof value === "number" && Number.isFinite(value),
        ) &&
        coordinate[0] >= -180 &&
        coordinate[0] <= 180 &&
        coordinate[1] >= -90 &&
        coordinate[1] <= 90,
    )
  );
}

export async function POST(request: NextRequest) {
  try {
    if (!initialized) {
      logger.debug("Initializing database");
      await initializeDatabase();
      initialized = true;
    }

    const body: unknown = await request.json();

    if (!isValidRoutePayload(body)) {
      logger.warn({ hasBody: !!body }, "Missing required fields");
      return NextResponse.json(
        { error: "coordinates and distance are required" },
        { status: 400 },
      );
    }

    const { coordinates, distance } = body;

    logger.info(
      { distance, coordinatesLength: coordinates.length },
      "Saving route",
    );

    const id = await saveRoute({
      coordinates: coordinates,
      distance,
    });

    logger.info({ id, distance }, "Route saved successfully");

    /*
    after(() =>
      notifyDiscord({
        event: "route_generated",
        routeId: id,
        distance,
      }),
    );
    */

    return NextResponse.json({ success: true, id });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    logger.error({ error: errorMessage }, "Error saving route");

    after(() =>
      notifyDiscord({
        event: "route_generation_failed",
        errorMessage,
      }),
    );
    return NextResponse.json(
      { error: "Failed to save route" },
      { status: 500 },
    );
  }
}
