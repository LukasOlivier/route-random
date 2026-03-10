import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export interface SavedRoute {
  id: string;
  coordinates: [number, number][];
  distance: number;
  created_at: Date;
}

export async function initializeDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS routes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      coordinates JSONB NOT NULL,
      distance INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
}

export async function saveRoute(route: {
  coordinates: [number, number][];
  distance: number;
}): Promise<string> {
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
