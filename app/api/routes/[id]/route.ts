import { NextRequest, NextResponse } from "next/server";
import { getRoute, initializeDatabase } from "@/lib/db";
import { getLogger } from "@/lib/logger";

const logger = getLogger("api.routes.id");

let initialized = false;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!initialized) {
      logger.debug("Initializing database");
      await initializeDatabase();
      initialized = true;
    }

    const { id } = await params;

    logger.debug({ id }, "Fetching route");

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      logger.warn({ id }, "Invalid route ID format");
      return NextResponse.json({ error: "Invalid route ID" }, { status: 400 });
    }

    const route = await getRoute(id);

    if (!route) {
      logger.warn({ id }, "Route not found");
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    logger.info({ id }, "Route retrieved successfully");
    return NextResponse.json({ success: true, route });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    logger.error({ error: errorMessage }, "Error fetching route");
    return NextResponse.json(
      { error: "Failed to fetch route" },
      { status: 500 },
    );
  }
}
