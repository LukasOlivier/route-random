type FeedbackReaction = "like" | "neutral" | "dislike";

interface FeedbackData {
  reaction: FeedbackReaction;
  routeId?: string;
  generatedDistance?: number;
  requestedDistance?: number;
  additionalFeedback?: string;
}

const reactionEmoji = {
  like: "👍",
  neutral: "😐",
  dislike: "👎",
};

export async function sendFeedbackToDiscord({
  reaction,
  routeId,
  generatedDistance,
  requestedDistance,
  additionalFeedback,
}: FeedbackData): Promise<void> {
  try {
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reaction,
        routeId,
        generatedDistance,
        requestedDistance,
        additionalFeedback,
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
