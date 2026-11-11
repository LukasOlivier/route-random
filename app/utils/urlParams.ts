/** Update the current URL without navigation, retaining unrelated parameters and hash. */
export function updateSearchParams(update: (params: URLSearchParams) => void) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  update(url.searchParams);
  window.history.replaceState(
    null,
    "",
    `${url.pathname}${url.search}${url.hash}`,
  );
}

export function syncStartLocationToParams([lat, lon]: [
  number,
  number,
  number?,
]) {
  updateSearchParams((params) => {
    params.set("lat", String(lat));
    params.set("lon", String(lon));
  });
}

export function isValidRouteId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}
