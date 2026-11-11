import assert from "node:assert/strict";
import test from "node:test";
import { CircuitBreaker } from "../app/utils/circuitBreaker.ts";

test("opens after consecutive failures and closes after cooldown", () => {
  const breaker = new CircuitBreaker(3, 10_000);

  breaker.recordFailure(100);
  breaker.recordFailure(200);
  assert.equal(breaker.canRequest(300), true);

  breaker.recordFailure(400);
  assert.equal(breaker.canRequest(5_000), false);
  assert.equal(breaker.canRequest(10_400), true);
});

test("a successful request resets the failure count", () => {
  const breaker = new CircuitBreaker(2, 10_000);

  breaker.recordFailure(100);
  breaker.recordSuccess();
  breaker.recordFailure(200);

  assert.equal(breaker.canRequest(300), true);
});
