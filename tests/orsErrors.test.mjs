import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyOrsError,
  isTransientOrsStatus,
} from "../app/services/orsErrors.ts";

test("classifies unroutable-point errors as non-retryable no-route failures", () => {
  const error = classifyOrsError(
    400,
    "Could not find routable point within a radius of 350.0 meters",
  );

  assert.equal(error.kind, "no-route");
  assert.equal(error.status, 400);
  assert.equal(isTransientOrsStatus(error.status), false);
});

test("classifies ORS 404 code 2010 as an invalid start location", () => {
  const error = classifyOrsError(
    404,
    '{"error":{"code":2010,"message":"Cannot find point 0: 53.956,2.911"}}',
  );

  assert.equal(error.kind, "invalid-start-location");
  assert.equal(error.status, 404);
  assert.equal(isTransientOrsStatus(error.status), false);
});

test("classifies quota exhaustion without marking it retryable", () => {
  const error = classifyOrsError(403, "Quota exceeded");

  assert.equal(error.kind, "quota");
  assert.equal(isTransientOrsStatus(error.status), false);
});

test("preserves upstream 429 retry-after information", () => {
  const error = classifyOrsError(429, "Rate limit reached", "30");

  assert.equal(error.kind, "rate-limited");
  assert.equal(error.retryAfter, "30");
  assert.equal(isTransientOrsStatus(error.status), false);
});

test("classifies gateway and infrastructure errors as transient", () => {
  for (const status of [500, 502, 503, 504]) {
    const error = classifyOrsError(status, "Upstream failure");

    assert.equal(error.kind, "unavailable");
    assert.equal(isTransientOrsStatus(status), true);
  }
});

test("does not classify unrelated client errors as transient", () => {
  const error = classifyOrsError(400, "Invalid request body");

  assert.equal(error.kind, "invalid-request");
  assert.equal(isTransientOrsStatus(400), false);
});
