import { Pace } from "../../stores/store";

const PACE_SPEEDS: Record<Pace, number> = {
  [Pace.WALKING]: 5,
  [Pace.RUNNING]: 10,
  [Pace.CYCLING]: 15,
};

const ORS_MAX_ROUTE_LENGTH_METERS = 100000;
const MAX_REQUESTED_ROUND_TRIP_DISTANCE_METERS = Math.floor(
  ORS_MAX_ROUTE_LENGTH_METERS / 0.82,
);

export const MAX_REQUESTED_ROUND_TRIP_DISTANCE_KM =
  MAX_REQUESTED_ROUND_TRIP_DISTANCE_METERS / 1000;

export function calculateDistanceFromTime(
  timeMinutes: number,
  pace: Pace,
): number {
  const speedKmh = PACE_SPEEDS[pace] ?? 5;
  return (speedKmh * timeMinutes) / 60;
}

export function isRequestedRoundTripDistanceTooLong(
  distanceKm: number,
): boolean {
  return distanceKm * 1000 > MAX_REQUESTED_ROUND_TRIP_DISTANCE_METERS;
}
