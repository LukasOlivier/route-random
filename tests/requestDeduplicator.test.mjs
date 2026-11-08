import assert from "node:assert/strict";
import test from "node:test";
import { RequestDeduplicator } from "../app/utils/requestDeduplicator.ts";

test("coalesces concurrent identical requests and caches successful results", async () => {
  const deduplicator = new RequestDeduplicator(100, 10);
  let calls = 0;
  let release;
  const operation = () => {
    calls += 1;
    return new Promise((resolve) => {
      release = resolve;
    });
  };

  const first = deduplicator.run("same-input", operation);
  const duplicate = deduplicator.run("same-input", operation);
  release({ route: "generated" });

  assert.deepEqual(await first, { route: "generated" });
  assert.deepEqual(await duplicate, { route: "generated" });
  assert.equal(calls, 1);
  assert.deepEqual(
    await deduplicator.run("same-input", async () => {
      calls += 1;
      return { route: "unexpected" };
    }),
    { route: "generated" },
  );
  assert.equal(calls, 1);
});

test("does not cache failed operations", async () => {
  const deduplicator = new RequestDeduplicator(100, 10);
  let calls = 0;

  await assert.rejects(
    deduplicator.run("retryable", async () => {
      calls += 1;
      throw new Error("failed");
    }),
    /failed/,
  );

  assert.equal(
    await deduplicator.run("retryable", async () => {
      calls += 1;
      return "recovered";
    }),
    "recovered",
  );
  assert.equal(calls, 2);
});
