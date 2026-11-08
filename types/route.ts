export enum Mode {
  TIME = "time",
  DISTANCE = "distance",
}

export enum Pace {
  WALKING = "walking",
  RUNNING = "running",
  CYCLING = "cycling",
}

export type GeneratedRoute = {
  coordinates: [number, number][];
  distance: number;
  elevationGain?: number;
  waypoints?: [number, number][];
};
