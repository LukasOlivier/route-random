import assert from "node:assert/strict";
import test from "node:test";
import { resolveLocale } from "../i18n/locales.ts";
import { updateSearchParams, isValidRouteId } from "../app/utils/urlParams.ts";
import { requestGeneratedRoute } from "../app/services/routeClient.ts";
import { useLocationStore } from "../stores/store.ts";

test("locale selection validates cookies and supports every translated language", () => {
  assert.equal(resolveLocale("fr", "nl-BE,nl;q=0.9"), "fr");
  assert.equal(resolveLocale("../../private", "de-DE,de;q=0.9"), "de");
  assert.equal(resolveLocale(undefined, "es-ES"), "es");
  assert.equal(resolveLocale("invalid", "unknown"), "en");
});

test("URL updates preserve unrelated parameters and fragments, including when clearing a route", (t) => {
  let location = new URL("https://example.com/?route=old&distance=5#map");
  globalThis.window = {
    get location() {
      return location;
    },
    history: {
      replaceState(_state, _title, url) {
        location = new URL(url, location);
      },
    },
  };
  t.after(() => {
    delete globalThis.window;
  });
  updateSearchParams((params) => params.set("pace", "walking"));
  updateSearchParams((params) => params.delete("route"));
  assert.equal(location.searchParams.get("distance"), "5");
  assert.equal(location.searchParams.get("pace"), "walking");
  assert.equal(location.searchParams.has("route"), false);
  assert.equal(location.hash, "#map");
});

test("route IDs use the same validation for loading and fetching", () => {
  assert.equal(isValidRouteId("c781b5d0-9197-48ad-b362-01e9299333a0"), true);
  assert.equal(isValidRouteId("../other"), false);
});

test("route requests classify API errors and reject empty successes", async (t) => {
  const mock = t.mock.method(globalThis, "fetch");
  for (const [status, body, expected] of [
    [429, {}, "rateLimited"],
    [503, {}, "serviceUnavailable"],
    [400, { errorCode: "invalid_start_location" }, "noRouteFound"],
    [400, { errorCode: "route_distance_too_long" }, "distanceTooLong"],
    [200, { success: true }, "generic"],
  ]) {
    mock.mock.mockImplementation(async () => Response.json(body, { status }));
    await assert.rejects(requestGeneratedRoute({ distance: 5 }), {
      message: expected,
    });
  }
  const route = {
    coordinates: [
      [4, 51],
      [4.01, 51.01],
    ],
    distance: 5000,
  };
  mock.mock.mockImplementation(async () =>
    Response.json({ success: true, route }),
  );
  assert.deepEqual((await requestGeneratedRoute({ distance: 5 })).route, route);
});

test("blocked local storage does not prevent updating a user's location", (t) => {
  globalThis.window = {};
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get() {
      throw new Error("Storage blocked");
    },
  });
  t.after(() => {
    delete globalThis.window;
    delete globalThis.localStorage;
  });
  useLocationStore.getState().setUserLocation([51, 4]);
  assert.deepEqual(useLocationStore.getState().userLocation, [51, 4]);
});
