import { NextRequest, NextResponse } from "next/server";
import { getRoute, initializeDatabase } from "@/lib/db";

// Initialize database on first request
let initialized = false;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Ensure table exists
    if (!initialized) {
      await initializeDatabase();
      initialized = true;
    }

    const { id } = await params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: "Invalid route ID" }, { status: 400 });
    }

    const route = await getRoute(id);

    if (!route) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, route });
  } catch (error) {
    console.error("Error fetching route:", error);
    return NextResponse.json(
      { error: "Failed to fetch route" },
      { status: 500 },
    );
  }
}
