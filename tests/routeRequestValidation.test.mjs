import assert from "node:assert/strict";
import test from "node:test";
import {
  getRouteRequestValidationError,
  isValidStartLocation,
} from "../app/utils/routeRequestValidation.ts";

test("validates starting points as latitude/longitude", () => {
  assert.equal(isValidStartLocation([40.7, -74]), true);
  assert.equal(isValidStartLocation({ lat: 40.7, lng: -74 }), true);
  assert.equal(isValidStartLocation([151.2, -33.8]), false);
  assert.equal(isValidStartLocation([Number.NaN, 0]), false);
  assert.equal(isValidStartLocation({ lat: 91, lng: 0 }), false);
});

test("rejects malformed or unordered regeneration waypoints", () => {
  assert.match(
    getRouteRequestValidationError({
      regenerate: true,
      waypoints: [
        [-33.8, 151.2],
        [0, 0],
      ],
    }),
    /longitude\/latitude/i,
  );
  assert.match(
    getRouteRequestValidationError({
      regenerate: true,
      waypoints: [[151.2, -33.8]],
    }),
    /at least two/i,
  );
});

test("requires finite positive distances and recognized patterns", () => {
  const validStart = [40.7, -74];

  assert.match(
    getRouteRequestValidationError({
      startLocation: validStart,
      distance: Number.NaN,
    }),
    /distance/i,
  );
  assert.match(
    getRouteRequestValidationError({
      startLocation: validStart,
      distance: 5,
      pattern: "unexpected",
    }),
    /pattern/i,
  );
  assert.equal(
    getRouteRequestValidationError({
      startLocation: validStart,
      distance: 5,
      pattern: "circle",
    }),
    undefined,
  );
});
