import assert from "node:assert/strict";
import test from "node:test";
import {
  generateRoundTripRoute,
  RouteServiceError,
} from "../app/services/orsService.ts";

function routeResponse(distance = 1_000) {
  return new Response(
    JSON.stringify({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            segments: [
              { distance: distance / 4 },
              { distance: distance / 4 },
              { distance: distance / 4 },
              { distance: distance / 4 },
            ],
          },
          geometry: {
            type: "LineString",
            coordinates: [
              [0, 0, 12],
              [0.002, 0, 13],
              [0.002, 0.002, 14],
              [0, 0.002, 13],
              [0, 0, 12],
            ],
          },
        },
      ],
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

async function withMockedFetch(mock, callback) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mock;
  try {
    return await callback();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test("retries a successful ORS 500 response only once", async () => {
  let calls = 0;
  const route = await withMockedFetch(
    async () => {
      calls += 1;
      return calls === 1
        ? new Response("upstream failure", { status: 500 })
        : routeResponse();
    },
    () => generateRoundTripRoute(0, 0, 1_000, "test-key"),
  );

  assert.equal(calls, 2);
  assert.equal(route.distance, 1_000);
  assert.deepEqual(route.coordinates[0], [0, 0]);
});

test("does not retry quota or rate-limit responses", async () => {
  for (const [status, kind] of [
    [403, "quota"],
    [429, "rate-limited"],
  ]) {
    let calls = 0;
    await withMockedFetch(
      async () => {
        calls += 1;
        return new Response("upstream rejected", {
          status,
          headers: status === 429 ? { "Retry-After": "45" } : undefined,
        });
      },
      async () => {
        await assert.rejects(
          generateRoundTripRoute(0, 0, 1_000, "test-key"),
          (error) => {
            assert.ok(error instanceof RouteServiceError);
            assert.equal(error.kind, kind);
            if (status === 429) assert.equal(error.retryAfter, "45");
            return true;
          },
        );
      },
    );
    assert.equal(calls, 1);
  }
});

test("does not repeat requests for an unroutable fixed start point", async () => {
  let calls = 0;
  await withMockedFetch(
    async () => {
      calls += 1;
      return new Response(
        "Could not find routable point within a radius of 350.0 meters",
        { status: 400 },
      );
    },
    async () => {
      await assert.rejects(
        generateRoundTripRoute(0, 0, 1_000, "test-key"),
        /No route found/,
      );
    },
  );

  assert.equal(calls, 1);
});

test("stops after one transient retry for 500, 502 and 504 failures", async () => {
  for (const status of [500, 502, 504]) {
    let calls = 0;
    await withMockedFetch(
      async () => {
        calls += 1;
        return new Response("upstream failure", { status });
      },
      async () => {
        await assert.rejects(
          generateRoundTripRoute(0, 0, 1_000, "test-key"),
          (error) =>
            error instanceof RouteServiceError && error.kind === "unavailable",
        );
      },
    );
    assert.equal(calls, 2);
  }

  let blockedCalls = 0;
  await withMockedFetch(
    async () => {
      blockedCalls += 1;
      return new Response("should not be called", { status: 500 });
    },
    async () => {
      await assert.rejects(
        generateRoundTripRoute(0, 0, 1_000, "test-key"),
        (error) =>
          error instanceof RouteServiceError && error.kind === "unavailable",
      );
    },
  );
  assert.equal(blockedCalls, 0);
});
