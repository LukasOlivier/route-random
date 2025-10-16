/**
 * Check if two line segments intersect
 */
function doLinesIntersect(
  p1: [number, number],
  q1: [number, number],
  p2: [number, number],
  q2: [number, number]
): boolean {
  // Find the four orientations needed for general and special cases
  const o1 = orientation(p1, q1, p2);
  const o2 = orientation(p1, q1, q2);
  const o3 = orientation(p2, q2, p1);
  const o4 = orientation(p2, q2, q1);

  // General case
  if (o1 !== o2 && o3 !== o4) return true;

  // Special cases - points are collinear and segments overlap
  if (o1 === 0 && onSegment(p1, p2, q1)) return true;
  if (o2 === 0 && onSegment(p1, q2, q1)) return true;
  if (o3 === 0 && onSegment(p2, p1, q2)) return true;
  if (o4 === 0 && onSegment(p2, q1, q2)) return true;

  return false;
}

/**
 * Find orientation of ordered triplet (p, q, r)
 * Returns 0 if collinear, 1 if clockwise, 2 if counterclockwise
 */
function orientation(
  p: [number, number],
  q: [number, number],
  r: [number, number]
): number {
  const val = (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1]);
  if (val === 0) return 0; // collinear
  return val > 0 ? 1 : 2; // clockwise or counterclockwise
}

/**
 * Check if point q lies on line segment pr
 */
function onSegment(
  p: [number, number],
  q: [number, number],
  r: [number, number]
): boolean {
  return (
    q[0] <= Math.max(p[0], r[0]) &&
    q[0] >= Math.min(p[0], r[0]) &&
    q[1] <= Math.max(p[1], r[1]) &&
    q[1] >= Math.min(p[1], r[1])
  );
}

/**
 * Find overlapping segments in a route
 */
export function findOverlappingSegments(
  coordinates: [number, number][]
): number[][] {
  const overlappingSegments: number[][] = [];

  for (let i = 0; i < coordinates.length - 1; i++) {
    for (let j = i + 2; j < coordinates.length - 1; j++) {
      // Skip adjacent segments and segments too close to start/end
      if (Math.abs(i - j) < 2) continue;

      const segment1Start = [coordinates[i][1], coordinates[i][0]] as [
        number,
        number
      ];
      const segment1End = [coordinates[i + 1][1], coordinates[i + 1][0]] as [
        number,
        number
      ];
      const segment2Start = [coordinates[j][1], coordinates[j][0]] as [
        number,
        number
      ];
      const segment2End = [coordinates[j + 1][1], coordinates[j + 1][0]] as [
        number,
        number
      ];

      if (
        doLinesIntersect(segment1Start, segment1End, segment2Start, segment2End)
      ) {
        // Store both overlapping segment indices
        if (
          !overlappingSegments.some((seg) => seg[0] === i && seg[1] === i + 1)
        ) {
          overlappingSegments.push([i, i + 1]);
        }
        if (
          !overlappingSegments.some((seg) => seg[0] === j && seg[1] === j + 1)
        ) {
          overlappingSegments.push([j, j + 1]);
        }
      }
    }
  }

  return overlappingSegments;
}

/**
 * Get segments for rendering with overlap information
 */
export function getRouteSegmentsWithOverlaps(coordinates: [number, number][]): {
  normalSegments: [number, number][][];
  overlappingSegments: [number, number][][];
} {
  const overlappingIndices = findOverlappingSegments(coordinates);
  const overlappingSet = new Set(
    overlappingIndices.map((seg) => `${seg[0]}-${seg[1]}`)
  );

  const normalSegments: [number, number][][] = [];
  const overlappingSegments: [number, number][][] = [];

  for (let i = 0; i < coordinates.length - 1; i++) {
    const segmentKey = `${i}-${i + 1}`;
    const segment = [
      [coordinates[i][1], coordinates[i][0]] as [number, number],
      [coordinates[i + 1][1], coordinates[i + 1][0]] as [number, number],
    ];

    if (overlappingSet.has(segmentKey)) {
      overlappingSegments.push(segment);
    } else {
      normalSegments.push(segment);
    }
  }

  return { normalSegments, overlappingSegments };
}
