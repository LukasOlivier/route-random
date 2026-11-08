export type RouteServiceErrorKind =
  "quota" | "rate-limited" | "no-route" | "invalid-request" | "unavailable";

export class RouteServiceError extends Error {
  readonly kind: RouteServiceErrorKind;
  readonly status?: number;
  readonly retryAfter?: string | null;

  constructor(
    message: string,
    kind: RouteServiceErrorKind,
    status?: number,
    retryAfter?: string | null,
  ) {
    super(message);
    this.kind = kind;
    this.status = status;
    this.retryAfter = retryAfter;
    this.name = "RouteServiceError";
  }
}

export function classifyOrsError(
  status: number,
  errorText: string,
  retryAfter?: string | null,
): RouteServiceError {
  if (status === 429) {
    return new RouteServiceError(
      `ORS rate limit reached: ${errorText}`,
      "rate-limited",
      status,
      retryAfter,
    );
  }

  if (status === 403) {
    return new RouteServiceError(
      `ORS quota or access limit reached: ${errorText}`,
      "quota",
      status,
    );
  }

  if (
    status === 400 &&
    /no route|routable point|valid point|could not find a route/i.test(
      errorText,
    )
  ) {
    return new RouteServiceError(
      `No route found: ${errorText}`,
      "no-route",
      status,
    );
  }

  if (status >= 500) {
    return new RouteServiceError(
      `ORS API error: ${status} - ${errorText}`,
      "unavailable",
      status,
      retryAfter,
    );
  }

  return new RouteServiceError(
    `ORS API error: ${status} - ${errorText}`,
    "invalid-request",
    status,
  );
}

export function isTransientOrsStatus(status: number): boolean {
  return [500, 502, 503, 504].includes(status);
}
