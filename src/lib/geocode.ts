export type GeocodePoint = { lat: number; lon: number };

export async function geocodeAddress(
  text: string
): Promise<GeocodePoint | null> {
  const apiKey = process.env.NEXT_PUBLIC_VIETMAP_API_KEY;
  if (!apiKey || !text.trim()) return null;

  console.log("🔍 Tìm kiếm địa chỉ:", text.trim());

  // Use VietMap API v3 Search
  const searchUrl = new URL("https://maps.vietmap.vn/api/search/v3");
  searchUrl.searchParams.set("apikey", apiKey);
  searchUrl.searchParams.set("text", text.trim());

  const searchRes = await fetch(searchUrl.toString());
  if (!searchRes.ok) throw new Error(`Geocode failed (${searchRes.status})`);
  const data = await searchRes.json();

  console.log("📦 Kết quả search:", data.length, "địa điểm");

  // VietMap API v3 returns array of results directly
  if (!Array.isArray(data) || data.length === 0) {
    console.warn("⚠️ Không tìm thấy kết quả");
    return null;
  }

  const first = data[0];
  console.log("🎯 Địa điểm đầu tiên:", first.display);

  // Try 1: Get from Place Detail API v3
  if (first.ref_id) {
    const detailUrl = new URL("https://maps.vietmap.vn/api/place/v3");
    detailUrl.searchParams.set("apikey", apiKey);
    detailUrl.searchParams.set("refid", first.ref_id);

    console.log("📍 Lấy tọa độ từ Place API...");

    try {
      const detailRes = await fetch(detailUrl.toString());
      if (detailRes.ok) {
        const detailData = await detailRes.json();

        if (detailData.lat && detailData.lng) {
          console.log("✅ Tọa độ từ Place API:", [detailData.lng, detailData.lat]);
          return { lat: detailData.lat, lon: detailData.lng };
        }
      }
    } catch (err) {
      console.warn("⚠️ Place API không hoạt động, thử cách khác...");
    }
  }

  // Try 2: Use Autocomplete API (may have lat/lng)
  const autocompleteUrl = new URL("https://maps.vietmap.vn/api/autocomplete/v3");
  autocompleteUrl.searchParams.set("apikey", apiKey);
  autocompleteUrl.searchParams.set("text", text.trim());

  console.log("📍 Lấy tọa độ từ Autocomplete API...");

  try {
    const autocompleteRes = await fetch(autocompleteUrl.toString());
    if (autocompleteRes.ok) {
      const autocompleteData = await autocompleteRes.json();

      if (Array.isArray(autocompleteData) && autocompleteData.length > 0) {
        const firstResult = autocompleteData[0];

        if (firstResult.lat && firstResult.lng) {
          console.log("✅ Tọa độ từ Autocomplete API:", [firstResult.lng, firstResult.lat]);
          return { lat: firstResult.lat, lon: firstResult.lng };
        }
      }
    }
  } catch (err) {
    console.warn("⚠️ Autocomplete API không hoạt động");
  }

  console.error("❌ Không tìm thấy tọa độ từ cả 2 API");
  return null;
}
