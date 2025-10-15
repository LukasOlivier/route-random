import { Pace } from "../../stores/store";

/**
 * Get the speed in km/h for a given pace
 */
export function getPaceSpeed(pace: Pace): number {
  switch (pace) {
    case Pace.WALKING:
      return 5; // km/h
    case Pace.RUNNING:
      return 10; // km/h
    case Pace.CYCLING:
      return 15; // km/h
    default:
      return 5;
  }
}

/**
 * Calculate estimated distance from time (in minutes) and pace
 */
export function calculateDistanceFromTime(
  timeMinutes: number,
  pace: Pace
): number {
  const speedKmh = getPaceSpeed(pace);
  const timeHours = timeMinutes / 60;
  return speedKmh * timeHours;
}

/**
 * Calculate estimated time from distance (in km) and pace
 */
export function calculateTimeFromDistance(
  distanceKm: number,
  pace: Pace
): number {
  const speedKmh = getPaceSpeed(pace);
  const timeHours = distanceKm / speedKmh;
  return timeHours * 60; // Convert to minutes
}
