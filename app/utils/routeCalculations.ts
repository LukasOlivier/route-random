import { Pace } from "../../stores/store";

export function getPaceSpeed(pace: Pace): number {
  switch (pace) {
    case Pace.WALKING:
      return 5;
    case Pace.RUNNING:
      return 10;
    case Pace.CYCLING:
      return 15;
    default:
      return 5;
  }
}

export function calculateDistanceFromTime(
  timeMinutes: number,
  pace: Pace,
): number {
  const speedKmh = getPaceSpeed(pace);
  const timeHours = timeMinutes / 60;
  return speedKmh * timeHours;
}
