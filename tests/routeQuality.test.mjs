import assert from "node:assert/strict";
import test from "node:test";
import {
  assessRouteQuality,
  distanceBetweenLonLat,
  getRouteDistanceTolerance,
  isValidLonLat,
  measureRouteQuality,
} from "../app/utils/routeQuality.ts";

test("validates longitude-first coordinates and rejects invalid ranges", () => {
  assert.equal(isValidLonLat([151.2, -33.8]), true);
  assert.equal(isValidLonLat([-33.8, 151.2]), false);
  assert.equal(isValidLonLat([181, 0]), false);
  assert.equal(isValidLonLat([0, Number.NaN]), false);
});

test("measures geographic distance using meters", () => {
  const distance = distanceBetweenLonLat([0, 0], [1, 0]);
  assert.ok(distance > 111_000 && distance < 112_000);
});

test("accepts a closed loop with distinct route segments", () => {
  const metrics = measureRouteQuality([
    [0, 0],
    [0.01, 0],
    [0.01, 0.01],
    [0, 0.01],
    [0, 0],
  ]);

  assert.equal(metrics.closureDistanceMeters, 0);
  assert.equal(metrics.repeatedSegmentPercentage, 0);
});

test("measures repeated outbound and return segments", () => {
  const metrics = measureRouteQuality([
    [0, 0],
    [0.01, 0],
    [0, 0],
  ]);

  assert.ok(metrics.repeatedSegmentPercentage > 0.49);
  assert.ok(metrics.repeatedSegmentPercentage < 0.51);
});

test("rejects malformed route geometry", () => {
  assert.throws(() => measureRouteQuality([[0, 0]]), /invalid coordinates/i);
  assert.throws(
    () =>
      measureRouteQuality([
        [0, 0],
        [0, 91],
      ]),
    /invalid coordinates/i,
  );
});

test("uses a bounded seven-and-a-half-percent distance tolerance", () => {
  assert.equal(getRouteDistanceTolerance(1_000), 100);
  assert.equal(getRouteDistanceTolerance(20_000), 1_500);
});

test("rejects open and out-and-back routes", () => {
  const openRoute = assessRouteQuality(
    [
      [0, 0],
      [0.01, 0],
    ],
    1_000,
  );
  const nearlyClosedRoute = assessRouteQuality(
    [
      [0, 0],
      [0.001, 0],
    ],
    120,
  );
  const retracedRoute = assessRouteQuality(
    [
      [0, 0],
      [0.01, 0],
      [0, 0],
    ],
    2_000,
  );

  assert.match(openRoute.reason, /return close/i);
  assert.match(nearlyClosedRoute.reason, /return close/i);
  assert.match(retracedRoute.reason, /repeats too many/i);
});

test("rejects routes concentrated in a narrow corridor", () => {
  const result = assessRouteQuality(
    [
      [0, 0],
      [0.04, 0],
      [0.04, 0.0001],
      [0, 0.0001],
      [0, 0],
    ],
    9_000,
  );

  assert.match(result.reason, /broad area/i);
});

test("rejects candidates that miss the requested distance tolerance", () => {
  const result = assessRouteQuality(
    [
      [0, 0],
      [0.01, 0],
      [0.01, 0.01],
      [0, 0.01],
      [0, 0],
    ],
    5_000,
    7_000,
    getRouteDistanceTolerance(7_000),
  );

  assert.match(result.reason, /outside the requested distance range/i);
});
