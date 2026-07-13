export const ROUTE_PATTERN_VALUES = ["circle", "rectangle", "all"] as const;

export type RoutePattern = (typeof ROUTE_PATTERN_VALUES)[number];

const CARDINAL_DIRECTIONS = ["N", "E", "S", "W"] as const;

type CardinalDirection = (typeof CARDINAL_DIRECTIONS)[number];

const METERS_PER_DEGREE_LATITUDE = 111_320;
const RECTANGLE_DISTANCE_CORRECTION_FACTOR = 0.68;

function getMetersPerDegreeLongitude(latitude: number): number {
  const radians = (latitude * Math.PI) / 180;
  const metersPerDegree = Math.cos(radians) * METERS_PER_DEGREE_LATITUDE;

  return Math.max(1, Math.abs(metersPerDegree));
}

function moveCardinalCoordinate(
  coordinate: [number, number],
  direction: CardinalDirection,
  distanceMeters: number,
): [number, number] {
  const [longitude, latitude] = coordinate;

  switch (direction) {
    case "N":
      return [
        longitude,
        latitude + distanceMeters / METERS_PER_DEGREE_LATITUDE,
      ];
    case "E":
      return [
        longitude + distanceMeters / getMetersPerDegreeLongitude(latitude),
        latitude,
      ];
    case "S":
      return [
        longitude,
        latitude - distanceMeters / METERS_PER_DEGREE_LATITUDE,
      ];
    case "W":
      return [
        longitude - distanceMeters / getMetersPerDegreeLongitude(latitude),
        latitude,
      ];
  }
}

function turnRight(direction: CardinalDirection): CardinalDirection {
  switch (direction) {
    case "N":
      return "E";
    case "E":
      return "S";
    case "S":
      return "W";
    case "W":
      return "N";
  }
}

function getRandomCardinalDirection(): CardinalDirection {
  return CARDINAL_DIRECTIONS[
    Math.floor(Math.random() * CARDINAL_DIRECTIONS.length)
  ];
}

export function isValidRoutePattern(value: unknown): value is RoutePattern {
  return (
    typeof value === "string" &&
    ROUTE_PATTERN_VALUES.includes(value as RoutePattern)
  );
}

export function buildRectangleWaypoints(
  startLat: number,
  startLng: number,
  targetDistanceMeters: number,
  correctionFactor: number = RECTANGLE_DISTANCE_CORRECTION_FACTOR,
): [number, number][] {
  const correctedDistance =
    Math.max(targetDistanceMeters, 1) * correctionFactor;
  const longSide = correctedDistance / 3;
  const shortSide = correctedDistance / 6;
  const halfLongSide = longSide / 2;
  const startingDirection = getRandomCardinalDirection();
  const startCoordinate: [number, number] = [startLng, startLat];
  const rightDirection = turnRight(startingDirection);
  const oppositeDirection = turnRight(rightDirection);
  const leftDirection = turnRight(oppositeDirection);

  const sideOneMidpoint = moveCardinalCoordinate(
    startCoordinate,
    startingDirection,
    halfLongSide,
  );
  const firstCorner = moveCardinalCoordinate(
    startCoordinate,
    startingDirection,
    longSide,
  );
  const secondCorner = moveCardinalCoordinate(
    firstCorner,
    rightDirection,
    shortSide,
  );
  const sideThreeMidpoint = moveCardinalCoordinate(
    secondCorner,
    oppositeDirection,
    halfLongSide,
  );
  const thirdCorner = moveCardinalCoordinate(
    secondCorner,
    oppositeDirection,
    longSide,
  );

  return [
    startCoordinate,
    sideOneMidpoint,
    firstCorner,
    secondCorner,
    sideThreeMidpoint,
    thirdCorner,
    startCoordinate,
  ];
}
