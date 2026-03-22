type NotificationEvent =
  | "route_generated"
  | "route_generation_failed"
  | "address_completion_failed";

interface DiscordNotificationParams {
  event: NotificationEvent;
  distance?: number;
  routeId?: string;
  errorMessage?: string;
}

const eventConfig: Record<NotificationEvent, { title: string; color: number }> =
  {
    route_generated: {
      title: "Route generated!",
      color: 0x22c55e,
    },
    route_generation_failed: {
      title: "Route generation failed",
      color: 0xef4444,
    },
    address_completion_failed: {
      title: "Address completion failed",
      color: 0xf97316,
    },
  };

export async function notifyDiscord({
  event,
  distance,
  routeId,
  errorMessage,
}: DiscordNotificationParams): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const config = eventConfig[event];
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ?? "https://route-random.lukasolivier.be";

  let description = "";
  let url: string | undefined;

  switch (event) {
    case "route_generated":
      description = `Someone just generated a new route with a distance of ${Math.round(distance ?? 0)} meters.`;
      url = routeId ? `${baseUrl}/?route=${routeId}` : undefined;
      break;
    case "route_generation_failed":
      description = `Route generation failed${errorMessage ? `: ${errorMessage}` : "."}`;
      break;
    case "address_completion_failed":
      description = `Address completion failed${errorMessage ? `: ${errorMessage}` : "."}`;
      break;
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title: config.title,
            description,
            ...(url && { url }),
            color: config.color,
          },
        ],
      }),
    });
  } catch (error) {
    console.error(`Failed to send Discord notification for ${event}:`, error);
  }
}
