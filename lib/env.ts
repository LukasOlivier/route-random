import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid database URL"),
  ORS_API_KEY: z.string().min(1, "ORS_API_KEY is required"),
  UPSTASH_REDIS_REST_URL: z
    .string()
    .url("UPSTASH_REDIS_REST_URL must be a valid URL"),
  UPSTASH_REDIS_REST_TOKEN: z
    .string()
    .min(1, "UPSTASH_REDIS_REST_TOKEN is required"),
  ROUTE_GENERATION_RATE_LIMIT_MAX: z
    .string()
    .regex(
      /^[1-9]\d*$/,
      "ROUTE_GENERATION_RATE_LIMIT_MAX must be a positive integer",
    )
    .optional(),
  ROUTE_GENERATION_RATE_LIMIT_WINDOW_MS: z
    .string()
    .regex(
      /^[1-9]\d*$/,
      "ROUTE_GENERATION_RATE_LIMIT_WINDOW_MS must be a positive integer",
    )
    .optional(),
  NEXT_PUBLIC_UMAMI_WEBSITE_ID: z.string().optional(),
  DISCORD_WEBHOOK_URL: z.string().url().optional(),
});

type Env = z.infer<typeof envSchema>;

let validatedEnv: Env | null = null;

export function getValidatedEnv(): Env {
  if (validatedEnv) {
    return validatedEnv;
  }

  try {
    validatedEnv = envSchema.parse(process.env);
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join("\n");

      throw new Error(`Environment validation failed:\n${missingVars}`);
    }
    throw error;
  }
}
