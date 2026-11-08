import { Redis } from "@upstash/redis";
import { getLogger } from "@/lib/logger";

const logger = getLogger("utils.rateLimit");

const DEFAULT_MAX_REQUESTS = 10;
const DEFAULT_WINDOW_MS = 5 * 60 * 1000;

function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

const maxRequests = parsePositiveInteger(
  process.env.ROUTE_GENERATION_RATE_LIMIT_MAX,
  DEFAULT_MAX_REQUESTS,
);

const windowMs = parsePositiveInteger(
  process.env.ROUTE_GENERATION_RATE_LIMIT_WINDOW_MS,
  DEFAULT_WINDOW_MS,
);

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export type RateLimitDecision = {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

export class RateLimitUnavailableError extends Error {
  constructor() {
    super("Route generation rate limit is temporarily unavailable");
    this.name = "RateLimitUnavailableError";
  }
}

export async function checkRouteGenerationRateLimit(
  clientKey: string,
): Promise<RateLimitDecision> {
  const now = Date.now();
  const windowId = Math.floor(now / windowMs);
  const reset = (windowId + 1) * windowMs;
  const key = `rate_limit:route_generation:${clientKey}:${windowId}`;

  try {
    await redis.set(key, "0", {
      nx: true,
      px: Math.max(1, reset - now),
    });
    const currentCount = await redis.incr(key);

    return {
      allowed: currentCount <= maxRequests,
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - currentCount),
      reset,
    };
  } catch (error) {
    logger.error(
      { error, clientKey },
      "Rate limit check failed; rejecting route generation",
    );
    throw new RateLimitUnavailableError();
  }
}
