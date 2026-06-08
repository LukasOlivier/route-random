type FeedbackReaction = "like" | "neutral" | "dislike";

interface FeedbackData {
  reaction: FeedbackReaction;
  routeId?: string;
  routeCoordinates?: [number, number][];
  routeDistanceMeters?: number;
  generatedDistance?: number;
  requestedDistance?: number;
  additionalFeedback?: string;
  isNoFitFlow?: boolean;
  isGeneralFeedback?: boolean;
}

const reactionEmoji = {
  like: "👍",
  neutral: "😐",
  dislike: "👎",
};

export async function sendFeedbackToDiscord({
  reaction,
  routeId,
  routeCoordinates,
  routeDistanceMeters,
  generatedDistance,
  requestedDistance,
  additionalFeedback,
  isNoFitFlow,
  isGeneralFeedback,
}: FeedbackData): Promise<void> {
  try {
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reaction,
        routeId,
        routeCoordinates,
        routeDistanceMeters,
        generatedDistance,
        requestedDistance,
        additionalFeedback,
        isNoFitFlow,
        isGeneralFeedback,
      }),
    });

    if (!response.ok) {
      console.error("Failed to send feedback:", response.statusText);
    }
  } catch (error) {
    console.error("Error sending feedback:", error);
  }
}

export function getReactionEmoji(reaction: FeedbackReaction): string {
  return reactionEmoji[reaction];
}
