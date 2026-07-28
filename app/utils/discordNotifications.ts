type NotificationEvent =
  | "route_generated"
  | "route_generation_failed"
  | "address_completion_failed";

interface DiscordNotificationParams {
  event: NotificationEvent;
  distance?: number;
  routeId?: string;
  errorMessage?: string;
  statusCode?: number;
  requestBody?: unknown;
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
  statusCode,
  requestBody,
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
    const fields: Array<{ name: string; value: string; inline?: boolean }> = [];

    if (typeof statusCode === "number") {
      fields.push({
        name: "Status code",
        value: String(statusCode),
        inline: true,
      });
    }

    if (requestBody !== undefined) {
      fields.push({
        name: "Request body",
        value: formatDiscordValue(requestBody),
      });
    }

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
            ...(fields.length > 0 && { fields }),
          },
        ],
      }),
    });
  } catch (error) {
    console.error(`Failed to send Discord notification for ${event}:`, error);
  }
}

function formatDiscordValue(value: unknown): string {
  const normalized =
    typeof value === "string" ? value : JSON.stringify(value, null, 2);

  const text = normalized ?? String(value);
  const maxLength = 900;

  if (text.length <= maxLength) {
    return `\`\`\`json\n${text}\n\`\`\``;
  }

  return `\`\`\`json\n${text.slice(0, maxLength)}…\n\`\`\``;
}
