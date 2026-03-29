import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { saveRoute, initializeDatabase } from "@/lib/db";
import { notifyDiscord } from "@/app/utils/discordNotifications";
import { getLogger } from "@/lib/logger";

const logger = getLogger("api.routes");

let initialized = false;

export async function POST(request: NextRequest) {
  try {
    if (!initialized) {
      logger.debug("Initializing database");
      await initializeDatabase();
      initialized = true;
    }

    const body = await request.json();
    const { coordinates, distance } = body;

    if (!coordinates || !distance) {
      logger.warn(
        { hasCoordinates: !!coordinates, hasDistance: !!distance },
        "Missing required fields",
      );
      return NextResponse.json(
        { error: "coordinates and distance are required" },
        { status: 400 },
      );
    }

    logger.info(
      { distance, coordinatesLength: coordinates.length },
      "Saving route",
    );

    const id = await saveRoute({
      coordinates: coordinates,
      distance,
    });

    logger.info({ id, distance }, "Route saved successfully");

    after(() =>
      notifyDiscord({
        event: "route_generated",
        routeId: id,
        distance,
      }),
    );

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
