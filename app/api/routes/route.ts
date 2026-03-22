import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { saveRoute, initializeDatabase } from "@/lib/db";
import { notifyDiscord } from "@/app/utils/discordNotifications";

let initialized = false;

export async function POST(request: NextRequest) {
  try {
    if (!initialized) {
      await initializeDatabase();
      initialized = true;
    }

    const body = await request.json();
    const { coordinates, distance } = body;

    if (!coordinates || !distance) {
      return NextResponse.json(
        { error: "coordinates and distance are required" },
        { status: 400 },
      );
    }

    const id = await saveRoute({
      coordinates: coordinates,
      distance,
    });

    after(() =>
      notifyDiscord({
        event: "route_generated",
        routeId: id,
        distance,
      }),
    );

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Error saving route:", error);
    after(() =>
      notifyDiscord({
        event: "route_generation_failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      }),
    );
    return NextResponse.json(
      { error: "Failed to save route" },
      { status: 500 },
    );
  }
}
