export interface LocationResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: string;
}

interface NominatimResponse {
  display_name: string;
  lat: string;
  lon: string;
  place_id: string;
  [key: string]: unknown; // For other properties we don't use
}

export async function searchLocations(
  query: string
): Promise<LocationResult[]> {
  if (!query.trim() || query.length < 3) {
    return [];
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&limit=5&addressdetails=1`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch locations");
    }

    const data: NominatimResponse[] = await response.json();
    return data.map((item) => ({
      display_name: item.display_name,
      lat: item.lat,
      lon: item.lon,
      place_id: item.place_id,
    }));
  } catch (error) {
    console.error("Error searching locations:", error);
    return [];
  }
}
