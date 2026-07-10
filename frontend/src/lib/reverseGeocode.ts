// Free reverse-geocoding via OpenStreetMap's Nominatim service - same OSM
// family already used for the map tiles, no API key required. Nominatim's
// usage policy asks for a reasonable identifying referer, which the browser
// sends automatically, so no extra headers are needed for light client-side use.
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.display_name ?? null;
  } catch (err) {
    console.error("Reverse geocoding failed:", err);
    return null;
  }
}