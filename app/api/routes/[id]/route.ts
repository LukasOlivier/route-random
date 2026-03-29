import { NextRequest, NextResponse } from "next/server";
import { getRoute, initializeDatabase } from "@/lib/db";

let initialized = false;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!initialized) {
      await initializeDatabase();
      initialized = true;
    }

    const { id } = await params;

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
