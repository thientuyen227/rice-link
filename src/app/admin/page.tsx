"use client";

import {
  db,
  type Account,
  type ShippingCompany,
  type ShopRecord,
} from "@/data/fakeDb";
import { geocodeAddress } from "@/lib/geocode";
import { Navigation, Plus, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
const ShopsMap = dynamic(() => import("./ShopsMap"), { ssr: false });

type Order = {
  id: string;
  clientName: string;
  phoneNumber?: number;
  item: string;
  quantity: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: number;
  // Thông tin bổ sung
  clientAddress?: string;
  clientCapacity?: number;
  shopName?: string;
  shippingCompany?: string;
  serviceType?: "drying" | "dryingAndStorage"; // Loại dịch vụ
  servicePrice?: number; // Giá dịch vụ
  // Thông tin mới
  moistureType?: "unconfirmed" | "estimated" | "actual"; // Loại độ ẩm
  moistureValue?: string; // Giá trị độ ẩm
  deliveryDate?: string; // Ngày giao lúa
  deliveryTime?: string; // Giờ giao lúa
  paymentMethod?: string; // Phương thức thanh toán
  pricePerKm?: number; // Giá tiền theo km
  paymentStatus?: "paid" | "unpaid"; // Trạng thái thanh toán
};

const ORDERS_KEY = "orders";

function loadOrders(): Order[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ORDERS_KEY);
    return raw ? (JSON.parse(raw) as Order[]) : [];
  } catch {
    return [];
  }
}

