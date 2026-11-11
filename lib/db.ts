import "server-only";

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let sql: NeonQueryFunction<false, false> | undefined;
function getSql() {
  return (sql ??= neon(process.env.DATABASE_URL!));
}

let initialization: Promise<void> | undefined;

/** Share initialization across callers and allow retry after a failed connection. */
function initializeDatabase(): Promise<void> {
  if (!initialization) {
    initialization = createTables().catch((error) => {
      initialization = undefined;
      throw error;
    });
  }
  return initialization;
}

interface SavedRoute {
  id: string;
  coordinates: [number, number][];
  distance: number;
  created_at: Date;
}

async function createTables() {
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS routes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      coordinates JSONB NOT NULL,
      distance INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS route_generation_runs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      route_type TEXT NOT NULL,
      payload JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
}

export async function saveRoute(route: {
  coordinates: [number, number][];
  distance: number;
}): Promise<string> {
  await initializeDatabase();
  const sql = getSql();
  const result = await sql`
    INSERT INTO routes (coordinates, distance)
    VALUES (
      ${JSON.stringify(route.coordinates)}::jsonb,
      ${Math.round(route.distance)}
    )
    RETURNING id
  `;
  return result[0].id;
}

export async function getRoute(id: string): Promise<SavedRoute | null> {
  await initializeDatabase();
  const sql = getSql();
  const result = await sql`
    SELECT id, coordinates, distance, created_at
    FROM routes
    WHERE id = ${id}
  `;

  if (result.length === 0) return null;

  return {
    id: result[0].id,
    coordinates: result[0].coordinates,
    distance: result[0].distance,
    created_at: result[0].created_at,
  };
}

export async function saveRouteGenerationRun(params: {
  routeType: string;
  payload: unknown;
}): Promise<string> {
  await initializeDatabase();
  const sql = getSql();
  const result = await sql`
    INSERT INTO route_generation_runs (route_type, payload)
    VALUES (
      ${params.routeType},
      ${JSON.stringify(params.payload)}::jsonb
    )
    RETURNING id
  `;

  return result[0].id;
}
