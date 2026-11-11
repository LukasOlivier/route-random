export class RequestDeduplicator<T> {
  private readonly completed = new Map<
    string,
    { expiresAt: number; value: T }
  >();
  private readonly inFlight = new Map<string, Promise<T>>();
  private readonly ttlMs: number;
  private readonly maxEntries: number;

  constructor(ttlMs: number, maxEntries: number) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
  }

  async run(key: string, operation: () => Promise<T>): Promise<T> {
    const cached = this.completed.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }
    if (cached) {
      this.completed.delete(key);
    }

    const existing = this.inFlight.get(key);
    if (existing) {
      return existing;
    }

    const pending = operation();
    this.inFlight.set(key, pending);

    try {
      const value = await pending;
      this.completed.set(key, {
        expiresAt: Date.now() + this.ttlMs,
        value,
      });

      while (this.completed.size > this.maxEntries) {
        const oldestKey = this.completed.keys().next().value;
        if (oldestKey === undefined) break;
        this.completed.delete(oldestKey);
      }

      return value;
    } finally {
      if (this.inFlight.get(key) === pending) {
        this.inFlight.delete(key);
      }
    }
  }
}
