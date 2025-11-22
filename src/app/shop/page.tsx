"use client";

import { MessageSquare, Package, Search, Trash2, LogOut } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

type Order = {
  id: string;
  clientName: string;
  phoneNumber?: number;
  item: string;
  quantity: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: number;
  clientAddress?: string;
  clientCapacity?: number;
  shopId?: string; // ID của shop - dùng để filter
  shopName?: string; // Tên shop - dùng để hiển thị
  shippingCompany?: string;
  serviceType?: "drying" | "dryingAndStorage";
  servicePrice?: number;
  moistureType?: "unconfirmed" | "estimated" | "actual";
  moistureValue?: string;
  storageDays?: string; // Số ngày bảo quản
  deliveryDate?: string;
  deliveryTime?: string;
  paymentMethod?: string;
  pricePerKm?: number;
  paymentStatus?: "paid" | "unpaid";
};

const STORAGE_KEY = "orders";
const CHAT_STORAGE_KEY = "chat_messages";

type ChatMessage = {
  id: string;
  chatId: number;
  sender: "client" | "shop";
  text: string;
  time: string;
  timestamp: number;
};

function loadOrders(): Order[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Order[]) : [];
  } catch {
    return [];
  }
}

function saveOrders(orders: Order[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  // Dispatch custom event to notify same-tab components
  window.dispatchEvent(new CustomEvent("ordersUpdated", { detail: orders }));
}

function loadChatMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CHAT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

function saveChatMessages(messages: ChatMessage[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
}

export default function ShopPage() {
  const router = useRouter();
  const { currentShop, logout, isAuthenticated } = useAuth();

  const [tab, setTab] = useState<"orders" | "chat" | "timeline">("orders");
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<"all" | Order["status"]>("all");
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/shop/login");
    }
  }, [isAuthenticated, router]);

  // Filter orders for current shop only
  const orders = useMemo(() => {
    if (!currentShop) return [];

    const currentShopId = currentShop.id;
    const currentShopName = currentShop["Tên lò sấy"];

    console.log('🔍 DEBUG: Filtering orders for shop');
    console.log('Current Shop ID:', currentShopId);
    console.log('Current Shop Name:', `"${currentShopName}"`);
    console.log('All Orders:', allOrders.length);

    const filtered = allOrders.filter((order) => {
      // Match by ID (preferred)
      const matchById = order.shopId && order.shopId === currentShopId;

      // Match by Name (fallback for legacy/misconfigured orders)
      const orderShopName = order.shopName || '';
      const matchByName = orderShopName.trim() === currentShopName.trim();

      // Accept if EITHER matches
      const shouldDisplay = matchById || matchByName;

      console.log(`Order ${order.id.substring(0, 8)}:`);
      console.log(`  shopId: "${order.shopId || 'N/A'}"`);
      console.log(`  shopName: "${order.shopName || 'N/A'}"`);
      console.log(`  Match by ID: ${matchById ? '✅' : '❌'}`);
      console.log(`  Match by Name: ${matchByName ? '✅' : '❌'}`);
      console.log(`  → ${shouldDisplay ? 'DISPLAY ✅' : 'HIDE ❌'}`);

      return shouldDisplay;
    });

    console.log('═════════════════════════');
    console.log('✅ Filtered Orders:', filtered.length);
    console.log('═════════════════════════');

    return filtered;
  }, [allOrders, currentShop]);

  // Chat contacts for current shop
  const chatContacts = useMemo(() => {
    const uniqueClients = new Map<string, Order>();
    orders.forEach((order) => {
      if (!uniqueClients.has(order.clientName)) {
        uniqueClients.set(order.clientName, order);
      }
    });

    return Array.from(uniqueClients.values()).map((order, idx) => ({
      id: idx + 1,
      name: order.clientName,
      lastMessage: 'Bắt đầu trò chuyện',
      timestamp: new Date(order.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      unread: 0,
      avatar: '👤',
      phoneNumber: order.phoneNumber
    }));
  }, [orders]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAllOrders(loadOrders());
      setChatMessages(loadChatMessages());
    }
  }, []);

  useEffect(() => {
    saveChatMessages(chatMessages);
  }, [chatMessages]);

  // Poll for new orders and messages every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof window !== "undefined") {
        const newOrders = loadOrders();
        const newMessages = loadChatMessages();
        setAllOrders(newOrders);
        setChatMessages(newMessages);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Listen for storage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const newOrders = JSON.parse(e.newValue) as Order[];
          setAllOrders(newOrders);
        } catch (error) {
          console.error("Failed to parse orders from storage event:", error);
        }
      } else if (e.key === CHAT_STORAGE_KEY && e.newValue) {
        try {
          const newMessages = JSON.parse(e.newValue) as ChatMessage[];
          setChatMessages(newMessages);
        } catch (error) {
          console.error("Failed to parse messages from storage event:", error);
        }
      }
    };

    // Listen for custom event from same tab
    const handleOrdersUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<Order[]>;
      if (customEvent.detail) {
        setAllOrders(customEvent.detail);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("ordersUpdated", handleOrdersUpdated);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("ordersUpdated", handleOrdersUpdated);
    };
  }, []);

  const visible = useMemo(() => {
    const sorted = [...orders].sort((a, b) => b.createdAt - a.createdAt);
    if (filter === "all") return sorted;
    return sorted.filter((o) => o.status === filter);
  }, [orders, filter]);

  function updateStatus(id: string, status: Order["status"]) {
    setAllOrders((prev) => {
      const updated = prev.map((o) => (o.id === id ? { ...o, status } : o));
      saveOrders(updated); // Save explicitly after update
      return updated;
    });
  }

  function removeOrder(id: string) {
    setAllOrders((prev) => {
      const updated = prev.filter((o) => o.id !== id);
      saveOrders(updated); // Save explicitly after delete
      return updated;
    });
  }

  function handleLogout() {
    logout();
    router.push("/shop/login");
  }

  function sendMessage() {
    if (!messageInput.trim() || !selectedChat) return;

    const now = new Date();
    const newMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      chatId: selectedChat,
      sender: "shop",
      text: messageInput.trim(),
      time: now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      timestamp: now.getTime(),
    };

    setChatMessages((prev) => [...prev, newMessage]);
    setMessageInput("");
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
        label: "Đang xử lý",
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

  // Show loading if not authenticated
  if (!isAuthenticated || !currentShop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Đang tải...</p>
        </div>
      </div>
    );
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
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  🏭 {currentShop["Tên lò sấy"]}
                </h1>
                <p className="text-xs sm:text-sm text-gray-400">
                  📍 {currentShop["TP/Huyện"]} | 👤 @{currentShop.username}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-all shadow-lg font-semibold"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex gap-2 sm:gap-3 mb-6 overflow-x-auto">
          <button
            onClick={() => setTab("orders")}
            className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold transition-all whitespace-nowrap text-sm sm:text-base ${
              tab === "orders"
                ? "bg-green-600 text-white shadow-lg"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            📦 Quản lý đơn hàng
          </button>
          <button
            onClick={() => setTab("timeline")}
            className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold transition-all whitespace-nowrap text-sm sm:text-base ${
              tab === "timeline"
                ? "bg-green-600 text-white shadow-lg"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            🕐 Trạng thái cơ sở
          </button>
          <button
            onClick={() => setTab("chat")}
            className={`flex items-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
              tab === "chat"
                ? "bg-green-600 text-white shadow-lg"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Trò chuyện</span>
          </button>
        </div>
      </div>

      {/* Filter Section */}
      {tab === "orders" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-800 rounded-xl p-4 shadow-xl border border-gray-700">
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-gray-300">
                Lọc trạng thái
              </label>
              <select
                value={filter}
                onChange={(e) =>
                  setFilter(e.target.value as "all" | Order["status"])
                }
                className="px-4 py-2.5 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              >
                <option value="all">Tất cả</option>
                <option value="pending">Chờ xử lý</option>
                <option value="confirmed">Đang xử lý</option>
                <option value="completed">Hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
              </select>
              <div className="ml-auto">
                <span className="text-gray-400 text-sm">{visible.length} đơn phù hợp</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-8">
        {/* Orders Tab */}
        {tab === "orders" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-100">
                  📦 Danh sách đơn hàng
                </h2>
                <p className="text-gray-400 mt-1">
                  Tổng cộng: {orders.length} đơn
                </p>
              </div>
            </div>

          {visible.length === 0 ? (
            <div className="bg-gray-800 rounded-2xl shadow-xl p-12 text-center border border-gray-700">
              <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-300 font-medium">
                Không có đơn nào
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Chưa có đơn hàng nào cho cơ sở sấy của bạn
              </p>
            </div>
          ) : (
            <>
              {visible.map((o) => {
                const cfg = getStatusConfig(o.status);
                return (
                  <div key={o.id} className="bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-700 hover:border-green-500 transition-all">
                    <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-4">
                      <div className="flex-1 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-100">{o.clientName}</h3>
                          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs sm:text-sm font-medium w-fit">
                            Số lượng: x{o.quantity}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                          {o.phoneNumber && (
                            <div>
                              <p className="text-xs text-gray-300 uppercase tracking-wider mb-1">Số điện thoại</p>
                              <p className="text-gray-300">📞 {o.phoneNumber}</p>
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
                          {o.shippingCompany && (
                            <div>
                              <p className="text-xs text-gray-300 uppercase tracking-wider mb-1">Đơn vị vận chuyển</p>
                              <p className="text-white">🚚 {o.shippingCompany}</p>
                            </div>
                          )}
                          {o.pricePerKm && o.pricePerKm > 0 && (
                            <div>
                              <p className="text-xs text-gray-300 uppercase tracking-wider mb-1">Giá vận chuyển</p>
                              <p className="text-yellow-400 font-bold">🚚 {o.pricePerKm.toLocaleString("vi-VN")} VNĐ/Tấn</p>
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
                              <p className="text-xs text-gray-300 uppercase tracking-wider mb-1">Giá sấy</p>
                              <p className="text-yellow-400 font-bold">💰 {o.servicePrice.toLocaleString("vi-VN")} VNĐ/Tấn</p>
                            </div>
                          )}
                          {o.storageDays && o.serviceType === "dryingAndStorage" && (
                            <div>
                              <p className="text-xs text-gray-300 uppercase tracking-wider mb-1">Thời gian bảo quản</p>
                              <p className="text-white">📦 {o.storageDays} ngày</p>
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
                            <div>
                              <p className="text-xs text-gray-300 uppercase tracking-wider mb-1">Phương thức thanh toán</p>
                              <p className="text-white">💳 {
                                o.paymentMethod === "momo" ? "Momo" :
                                o.paymentMethod === "vnpay" ? "VnPay" :
                                o.paymentMethod === "zalopay" ? "ZaloPay" :
                                o.paymentMethod === "viettel_money" ? "Viettel Money" :
                                o.paymentMethod === "bank" ? "Ngân hàng" :
                                o.paymentMethod === "visa" ? "Thẻ Visa" :
                                o.paymentMethod === "master" ? "Thẻ Master" :
                                o.paymentMethod === "icb" ? "ICB" : o.paymentMethod
                              }</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-gray-700 gap-3">
                          <div>
                            {o.servicePrice && o.clientCapacity && (
                              <>
                                <p className="text-xs text-gray-300 uppercase tracking-wider mb-1">Tổng giá tiền</p>
                                <p className="text-xl sm:text-2xl font-bold text-green-400">💵 {(o.servicePrice * o.clientCapacity +  o.clientCapacity * (o.pricePerKm ?? 0)).toLocaleString("vi-VN")} VNĐ</p>
                              </>
                            )}
                          </div>
                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-1">
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

                      <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-3 w-full sm:w-auto sm:ml-6">
                        <select
                          value={o.status}
                          onChange={(e) => updateStatus(o.id, e.target.value as Order["status"])}
                          className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm border-2 bg-transparent cursor-pointer ${cfg.text} ${cfg.border}`}
                        >
                          <option value="pending">Chờ xử lý</option>
                          <option value="confirmed">Đang xử lý</option>
                          <option value="completed">Hoàn thành</option>
                          <option value="cancelled">Đã hủy</option>
                        </select>
                        <button
                          onClick={() => removeOrder(o.id)}
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
            </>
          )}
          </div>
        )}

        {/* Chat Tab */}
        {tab === "chat" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
            {/* Chat List */}
            <div className="lg:col-span-1 bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-gray-100 mb-3">Khách hàng</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm khách hàng..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="overflow-y-auto flex-1">
                {chatContacts.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Chưa có khách hàng nào</p>
                  </div>
                ) : (
                  chatContacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => setSelectedChat(contact.id)}
                      className={`p-4 border-b border-gray-700 cursor-pointer transition-all ${
                        selectedChat === contact.id ? 'bg-gray-700' : 'hover:bg-gray-750'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="text-3xl">{contact.avatar}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-gray-100 truncate">{contact.name}</h4>
                            <span className="text-xs text-gray-500">{contact.timestamp}</span>
                          </div>
                          <p className="text-sm text-gray-400 truncate mt-1">{contact.lastMessage}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat Window */}
            <div className="lg:col-span-2 bg-gray-800 rounded-2xl shadow-xl border border-gray-700 flex flex-col overflow-hidden">
              {selectedChat ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-700 flex items-center space-x-3">
                    <div className="text-3xl">
                      {chatContacts.find(c => c.id === selectedChat)?.avatar}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-100">
                        {chatContacts.find(c => c.id === selectedChat)?.name}
                      </h3>
                      <p className="text-sm text-gray-400">Đang hoạt động</p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatMessages
                      .filter((m) => m.chatId === selectedChat)
                      .sort((a, b) => a.timestamp - b.timestamp)
                      .map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender === "shop" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                              message.sender === "shop"
                                ? "bg-green-600 text-white"
                                : "bg-gray-700 text-gray-100"
                            }`}
                          >
                            <p className="text-sm">{message.text}</p>
                            <p className="text-xs mt-1 opacity-70">{message.time}</p>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-700">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        sendMessage();
                      }}
                      className="flex space-x-2"
                    >
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Nhập tin nhắn..."
                        className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <button
                        type="submit"
                        onClick={sendMessage}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold"
                      >
                        Gửi
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Chọn một khách hàng để bắt đầu trò chuyện</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timeline Tab - Same as before but filtered by currentShop */}
        {tab === "timeline" && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-100 mb-2">
                    🕐 Trạng thái cơ sở - {currentShop["Tên lò sấy"]}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Lịch giao lúa của khách hàng đến cơ sở sấy bạn
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-semibold text-gray-300">
                    Chọn ngày:
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-4 py-2.5 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-6">
              <h3 className="text-xl font-bold text-gray-100 mb-6">
                📅 Lịch giao lúa - {new Date(selectedDate).toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {(() => {
                  const timeSlots = [];
                  const processedSlots = new Set<string>();

                  const deliveryRanges = orders
                    .filter((order) => {
                      if (!order.deliveryDate || !order.deliveryTime) return false;
                      const orderDate = new Date(order.deliveryDate).toISOString().split("T")[0];
                      return orderDate === selectedDate;
                    })
                    .map((order) => {
                      const [start, end] = order.deliveryTime!.split("-");
                      return {
                        start: parseInt(start),
                        end: parseInt(end),
                        orders: orders.filter((o) => o.deliveryTime === order.deliveryTime && o.deliveryDate === order.deliveryDate)
                      };
                    });

                  const uniqueRanges = deliveryRanges.reduce((acc, range) => {
                    const key = `${range.start}-${range.end}`;
                    if (!acc.find(r => `${r.start}-${r.end}` === key)) {
                      acc.push(range);
                    }
                    return acc;
                  }, [] as typeof deliveryRanges);

                  for (let hour = 5; hour <= 23; hour++) {
                    const slotKey = `${hour}-0`;

                    if (processedSlots.has(slotKey)) {
                      continue;
                    }

                    const startTime = `${hour.toString().padStart(2, "0")}:00`;
                    const endTime = `${(hour + 1).toString().padStart(2, "0")}:00`;

                    const matchingRange = uniqueRanges.find(r => r.start === hour);

                      if (matchingRange) {
                        const blockStartTime = `${matchingRange.start.toString().padStart(2, "0")}:00`;
                        const blockEndTime = `${matchingRange.end.toString().padStart(2, "0")}:00`;
                        const ordersInBlock = matchingRange.orders;

                        for (let h = matchingRange.start; h < matchingRange.end; h++) {
                          processedSlots.add(`${h}-0`);
                        }

                        const spanHours = matchingRange.end - matchingRange.start;

                        timeSlots.push(
                          <div
                            key={`merged-${matchingRange.start}-${matchingRange.end}`}
                            className="bg-red-500/20 border-2 border-red-500 shadow-lg rounded-xl p-4 transition-all hover:bg-red-500/30 group"
                            style={{ gridColumn: `span ${Math.min(spanHours, 6)}` }}
                          >
                            <div className="text-center">
                              <div className="text-lg font-bold text-red-400">
                                {blockStartTime}
                              </div>
                              <div className="text-xs text-red-300 mb-2">
                                {blockEndTime}
                              </div>
                              <div className="mt-2">
                                <span className="inline-block px-3 py-1 bg-red-600 text-white text-sm rounded-full font-semibold">
                                  {ordersInBlock.length} đơn
                                </span>
                              </div>
                              <div className="mt-2 text-xs text-red-200">
                                {blockStartTime} - {blockEndTime}
                              </div>
                            </div>

                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                              <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl border border-gray-700 w-64">
                                <p className="font-bold mb-2">Đơn hàng {blockStartTime} - {blockEndTime}:</p>
                                {ordersInBlock.slice(0, 3).map((order) => (
                                  <div key={order.id} className="mb-1">
                                    • {order.clientName} - {order.clientCapacity} Tấn
                                  </div>
                                ))}
                                {ordersInBlock.length > 3 && (
                                  <p className="text-gray-400 mt-1">và {ordersInBlock.length - 3} đơn khác...</p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      } else {
                        timeSlots.push(
                          <div
                            key={slotKey}
                            className="bg-gray-700 border-2 border-gray-600 hover:border-gray-500 rounded-xl p-4 transition-all"
                          >
                            <div className="text-center">
                              <div className="text-lg font-bold text-gray-300">
                                {startTime}
                              </div>
                              <div className="text-xs text-gray-500">
                                {endTime}
                              </div>
                            </div>
                          </div>
                        );
                      }
                  }

                  return timeSlots;
                })()}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-4 pt-6 border-t border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-700 border-2 border-gray-600 rounded"></div>
                  <span className="text-sm text-gray-400">Khung giờ trống</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500/20 border-2 border-red-500 rounded"></div>
                  <span className="text-sm text-gray-400">Đã có đơn hàng</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-700">
                <h4 className="text-lg font-bold text-gray-100 mb-4">
                  📋 Đơn hàng trong ngày ({
                    orders.filter((order) => {
                      if (!order.deliveryDate) return false;
                      const orderDate = new Date(order.deliveryDate).toISOString().split("T")[0];
                      return orderDate === selectedDate;
                    }).length
                  } đơn)
                </h4>

                {orders.filter((order) => {
                  if (!order.deliveryDate) return false;
                  const orderDate = new Date(order.deliveryDate).toISOString().split("T")[0];
                  return orderDate === selectedDate;
                }).length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">Không có đơn hàng nào trong ngày này</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders
                      .filter((order) => {
                        if (!order.deliveryDate) return false;
                        const orderDate = new Date(order.deliveryDate).toISOString().split("T")[0];
                        return orderDate === selectedDate;
                      })
                      .sort((a, b) => {
                        const aTime = a.deliveryTime?.split("-")[0] || "00";
                        const bTime = b.deliveryTime?.split("-")[0] || "00";
                        return parseInt(aTime) - parseInt(bTime);
                      })
                      .map((order) => (
                        <div
                          key={order.id}
                          className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-green-500 transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-lg font-bold text-gray-100">
                                  {order.clientName}
                                </span>
                                {order.deliveryTime && (
                                  <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-semibold">
                                    🕐 {order.deliveryTime.replace("-", ":00 - ")}:00
                                  </span>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                {order.clientCapacity && (
                                  <div className="text-gray-400">
                                    📦 <span className="text-gray-300">{order.clientCapacity} Tấn</span>
                                  </div>
                                )}
                                {order.serviceType && (
                                  <div className="text-gray-400">
                                    🌾 <span className="text-gray-300">
                                      {order.serviceType === "drying" ? "Sấy lúa" : "Sấy + Bảo quản"}
                                    </span>
                                  </div>
                                )}
                                {order.phoneNumber && (
                                  <div className="text-gray-400">
                                    📞 <span className="text-gray-300">{order.phoneNumber}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                getStatusConfig(order.status).bg
                              } ${getStatusConfig(order.status).text}`}>
                                {getStatusConfig(order.status).label}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

