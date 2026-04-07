export type LocationPermissionState =
  | PermissionState
  | "unsupported"
  | "unknown";

export type LocationErrorMessageKey =
  | "unableToGetLocation"
  | "locationPermissionDenied"
  | "locationPermissionBlocked"
  | "locationServicesDisabled"
  | "locationUnavailable"
  | "locationTimeout";

export async function getLocationPermissionState(): Promise<LocationPermissionState> {
  if (typeof navigator === "undefined") {
    return "unknown";
  }

  if (!navigator.permissions || !navigator.permissions.query) {
    return "unsupported";
  }

  try {
    const status = await navigator.permissions.query({ name: "geolocation" });
    return status.state;
  } catch {
    return "unknown";
  }
}

export async function getLocationErrorMessageKey(
  error: GeolocationPositionError,
): Promise<LocationErrorMessageKey> {
  const permissionState = await getLocationPermissionState();

  if (error.code === error.PERMISSION_DENIED) {
    return permissionState === "denied"
      ? "locationPermissionDenied"
      : "locationPermissionBlocked";
  }

  if (error.code === error.POSITION_UNAVAILABLE) {
    return permissionState === "granted"
      ? "locationServicesDisabled"
      : "locationUnavailable";
  }

  if (error.code === error.TIMEOUT) {
    return "locationTimeout";
  }

  return "unableToGetLocation";
}
