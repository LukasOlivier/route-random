import { Pace } from "../../stores/store";

const PACE_SPEEDS: Record<Pace, number> = {
  [Pace.WALKING]: 5,
  [Pace.RUNNING]: 10,
  [Pace.CYCLING]: 15,
};

export function calculateDistanceFromTime(
  timeMinutes: number,
  pace: Pace,
): number {
  const speedKmh = PACE_SPEEDS[pace] ?? 5;
  return (speedKmh * timeMinutes) / 60;
}
