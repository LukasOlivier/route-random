export class CircuitBreaker {
  private failures = 0;
  private openUntil = 0;
  private readonly failureThreshold: number;
  private readonly openDurationMs: number;

  constructor(failureThreshold: number, openDurationMs: number) {
    this.failureThreshold = failureThreshold;
    this.openDurationMs = openDurationMs;
  }

  canRequest(now = Date.now()): boolean {
    if (this.openUntil === 0) return true;
    if (now < this.openUntil) return false;

    this.openUntil = 0;
    this.failures = 0;
    return true;
  }

  recordSuccess(): void {
    this.failures = 0;
    this.openUntil = 0;
  }

  recordFailure(now = Date.now()): void {
    this.failures += 1;
    if (this.failures >= this.failureThreshold) {
      this.failures = 0;
      this.openUntil = now + this.openDurationMs;
    }
  }
}
