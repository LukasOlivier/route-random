import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { saveRoute, initializeDatabase } from "@/lib/db";

// Initialize database on first request
let initialized = false;

async function notifyDiscord(id: string, distance: number) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const routeUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? "https://route-random.lukasolivier.be"}/?route=${id}`;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title: "Route accepted!",
            description: `Someone just accepted a route.`,
            url: routeUrl,
            color: 0x22c55e,
          },
        ],
      }),
    });
  } catch (error) {
    console.error("Failed to send Discord notification:", error);
  }
}

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

    const id = await saveRoute({
      coordinates: coordinates,
      distance,
    });

    // Schedule Discord notification after response is sent, keeping the
    // function alive until it completes (Next.js 15 `after` API).
    after(() => notifyDiscord(id, distance));

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Error saving route:", error);
    return NextResponse.json(
      { error: "Failed to save route" },
      { status: 500 },
    );
  }
}
