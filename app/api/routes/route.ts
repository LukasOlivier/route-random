import { NextRequest, NextResponse } from "next/server";
import { saveRoute, initializeDatabase } from "@/lib/db";

// Initialize database on first request
let initialized = false;

export async function POST(request: NextRequest) {
  try {
    // Ensure table exists
    if (!initialized) {
      await initializeDatabase();
      initialized = true;
    }

    const body = await request.json();
    const { coordinates, waypoints, distance } = body;

    if (!coordinates || !distance) {
      return NextResponse.json(
        { error: "coordinates and distance are required" },
        { status: 400 },
      );
    }

    const id = await saveRoute({ coordinates, waypoints, distance });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Error saving route:", error);
    return NextResponse.json(
      { error: "Failed to save route" },
      { status: 500 },
    );
  }
}
