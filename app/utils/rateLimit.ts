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

export async function checkRouteGenerationRateLimit(
  clientKey: string,
): Promise<RateLimitDecision> {
  const now = Date.now();
  const windowId = Math.floor(now / windowMs);
  const key = `rate_limit:route_generation:${clientKey}:${windowId}`;

  try {
    const currentCount = await redis.incr(key);
    if (currentCount === 1) {
      await redis.pexpire(key, windowMs);
    }

    return {
      allowed: currentCount <= maxRequests,
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - currentCount),
      reset: (windowId + 1) * windowMs,
    };
  } catch (error) {
    logger.error(
      { error, clientKey },
      "Rate limit check failed; allowing request",
    );

    return {
      allowed: true,
      limit: maxRequests,
      remaining: maxRequests,
      reset: now + windowMs,
    };
  }
}
