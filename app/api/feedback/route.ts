import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase, saveRoute } from "@/lib/db";

type FeedbackReaction = "like" | "neutral" | "dislike";

const reactionEmoji = {
  like: "👍",
  neutral: "😐",
  dislike: "👎",
};

const reactionDescriptions = {
  like: "Like it",
  neutral: "Could be better",
  dislike: "Dislike it",
};

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();

    const body = await request.json();
    const {
      reaction,
      routeId,
      generatedDistance,
      requestedDistance,
      additionalFeedback,
      isNoFitFlow,
      isGeneralFeedback,
      currentUrl,
    } = body;

    if (!reaction || !["like", "neutral", "dislike"].includes(reaction)) {
      return NextResponse.json({ error: "Invalid reaction" }, { status: 400 });
    }

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
      console.warn("DISCORD_WEBHOOK_URL not configured");
      return NextResponse.json({ success: true });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ??
      "https://route-random.lukasolivier.be";

    const routeUrl = routeId ? `${baseUrl}/?route=${routeId}` : null;

    const reactionEmoji_ = reactionEmoji[reaction as FeedbackReaction];
    const reactionDesc = reactionDescriptions[reaction as FeedbackReaction];

    let description = isGeneralFeedback
      ? `**General App Feedback** ${reactionEmoji_}`
      : `**User Feedback: ${reactionDesc}** ${reactionEmoji_}`;

    if (generatedDistance && requestedDistance) {
      description += `\nRequested: ${Math.round(requestedDistance)} km | Generated: ${Math.round(generatedDistance)} km`;
    } else if (generatedDistance) {
      description += `\nRoute distance: ${Math.round(generatedDistance)} km`;
    }

    if (additionalFeedback && additionalFeedback.trim()) {
      description += `\n\n> ${additionalFeedback}`;
    }

    if (routeUrl) {
      description += `\n\nRoute: ${routeUrl}`;
    }

    const title = isGeneralFeedback
      ? "General App Feedback Received"
      : isNoFitFlow
        ? "No-fit Feedback — Could not find a fitting route"
        : "Route Feedback Received";

    if (isNoFitFlow) {
      description =
        `**Context: no-fit** — the user couldn't find a fitting route.` +
        (description ? `\n\n${description}` : "");
    }

    if (isGeneralFeedback) {
      description =
        `**Context: general app feedback** — the user shared feedback about the app overall.` +
        (description ? `\n\n${description}` : "");
    }

    if (currentUrl) {
      description += `\n\nPage URL: ${currentUrl}`;
    }

    const embeds = [
      {
        title,
        description,
        color:
          reaction === "like"
            ? 0x22c55e // Green for like
            : reaction === "neutral"
              ? 0xf59e0b // Amber for neutral
              : 0xef4444, // Red for dislike
        ...(routeUrl && { url: routeUrl }),
      },
    ];

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds }),
    });

    if (!response.ok) {
      console.error(
        `Failed to send feedback to Discord: ${response.statusText}`,
      );
      return NextResponse.json({ success: false }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing feedback:", error);
    return NextResponse.json(
      { error: "Failed to process feedback" },
      { status: 500 },
    );
  }
}