function saveOrders(orders: Order[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

function getStatusConfig(status: Order["status"]) {
  const configs = {
    pending: {
      bg: "bg-yellow-500/20",
      text: "text-yellow-400",
      border: "border-yellow-500",
      label: "Chờ xử lý",
    },
    confirmed: {
      bg: "bg-blue-500/20",
      text: "text-blue-400",
      border: "border-blue-500",
      label: "Đã xác nhận",
    },
    completed: {
      bg: "bg-green-500/20",
      text: "text-green-400",
      border: "border-green-500",
      label: "Hoàn thành",
    },
    cancelled: {
      bg: "bg-red-500/20",
      text: "text-red-400",
      border: "border-red-500",
      label: "Đã hủy",
    },
  } as const;
  return configs[status];
}

export default function AdminPage() {
  const [tab, setTab] = useState<
    "shops" | "farmers" | "orders" | "map" | "shipping" | "payment"
  >("shops");

  // Shops
  const [shops, setShops] = useState<ShopRecord[]>([]);
  const [newShop, setNewShop] = useState({
    name: "",
    address: "",
    district: "",
    capacity: 0,
    dryingPrice: 0,
    dryingAndStoragePrice: 0,
  });

  // Shipping Companies
  const [shippingCompanies, setShippingCompanies] = useState<ShippingCompany[]>(
    []
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const [newShippingCompany, setNewShippingCompany] = useState({
    name: "",
    address: "",
    imageUrl: "",
    pricePerKm: 0,
  });

  // Farmers (accounts with role farmer)
  const [accounts, setAccounts] = useState<Account[]>([]);
  const farmers = useMemo(
    () => accounts.filter((a) => a.role === "farmer"),
    [accounts]
  );
  const [newFarmer, setNewFarmer] = useState({ name: "", email: "" });

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    // Only run on client side to avoid hydration mismatch
    if (typeof window !== "undefined") {
      setShops(db.listShops());
      setAccounts(db.listAccounts());
      setOrders(loadOrders());
      setShippingCompanies(db.listShippingCompanies());
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    saveOrders(orders);
  }, [orders]);

  // Shipping Company functions
  function removeShippingCompany(id: string) {
    db.deleteShippingCompany(id);
    setShippingCompanies(db.listShippingCompanies());
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900">
      {/* Header */}
      <header className="bg-gray-800 shadow-2xl border-b-4 border-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-lg">
                <Image
                  src="/Logo RiceLink.png"
                  alt="RiceLink Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  RiceLink - Quản Trị
                </h1>
                <p className="text-sm text-gray-400">Trang quản trị hệ thống</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-green-900 px-4 py-2 rounded-full">
              <Navigation className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-green-300">Đồng Tháp, Việt Nam</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex space-x-2 bg-gray-800 rounded-xl p-2 shadow-xl overflow-x-auto">
          {(
            [
              { k: "orders", label: "Quản lý đơn hàng" },
              { k: "shops", label: "Quản lý lò sấy" },
              { k: "map", label: "Bản đồ lò sấy" },
              { k: "farmers", label: "Quản lý khách hàng" },
              { k: "shipping", label: "Quản lý vận chuyển" },
              { k: "payment", label: "Quản lý thanh toán" },
            ] as const
          ).map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                tab === t.k
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-8">

      {tab === "shops" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newShop.name.trim() || !newShop.address.trim()) return;
                const cap = Number(newShop.capacity) || 0;
                // geocode address → coordinates
                let lat = 0;
                let lon = 0;
                try {
                  const pt = await geocodeAddress(newShop.address.trim());
                  if (pt) {
                    lat = pt.lat;
                    lon = pt.lon;
                  }
                } catch (err) {
                  // fallback to 0,0 if geocode fails
                  console.warn("Geocode failed:", err);
                }
                const created = db.createShop({
                  name: newShop.name.trim(),
                  address: newShop.address.trim(),
                  district: newShop.district.trim(),
                  coordinates: [lat, lon],
                  rating: 0,
                  limitCapacity: cap > 0 ? cap : 0,
                  dryingPrice: Number(newShop.dryingPrice) || 0,
                  dryingAndStoragePrice:
                    Number(newShop.dryingAndStoragePrice) || 0,
                });
                setShops([created, ...shops]);
                setNewShop({
                  name: "",
                  address: "",
                  district: "",
                  capacity: 0,
                  dryingPrice: 0,
                  dryingAndStoragePrice: 0,
                });
              }}
              className="bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-700 h-fit"
            >
              <h2 className="text-xl font-bold text-gray-100 mb-6">
                Thêm lò sấy
              </h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Tên lò
                  </label>
                  <input
                    value={newShop.name}
                    onChange={(e) =>
                      setNewShop({ ...newShop, name: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Địa chỉ
                  </label>
                  <input
                    value={newShop.address}
                    onChange={(e) =>
                      setNewShop({ ...newShop, address: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Huyện/Tỉnh
                  </label>
                  <input
                    value={newShop.district}
                    onChange={(e) =>
                      setNewShop({ ...newShop, district: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Công suất (Tấn/ngày)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newShop.capacity}
                    onChange={(e) =>
                      setNewShop({
                        ...newShop,
                        capacity: Number(e.target.value || 0),
                      })
                    }
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Giá sấy lúa (VND/Tấn)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newShop.dryingPrice}
                    onChange={(e) =>
                      setNewShop({
                        ...newShop,
                        dryingPrice: Number(e.target.value || 0),
                      })
                    }
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Giá sấy và bảo quản lúa (VND/Tấn)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newShop.dryingAndStoragePrice}
                    onChange={(e) =>
                      setNewShop({
                        ...newShop,
                        dryingAndStoragePrice: Number(e.target.value || 0),
                      })
                    }
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold text-sm hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 mt-2"
                >
                  <Plus size={18} /> Thêm lò
                </button>
              </div>
            </form>

            <div className="lg:col-span-2 bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-100">
                      Danh sách lò sấy
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                      {shops.length} lò
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      db.updateShopsWithPricing();
                      setShops(db.listShops());
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl text-sm hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg"
                  >
                    Cập nhật giá
                  </button>
                </div>
              </div>
              <div className="divide-y divide-gray-700">
                {shops.map((s) => (
                  <div
                    key={s.id}
                    className="p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:bg-gray-750 transition-colors"
                  >
                    <div className="md:col-span-6">
                      <p className="font-semibold text-gray-100">{s.name}</p>
                      <p className="text-sm text-gray-400 mt-1">{s.address}</p>
                    </div>
                    <div className="md:col-span-4 text-sm text-gray-400">
                      <div> Công suất: {s.limitCapacity} Tấn</div>
                      <div>
                        Giá sấy: {(s.dryingPrice || 0).toLocaleString("vi-VN")}{" "}
                        VND/Tấn
                      </div>
                      <div>
                        Giá sấy + bảo quản:{" "}
                        {(s.dryingAndStoragePrice || 0).toLocaleString("vi-VN")}{" "}
                        VND/Tấn
                      </div>
                    </div>
                    <div className="md:col-span-2 text-right">
                      <button
                        onClick={() => {
                          db.deleteShop(s.id);
                          setShops((prev) => prev.filter((x) => x.id !== s.id));
                        }}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                        title="Xóa lò"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
      )}

      {tab === "farmers" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newFarmer.name.trim() || !newFarmer.email.trim()) return;
              const created = db.createAccount({
                name: newFarmer.name.trim(),
                email: newFarmer.email.trim(),
                role: "farmer",
                password: "123456",
              });
              setAccounts([created, ...accounts]);
              setNewFarmer({ name: "", email: "" });
            }}
            className="bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-700 h-fit"
          >
            <h2 className="text-xl font-bold text-gray-100 mb-6">
              Thêm khách hàng
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Tên
                </label>
                <input
                  value={newFarmer.name}
                  onChange={(e) =>
                    setNewFarmer({ ...newFarmer, name: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Email
                </label>
                <input
                  value={newFarmer.email}
                  onChange={(e) =>
                    setNewFarmer({ ...newFarmer, email: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold text-sm hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 mt-2"
              >
                <Plus size={18} /> Thêm khách hàng
              </button>
            </div>
          </form>

          <div className="lg:col-span-2 bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-700">
              <h2 className="text-xl font-bold text-gray-100">
                Danh sách khách hàng
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {farmers.length} khách hàng
              </p>
            </div>
            <div className="divide-y divide-gray-700">
              {farmers.map((f) => (
                <div
                  key={f.id}
                  className="p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:bg-gray-750 transition-colors"
                >
                  <div className="md:col-span-8">
                    <p className="font-semibold text-gray-100">{f.name}</p>
                    <p className="text-sm text-gray-400 mt-1">{f.email}</p>
                  </div>
                  <div className="md:col-span-4 text-right">
                    <button
                      onClick={() => {
                        db.deleteAccount(f.id);
                        setAccounts((prev) =>
                          prev.filter((x) => x.id !== f.id)
                        );
                      }}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                      title="Xóa khách hàng"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-100">Tất cả đơn hàng</h2>
              <p className="text-gray-400 mt-1">{orders.length} đơn hàng</p>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="bg-gray-800 rounded-2xl shadow-xl p-12 text-center border border-gray-700">
              <p className="text-gray-300 font-medium">
                Chưa có đơn hàng nào
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Đơn hàng sẽ hiển thị ở đây
              </p>
            </div>
          ) : (
            <div className="space-y-4">
                {orders
                  .slice()
                  .sort((a, b) => b.createdAt - a.createdAt)
                  .map((o) => {
                    const statusConfig = getStatusConfig(o.status);

                    return (
                      <div key={o.id} className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700 hover:border-green-500 transition-all">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <h3 className="text-xl font-bold text-gray-100">{o.clientName}</h3>
                              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
                                Số lượng: x{o.quantity}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              {o.phoneNumber && (
                                <div>
                                  <p className="text-xs text-gray-300 uppercase tracking-wider mb-1">Số điện thoại</p>
                                  <p className="text-white">📞 {o.phoneNumber}</p>
                                </div>
                              )}
                              {o.clientAddress && (
                                <div>
                                  <p className="text-xs text-gray-300 uppercase tracking-wider mb-1">Địa chỉ khách hàng</p>
                                  <p className="text-white flex items-center">
                                    📍 {o.clientAddress}
                                  </p>
                                </div>
                              )}
                              {o.clientCapacity && (
                                <div>
                                  <p className="text-xs text-gray-300 uppercase tracking-wider mb-1">Sản lượng khách hàng</p>
                                  <p className="text-gray-300 font-semibold">{o.clientCapacity} Tấn</p>
                                </div>
                              )}
                              {o.shopName && (
                                <div>
                                  <p className="text-xs text-gray-300 uppercase tracking-wider mb-1">Tên lò sấy</p>
                                  <p className="text-white flex items-center">
                                    🏭 {o.shopName}
                                  </p>
                                </div>
                              )}
                              {o.shippingCompany && (
                                <div>
                                  <p className="text-xs text-gray-300 uppercase tracking-wider mb-1">Đơn vị vận chuyển</p>
                                  <p className="text-white flex items-center text-sm">
                                    🚚 {o.shippingCompany}
                                  </p>
                                </div>
                              )}
                              {o.pricePerKm && (
                                <div>
                                  <p className="text-xs text-gray-300 uppercase tracking-wider mb-1">Giá vận chuyển</p>
                                  <p className="text-yellow-400 font-bold">
                                  💰 {o.pricePerKm.toLocaleString("vi-VN")} VND/Tấn
                                  </p>
                                </div>
                              )}
                              {o.serviceType && (
                                <div>
                                  <p className="text-xs text-gray-300 uppercase tracking-wider mb-1">Loại dịch vụ</p>
                                  <p className="text-white flex items-center">
                                    🌾 {o.serviceType === "drying" ? "Sấy lúa" : "Sấy và bảo quản lúa"}
                                  </p>
                                </div>
                              )}
                              {o.servicePrice && (
                                <div>
                                  <p className="text-xs text-gray-300 uppercase tracking-wider mb-1">Giá dịch vụ</p>
                                  <p className="text-yellow-400 font-bold">💰 {o.servicePrice.toLocaleString("vi-VN")} VNĐ/Tấn</p>
                                </div>
                              )}
                              {o.moistureType && o.moistureType !== "unconfirmed" && o.moistureValue && (
                                <div>
                                  <p className="text-xs text-gray-300 uppercase tracking-wider mb-1">Độ ẩm của lúa</p>
                                  <p className="text-white">
                                    💧 {o.moistureValue}% ({o.moistureType === "estimated" ? "Ước tính" : "Thực tế"})
                                  </p>
                                </div>
                              )}
                              {o.deliveryDate && (
                                <div>
                                  <p className="text-xs text-gray-300 uppercase tracking-wider mb-1">Ngày giao lúa</p>
                                  <p className="text-white">📅 {new Date(o.deliveryDate).toLocaleDateString("vi-VN")}</p>
                                </div>
                              )}
                              {o.deliveryTime && (
                                <div>
                                  <p className="text-xs text-gray-300 uppercase tracking-wider mb-1">Giờ giao lúa</p>
                                  <p className="text-white">🕐 {o.deliveryTime.replace("-", ":00 - ") + ":00"}</p>
                                </div>
                              )}
                              {o.paymentMethod && (
                                <div>
                                  <p className="text-xs text-gray-300 uppercase tracking-wider mb-1">Phương thức thanh toán</p>
                                  <p className="text-white">
                                    💳 {
                                      o.paymentMethod === "cash" ? "Tiền mặt" :
                                      o.paymentMethod === "bank_transfer" ? "Chuyển khoản" :
                                      o.paymentMethod === "momo" ? "MoMo" :
                                      o.paymentMethod === "zalopay" ? "ZaloPay" :
                                      o.paymentMethod === "vnpay" ? "VNPay" : o.paymentMethod
                                    }
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                              <div>
                                {o.servicePrice && o.clientCapacity && (
                                  <>
                                    <p className="text-xs text-gray-300 uppercase tracking-wider mb-1">Tổng giá tiền</p>
                                    <p className="text-2xl font-bold text-green-400">💵 {(o.servicePrice * o.clientCapacity +  o.clientCapacity * (o.pricePerKm ?? 0)).toLocaleString("vi-VN")} VNĐ</p>
                                  </>
                                )}
                              </div>
                              
                              <div className="text-right space-y-1">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              o.paymentStatus === 'paid'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {o.paymentStatus === 'paid' ? '✅ Đã thanh toán' : '⏳ Chưa thanh toán'}
                            </span>
                            <p className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleString("vi-VN")}</p>
                          </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end space-y-3 ml-6">
                            <select
                              value={o.status}
                              disabled
                              className={`px-4 py-2 rounded-lg font-medium text-sm border-2 bg-gray-800 cursor-pointer ${statusConfig.text} ${statusConfig.border}`}
                            >
                              <option value="pending">Chờ xử lý</option>
                              <option value="confirmed">Đã xác nhận</option>
                              <option value="completed">Hoàn thành</option>
                              <option value="cancelled">Đã hủy</option>
                            </select>
                            <button
                              onClick={() => {
                                const confirmed = window.confirm("Bạn có chắc muốn xóa đơn hàng này?");
                                if (confirmed) {
                                  setOrders((prev) => prev.filter((x) => x.id !== o.id));
                                }
                              }}
                              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                              title="Xóa đơn hàng"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
            </div>
          )}
        </div>
      )}
      {tab === "map" && (
        <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-700">
            <h2 className="text-xl font-bold text-gray-100">
              Bản đồ — Tất cả lò sấy
            </h2>
          </div>
          <div className="p-4">
            <ShopsMap />
          </div>
        </div>
      )}

      {tab === "shipping" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (
                !newShippingCompany.name.trim() ||
                !newShippingCompany.address.trim()
              )
                return;
              const created = db.createShippingCompany({
                name: newShippingCompany.name.trim(),
                address: newShippingCompany.address.trim(),
                imageUrl:
                  newShippingCompany.imageUrl.trim() ||
                  "https://via.placeholder.com/100x100?text=Logo",
                pricePerKm: Number(newShippingCompany.pricePerKm) || 0,
              });
              setShippingCompanies([created, ...shippingCompanies]);
              setNewShippingCompany({
                name: "",
                address: "",
                imageUrl: "",
                pricePerKm: 0,
              });
            }}
            className="bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-700 h-fit"
          >
            <h2 className="text-xl font-bold text-gray-100 mb-6">
              Thêm đơn vị vận chuyển
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Tên đơn vị
                </label>
                <input
                  value={newShippingCompany.name}
                  onChange={(e) =>
                    setNewShippingCompany({
                      ...newShippingCompany,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Địa chỉ
                </label>
                <input
                  value={newShippingCompany.address}
                  onChange={(e) =>
                    setNewShippingCompany({
                      ...newShippingCompany,
                      address: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  URL ảnh
                </label>
                <input
                  value={newShippingCompany.imageUrl}
                  onChange={(e) =>
                    setNewShippingCompany({
                      ...newShippingCompany,
                      imageUrl: e.target.value,
                    })
                  }
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Giá theo km (VND)
                </label>
                <input
                  type="number"
                  min={0}
                  value={newShippingCompany.pricePerKm}
                  onChange={(e) =>
                    setNewShippingCompany({
                      ...newShippingCompany,
                      pricePerKm: Number(e.target.value || 0),
                    })
                  }
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold text-sm hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 mt-2"
              >
                <Plus size={18} /> Thêm đơn vị
              </button>
            </div>
          </form>

          <div className="lg:col-span-2 bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-100">
                    Danh sách đơn vị vận chuyển
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    {shippingCompanies?.length || 0} đơn vị
                  </p>
                </div>
                <div className="flex gap-2">
                  {(!shippingCompanies ||
                    shippingCompanies?.length === 0) && (
                    <button
                      onClick={() => {
                        db.seedShippingCompanies();
                        setShippingCompanies(db.listShippingCompanies());
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl text-sm hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg"
                    >
                      Tạo dữ liệu mẫu
                    </button>
                  )}
                  <button
                    onClick={() => {
                      db.resetShippingCompanies();
                      setShippingCompanies(db.listShippingCompanies());
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl text-sm hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg"
                  >
                    Reset dữ liệu
                  </button>
                </div>
              </div>
            </div>

            {!isLoaded ? (
              <div className="p-12 text-center text-gray-400">
                Đang tải...
              </div>
            ) : !shippingCompanies || shippingCompanies.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                Chưa có đơn vị vận chuyển nào.
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {shippingCompanies?.map((company) => (
                  <div
                    key={company.id}
                    className="p-5 hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Image
                        src={company.imageUrl}
                        alt={company.name}
                        width={64}
                        height={64}
                        className="w-16 h-16 rounded-xl object-cover border border-gray-600"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-100 text-base">
                          {company.name}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                          {company.address}
                        </p>
                        <p className="text-sm text-blue-400 font-medium mt-1">
                          {company.pricePerKm.toLocaleString("vi-VN")} VND/Tấn
                        </p>
                      </div>
                      <button
                        onClick={() => removeShippingCompany(company.id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                        title="Xóa đơn vị vận chuyển"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'payment' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-100">Quản lý thanh toán</h2>
              <p className="text-gray-400 mt-1">{orders.length} giao dịch</p>
            </div>
          </div>

          {/* Payment Table */}
          <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700 border-b border-gray-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Khách hàng
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Cơ sở sấy
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Loại dịch vụ
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Số tiền
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Phương thức
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Ngày thanh toán
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {orders.map((order) => {
                    const totalAmount = order.servicePrice && order.clientCapacity
                      ? (order.servicePrice * order.clientCapacity + order.clientCapacity * (order.pricePerKm ?? 0)).toLocaleString("vi-VN") + " VNĐ"
                      : "N/A";

                    const paymentStatus = order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán';

                    const paymentMethodDisplay =
                      order.paymentMethod === 'cash' ? 'Tiền mặt' :
                      order.paymentMethod === 'bank_transfer' ? 'Chuyển khoản' :
                      order.paymentMethod === 'momo' ? 'MoMo' :
                      order.paymentMethod === 'zalopay' ? 'ZaloPay' :
                      order.paymentMethod === 'vnpay' ? 'VNPay' :
                      order.paymentMethod || 'Chưa chọn';

                    return (
                      <tr key={order.id} className="hover:bg-gray-750 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-100">{order.clientName}</div>
                          {order.phoneNumber && (
                            <div className="text-xs text-gray-400">📞 {order.phoneNumber}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-300">{order.shopName || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-300">
                            {order.serviceType === 'drying' ? 'Sấy lúa' :
                             order.serviceType === 'dryingAndStorage' ? 'Sấy và bảo quản' : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-100">{totalAmount}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={order.paymentStatus || 'unpaid'}
                            onChange={(e) => {
                              const updatedOrders = orders.map(o =>
                                o.id === order.id ? { ...o, paymentStatus: e.target.value as "paid" | "unpaid" } : o
                              );
                              saveOrders(updatedOrders);
                              setOrders(updatedOrders);
                            }}
                            className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer border-0 ${
                              paymentStatus === 'Đã thanh toán'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}
                          >
                            <option value="unpaid">⏳ Chưa thanh toán</option>
                            <option value="paid">✅ Đã thanh toán</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium ${
                            paymentMethodDisplay === 'Chuyển khoản'
                              ? 'bg-blue-500/20 text-blue-400'
                              : paymentMethodDisplay === 'Tiền mặt'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-purple-500/20 text-purple-400'
                          }`}>
                            {paymentMethodDisplay === 'Chuyển khoản' && '🏦 '}
                            {paymentMethodDisplay === 'Tiền mặt' && '💵 '}
                            {(paymentMethodDisplay === 'VNPay' || paymentMethodDisplay === 'MoMo' || paymentMethodDisplay === 'ZaloPay') && '💳 '}
                            {paymentMethodDisplay}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-400">
                            {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-gray-800 rounded-xl shadow-xl p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Đã thanh toán</p>
                  <p className="text-2xl font-bold text-green-400">
                    {orders
                      .filter(o => o.paymentStatus === 'paid' && o.servicePrice && o.clientCapacity)
                      .reduce((sum, o) => sum + (o.servicePrice! * o.clientCapacity! + o.clientCapacity! * (o.pricePerKm ??0)), 0)
                      .toLocaleString("vi-VN")} VNĐ
                  </p>
                </div>
                <div className="text-4xl">✅</div>
              </div>
            </div>
            <div className="bg-gray-800 rounded-xl shadow-xl p-6 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Chờ thanh toán</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {orders
                      .filter(o => (o.paymentStatus === 'unpaid') && o.servicePrice && o.clientCapacity)
                      .reduce((sum, o) => sum + (o.servicePrice! * o.clientCapacity! + o.clientCapacity! * (o.pricePerKm ??0)), 0)
                      .toLocaleString("vi-VN")} VNĐ
                  </p>
                </div>
                <div className="text-4xl">⏳</div>
              </div>
            </div>
            
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
