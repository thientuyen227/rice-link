"use client";

import { db } from "@/data/fakeDb";
import vietmapgl from "@vietmap/vietmap-gl-js/dist/vietmap-gl";
import { useCallback, useEffect, useRef, useState } from "react";

// Decode Google Polyline 5 to [lng, lat] coordinates
function decodePolyline5(encoded: string): [number, number][] {
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;
  const coordinates: [number, number][] = [];

  while (index < len) {
    let result = 0;
    let shift = 0;
    let b: number;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    result = 0;
    shift = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    const latitude = lat / 1e5;
    const longitude = lng / 1e5;
    coordinates.push([longitude, latitude]);
  }

  return coordinates;
}

type BookingProps = {
  initialAddressText?: string;
  initialCapacity?: number;
  onSelectShop?: (
    shopId: string,
    shopName: string,
    address: string,
    capacity: number,
    shopData?: { dryingPrice: number }
  ) => void;
};

export default function MapClient(props: BookingProps = {}) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<vietmapgl.Map | null>(null);
  const userMarkerRef = useRef<vietmapgl.Marker | null>(null);
  const shopMarkersRef = useRef<vietmapgl.Marker[]>([]);
  const apiKey = process.env.NEXT_PUBLIC_VIETMAP_API_KEY;
  const [isRoutingAll, setIsRoutingAll] = useState(false);
  const [addressText, setAddressText] = useState(
    props.initialAddressText ?? ""
  );
  const [customerCapacity, setCustomerCapacity] = useState<string>(
    props.initialCapacity != null ? String(props.initialCapacity) : ""
  );
  const [eligibleList, setEligibleList] = useState<
    {
      id?: string; // Shop ID for filtering
      name: string;
      distance: number;
      rating: number;
      capacity: number;
      dryingPrice: number;
    }[]
  >([]);

  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    shop: {
      id?: string; // Add ID field
      name: string;
      distance: number;
      capacity: number;
      dryingPrice: number;
    };
  } | null>(null);

  const ROUTES_SOURCE_ID = "routes-source";
  const ROUTES_LAYER_ID = "routes-layer";
  const ROUTES_LAYER_SHORTEST_ID = "routes-layer-shortest";
  const ROUTES_LAYER_ALL_ID = "routes-layer-all";

  // Get shops from fakeDb instead of static data
  const [shops, setShops] = useState<
    {
      STT: number;
      id?: string; // Add ID field
      "Tên lò sấy": string;
      "TP/Huyện": string;
      "Địa điểm": string;
      "Tọa độ": number[];
      Rating: number;
      LimitCapacity: number;
      "Giá sấy lúa": number;
    }[]
  >([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const dbShops = db.listShops();
      const result = dbShops.map((shop) => ({
        STT: 0, // Not used in this context
        id: shop.id, // Include shop ID
        "Tên lò sấy": shop.name,
        "TP/Huyện": shop.district,
        "Địa điểm": shop.address,
        "Tọa độ": shop.coordinates,
        Rating:
          shop.rating || parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)), // 3.5–5.0
        LimitCapacity:
          shop.limitCapacity || Math.floor(Math.random() * 1500) + 500, // 500–2000
        "Giá sấy lúa": shop.dryingPrice || 0,
      }));
      setShops(result);
    }
  }, []);

  // Listen for shop updates
  useEffect(() => {
    const onShopsUpdated = () => {
      if (typeof window !== "undefined") {
        const dbShops = db.listShops();
        const result = dbShops.map((shop) => ({
          STT: 0,
          id: shop.id, // Include shop ID
          "Tên lò sấy": shop.name,
          "TP/Huyện": shop.district,
          "Địa điểm": shop.address,
          "Tọa độ": shop.coordinates,
          Rating:
            shop.rating || parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)),
          LimitCapacity:
            shop.limitCapacity || Math.floor(Math.random() * 1500) + 500,
          "Giá sấy lúa": shop.dryingPrice || 0,
        }));
        setShops(result);
      }
    };

    window.addEventListener("demo:shops-updated", onShopsUpdated);
    return () =>
      window.removeEventListener("demo:shops-updated", onShopsUpdated);
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    // Prevent creating multiple map instances (React Strict Mode runs effect twice)
    if (mapRef.current) return;

    const mapInstance = new vietmapgl.Map({
      container: mapContainerRef.current,
      style: `https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=${apiKey}`,
      center: [105.89716068989348, 10.377142643969268], // Vietnam centered
      zoom: 12,
    });

    mapInstance.addControl(new vietmapgl.NavigationControl(), "top-right");
    mapRef.current = mapInstance;

    return () => {
      // Clean up shop markers safely
      try {
        shopMarkersRef.current.forEach((marker) => {
          if (marker) marker.remove();
        });
        shopMarkersRef.current = [];
      } catch (err) {
        console.warn("Error removing markers:", err);
      }

      // Remove map instance safely
      try {
        if (mapInstance) {
          // Check if map is still valid before removing
          const container = mapInstance.getContainer?.();
          if (container && container.parentNode) {
            mapInstance.remove();
          }
        }
      } catch {
        // Silently ignore any errors during cleanup
        // This is expected when component unmounts during map operations
      }

      mapRef.current = null;
    };
  }, [apiKey]);

  // Separate effect to render markers when shops change
  useEffect(() => {
    if (!mapRef.current) return;

    const mapInstance = mapRef.current;
    let isCleanedUp = false;

    function renderShopMarkers(map: vietmapgl.Map) {
      if (isCleanedUp) return; // Don't render if component is unmounting

      // Clear existing shop markers safely
      try {
        shopMarkersRef.current.forEach((marker) => {
          if (marker) marker.remove();
        });
        shopMarkersRef.current = [];
      } catch (err) {
        console.warn("Error removing old markers:", err);
      }

      if (shops.length === 0) return;

      // Add markers and popups for all shops from data
      const bounds = new vietmapgl.LngLatBounds();
      shops.forEach((shop) => {
        const [lat, lng] = shop["Tọa độ"]; // data is [lat, lng]
        const position: [number, number] = [lng, lat];

        const popupHtml =
          "<div>" +
          `<h4 style="margin:0;font-size:16px;font-weight:600;color:#111827">${shop["Tên lò sấy"]}</h4>` +
          `<div style="font-size:12px;color:#374151;margin-top:4px">${shop["Địa điểm"]}</div>` +
          "</div>";

        const popup = new vietmapgl.Popup({ closeOnClick: false }).setHTML(
          popupHtml
        );

        const marker = new vietmapgl.Marker()
          .setLngLat(position)
          .setPopup(popup)
          .addTo(map);

        shopMarkersRef.current.push(marker);
        bounds.extend(position);
      });

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 40 });
      }
    }

    // Wait for map to be fully loaded before adding markers
    if (!mapInstance.isStyleLoaded()) {
      const onStyleLoad = () => {
        renderShopMarkers(mapInstance);
      };
      mapInstance.on("style.load", onStyleLoad);

      return () => {
        isCleanedUp = true;
        mapInstance.off("style.load", onStyleLoad);
      };
    } else {
      renderShopMarkers(mapInstance);
    }
  }, [shops]);

  const geocodeAddress = useCallback(
    async (text: string): Promise<{ lat: number; lon: number } | null> => {
      if (!apiKey || !text.trim()) return null;

      console.log("🔍 Tìm kiếm địa chỉ:", text.trim());

      // Use VietMap API v3 Search
      const searchUrl = new URL("https://maps.vietmap.vn/api/search/v3");
      searchUrl.searchParams.set("apikey", apiKey);
      searchUrl.searchParams.set("text", text.trim());

      const searchRes = await fetch(searchUrl.toString());
      if (!searchRes.ok) {
        console.error("❌ API error:", searchRes.status);
        throw new Error(`Geocode failed (${searchRes.status})`);
      }

      const data = await searchRes.json();
      console.log("📦 API v3 response:", data);
      console.log("📊 Số kết quả:", Array.isArray(data) ? data.length : 0);

      // VietMap API v3 returns array of results directly
      if (!Array.isArray(data) || data.length === 0) {
        console.warn("⚠️ Không tìm thấy kết quả");
        return null;
      }

      const first = data[0];
      console.log("🎯 Kết quả đầu tiên:", {
        name: first.name,
        display: first.display,
        address: first.address,
      });

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
            console.log("📍 Chi tiết địa điểm:", detailData);

            if (detailData.lat && detailData.lng) {
              console.log("✅ Tọa độ:", [detailData.lng, detailData.lat]);
              return { lat: detailData.lat, lon: detailData.lng };
            }
          }
        } catch (err) {
          console.warn("⚠️ Place API không hoạt động, thử cách khác...", err);
        }
      }

      // Try 2: Use Autocomplete API (may have lat/lng)
      const autocompleteUrl = new URL(
        "https://maps.vietmap.vn/api/autocomplete/v3"
      );
      autocompleteUrl.searchParams.set("apikey", apiKey);
      autocompleteUrl.searchParams.set("text", text.trim());

      console.log("📍 Lấy tọa độ từ Autocomplete API...");

      try {
        const autocompleteRes = await fetch(autocompleteUrl.toString());
        if (autocompleteRes.ok) {
          const autocompleteData = await autocompleteRes.json();
          console.log("📦 Autocomplete response:", autocompleteData);

          if (
            Array.isArray(autocompleteData) &&
            autocompleteData.length > 0
          ) {
            const firstResult = autocompleteData[0];

            if (firstResult.lat && firstResult.lng) {
              console.log("✅ Tọa độ từ Autocomplete:", [
                firstResult.lng,
                firstResult.lat,
              ]);
              return { lat: firstResult.lat, lon: firstResult.lng };
            }
          }
        }
      } catch (err) {
        console.warn("⚠️ Autocomplete API không hoạt động", err);
      }

      console.error("❌ Không tìm thấy tọa độ từ cả 2 API");
      return null;
    },
    [apiKey]
  );

  const placeOrMoveUserMarker = useCallback((lngLat: [number, number]) => {
    const map = mapRef.current;
    if (!map) return;
    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat(lngLat);
    } else {
      userMarkerRef.current = new vietmapgl.Marker({ color: "#10B981" })
        .setLngLat(lngLat)
        .addTo(map);
    }
  }, []);

  const clearAllRoutes = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    try {
      if (map.getLayer(ROUTES_LAYER_ALL_ID)) map.removeLayer(ROUTES_LAYER_ALL_ID);
      if (map.getLayer(ROUTES_LAYER_SHORTEST_ID))
        map.removeLayer(ROUTES_LAYER_SHORTEST_ID);
      if (map.getLayer(ROUTES_LAYER_ID)) map.removeLayer(ROUTES_LAYER_ID);
      if (map.getSource(ROUTES_SOURCE_ID)) map.removeSource(ROUTES_SOURCE_ID);
    } catch (err) {
      console.warn("Error clearing routes:", err);
    }
  }, []);

  const requestAndDrawRoutesToAllShops = useCallback(
    async (originLat: number, originLon: number) => {
      if (!apiKey || !mapRef.current || shops.length === 0) return;
      setIsRoutingAll(true);
      try {
        const routePromises = shops.map(async (shop) => {
          const [destLat, destLon] = shop["Tọa độ"]; // [lat, lng]
          const url = new URL("https://maps.vietmap.vn/api/route");
          url.searchParams.set("api-version", "1.1");
          url.searchParams.set("apikey", apiKey);
          url.searchParams.append("point", `${originLat},${originLon}`);
          url.searchParams.append("point", `${destLat},${destLon}`);
          url.searchParams.set("vehicle", "car");
          url.searchParams.set("points_encoded", "true");
          const res = await fetch(url.toString());
          if (!res.ok) throw new Error(`Route API failed (${res.status})`);
          const data = await res.json();
          const path = data?.paths?.[0];
          const distance: number = path?.distance ?? Number.POSITIVE_INFINITY;
          const encoded: string | undefined = path?.points;
          if (!encoded || typeof encoded !== "string") {
            console.warn("Unexpected route points shape", path?.points);
            return { shop, coords: [] as [number, number][], distance };
          }
          const coords = decodePolyline5(encoded);
          return { shop, coords, distance };
        });

        const results = await Promise.all(routePromises);
        const valid = results.filter(
          (r) =>
            Array.isArray(r.coords) &&
            r.coords.length > 0 &&
            isFinite(r.distance)
        );
        if (valid.length === 0) throw new Error("No routes found");

        const shortest = valid.reduce((min, cur) =>
          cur.distance < min.distance ? cur : min
        );

        // Build eligible list filtered by LimitCapacity and sorted by distance then rating
        const cap = Number(customerCapacity);
        type ShopLike = Pick<
          (typeof shops)[number],
          | "id"
          | "Rating"
          | "LimitCapacity"
          | "Tên lò sấy"
          | "Giá sấy lúa"
        >;
        const filteredSorted = valid
          .filter((r) =>
            Number.isFinite(cap) && cap > 0
              ? ((r.shop as ShopLike).LimitCapacity ?? 0) >= cap
              : true
          )
          .sort((a, b) => {
            if (a.distance !== b.distance) return a.distance - b.distance;
            const ra = (a.shop as ShopLike).Rating ?? 0;
            const rb = (b.shop as ShopLike).Rating ?? 0;
            return rb - ra;
          })
          .map((r) => {
            const shopName = (r.shop as ShopLike)["Tên lò sấy"];
            const shopId = (r.shop as ShopLike).id;

            // Debug: Log the entire shop object to see what's in it
            console.log('🔍 DEBUG: Shop object:', r.shop);
            console.log('🏭 Shop from database:', `"${shopName}"`);
            console.log('🆔 Shop ID extracted:', shopId);
            console.log('📦 Shop ID type:', typeof shopId);

            return {
              id: shopId, // Include shop ID
              name: shopName,
              distance: r.distance,
              rating: (r.shop as ShopLike).Rating ?? 0,
              capacity: (r.shop as ShopLike).LimitCapacity ?? 0,
              dryingPrice: (r.shop as ShopLike)["Giá sấy lúa"] ?? 0,
            };
          });
        setEligibleList(filteredSorted);

        // Build FeatureCollection
        type LineFeature = {
          type: "Feature";
          geometry: { type: "LineString"; coordinates: [number, number][] };
          properties: { distance: number; isShortest: boolean; name: string };
        };
        const features: LineFeature[] = valid.map((r) => ({
          type: "Feature",
          geometry: { type: "LineString", coordinates: r.coords },
          properties: {
            distance: r.distance,
            isShortest: r === shortest,
            name: r.shop["Tên lò sấy"],
          },
        }));
        type FeatureCollection = {
          type: "FeatureCollection";
          features: LineFeature[];
        };
        const fc: FeatureCollection = { type: "FeatureCollection", features };

        const map = mapRef.current;
        if (!map) return;

        clearAllRoutes();

        map.addSource(ROUTES_SOURCE_ID, { type: "geojson", data: fc });
        // Draw ALL routes as base layer (thin, gray) so every route is visible
        map.addLayer({
          id: ROUTES_LAYER_ALL_ID,
          type: "line",
          source: ROUTES_SOURCE_ID,
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": "#2563EB",
            "line-width": 3.5,
            "line-opacity": 0.8,
          },
        });
        // Shortest on top (thicker, blue) for emphasis
        map.addLayer({
          id: ROUTES_LAYER_SHORTEST_ID,
          type: "line",
          source: ROUTES_SOURCE_ID,
          filter: ["==", ["get", "isShortest"], true],
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": "#e10a0a",
            "line-width": 6,
            "line-opacity": 0.95,
          },
        });

        // Fit bounds to all routes
        const allCoords = valid.flatMap((r) => r.coords);
        const b = allCoords.reduce(
          (acc, c) => acc.extend(c),
          new vietmapgl.LngLatBounds()
        );
        if (!b.isEmpty()) map.fitBounds(b, { padding: 50 });
      } finally {
        setIsRoutingAll(false);
      }
    },
    [apiKey, clearAllRoutes, customerCapacity, shops]
  );

  const onSubmitAddress = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!apiKey) {
        alert("⚠️ Thiếu API key cho bản đồ");
        return;
      }
      if (!addressText.trim()) {
        alert("⚠️ Vui lòng nhập địa chỉ");
        return;
      }
      try {
        const geo = await geocodeAddress(addressText);
        console.log("Geocode result", geo);
        if (!geo) {
          alert(
            `❌ Không tìm thấy địa chỉ: "${addressText}"\n\n` +
            `💡 Gợi ý:\n` +
            `• Thử nhập địa chỉ chi tiết hơn (ví dụ: "Xã Thanh Mỹ, Huyện Thanh Bình, Đồng Tháp")\n` +
            `• Kiểm tra chính tả\n` +
            `• Thử nhập tên huyện hoặc thành phố`
          );
          return;
        }
        const lngLat: [number, number] = [geo.lon, geo.lat];
        const map = mapRef.current;
        if (!map) return;
        placeOrMoveUserMarker(lngLat);
        map.flyTo({ center: lngLat, zoom: 12 });
        await requestAndDrawRoutesToAllShops(geo.lat, geo.lon);
      } catch (err) {
        console.error(err);
        alert(
          `❌ Lỗi tìm kiếm địa chỉ\n\n` +
          `Chi tiết: ${(err as Error).message || "Không xác định"}\n\n` +
          `💡 Vui lòng thử lại hoặc nhập địa chỉ khác`
        );
      }
    },
    [
      apiKey,
      addressText,
      geocodeAddress,
      placeOrMoveUserMarker,
      requestAndDrawRoutesToAllShops,
    ]
  );

  return (
    <div className="min-h-[100vh] flex flex-col">
      <div className="px-4 py-3 border-b">
        {!apiKey && (
          <p className="text-sm text-red-600">
            Missing NEXT_PUBLIC_VIETMAP_API_KEY. Add it to your env and reload.
          </p>
        )}
        {apiKey && !props.initialAddressText && (
          <div className="mt-2 flex items-center gap-2">
            <form
              onSubmit={onSubmitAddress}
              className="flex items-center gap-2"
            >
              <input
                value={addressText}
                onChange={(e) => setAddressText(e.target.value)}
                placeholder="Nhập Địa Chỉ"
                className="px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm w-[320px]"
              />
              <input
                type="number"
                min={0}
                step="0.01"
                value={customerCapacity}
                onChange={(e) => setCustomerCapacity(e.target.value)}
                placeholder="Công suất (Tấn/ngày)"
                className="px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm w-[190px]"
              />
              <button
                type="submit"
                disabled={isRoutingAll}
                className="px-4 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isRoutingAll ? "Đang tìm cơ sở sấy..." : "Tìm cơ sở sấy"}
              </button>
            </form>
          </div>
        )}
        {apiKey && props.initialAddressText && (
          <div className="mt-2 text-center text-gray-400 text-sm">
            Nhập địa chỉ và sản lượng ở form bên trái để tìm cơ sở sấy phù hợp
          </div>
        )}
      </div>
      <div className="h-[100vh] relative">
        <div ref={mapContainerRef} id="map" className="w-full h-full" />
        <div className="absolute top-26 right-4 w-80 max-h-[80vh] overflow-auto bg-white/95 backdrop-blur-sm border rounded shadow text-sm">
          <div className="px-3 py-2 border-b font-semibold">Cơ sở sấy phù hợp</div>
          {eligibleList.length === 0 ? (
            <div className="px-3 py-2 text-gray-600">
              Nhập địa chỉ và sản lượng, sau đó nhấn Tìm cơ sở sấy.
            </div>
          ) : (
            <ul className="divide-y">
              {eligibleList.map((s, idx) => (
                <li
                  key={idx}
                  className="px-3 py-2 hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    // Validate capacity first
                    if (!customerCapacity || Number(customerCapacity) <= 0) {
                      alert("Vui lòng nhập sản lượng lúa (Tấn) trước khi chọn cơ sở sấy.");
                      return;
                    }

                    setConfirmDialog({ show: true, shop: s });
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="truncate text-black font-medium"
                      title={s.name}
                    >
                      {s.name}
                    </span>
                    <span className="shrink-0 text-gray-700 text-xs">
                      {(s.distance / 1000).toFixed(1)} km · {s.rating}★
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    Công suất: {s.capacity} Tấn · Giá sấy:{" "}
                    {(s.dryingPrice || 0).toLocaleString("vi-VN")} VND/Tấn
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Custom Confirmation Dialog */}
      {confirmDialog?.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Bạn có muốn chọn cơ sở sấy &ldquo;<span className="font-bold">{confirmDialog.shop.name}</span>&rdquo; không?
            </h3>
            <div className="space-y-2 text-sm text-gray-700 mb-6">
              <div>
                <span className="font-medium">Khoảng cách:</span>{" "}
                {(confirmDialog.shop.distance / 1000).toFixed(1)} km
              </div>
              <div>
                <span className="font-medium">Công suất:</span>{" "}
                {confirmDialog.shop.capacity} Tấn
              </div>
              <div>
                <span className="font-medium">Giá sấy:</span>{" "}
                {(confirmDialog.shop.dryingPrice || 0).toLocaleString("vi-VN")} VND/Tấn
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-medium transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  console.log('🗺️ MapClient: Shop selected from dialog');
                  console.log('Shop ID:', confirmDialog.shop.id);
                  console.log('Shop Name:', `"${confirmDialog.shop.name}"`);
                  console.log('Shop Name length:', confirmDialog.shop.name.length);
                  console.log('Shop Name char codes:', Array.from(confirmDialog.shop.name).map(c => c.charCodeAt(0)));

                  props.onSelectShop?.(
                    confirmDialog.shop.id || '', // Pass shop ID as first parameter
                    confirmDialog.shop.name,
                    addressText,
                    Number(customerCapacity),
                    {
                      dryingPrice: confirmDialog.shop.dryingPrice,
                    }
                  );
                  setConfirmDialog(null);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
