import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid database URL"),
  ORS_API_KEY: z.string().min(1, "ORS_API_KEY is required"),
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
