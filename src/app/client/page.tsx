"use client";


import { db, type ShippingCompany } from "@/data/fakeDb";
import {
  AlertCircle,
  CheckCheck,
  CheckCircle,
  ChevronDown,
  Clock,
  MapPin,
  MessageSquare,
  Navigation,
  Package,
  Search,
  Trash2,
  Truck,
  User,
  LogOut,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Chatbot from "../components/Chatbot";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import CustomerAuthModal from "../components/CustomerAuthModal";
import LandingPage from "../components/LandingPage";

type Order = {
  id: string;
  clientName: string;
  phoneNumber: string;
  item: string;
  quantity: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: number;
  // Thông tin bổ sung
  clientAddress?: string;
  clientCapacity?: number;
  shopId?: string; // ID của shop - dùng để filter
  shopName?: string; // Tên shop - dùng để hiển thị
  shippingCompany?: string;
  serviceType?: "drying" | "dryingAndStorage"; // Loại dịch vụ
  servicePrice?: number; // Giá sấy
  // Thông tin mới
  moistureType?: "unconfirmed" | "estimated" | "actual"; // Loại độ ẩm
  moistureValue?: string; // Giá trị độ ẩm
  storageDays?: string; // Số ngày bảo quản (chỉ cho dịch vụ "Sấy và bảo quản")
  deliveryDate?: string; // Ngày giao lúa
  deliveryTime?: string; // Giờ giao lúa
  paymentMethod?: string; // Phương thức thanh toán
  pricePerKm?: number; // Giá tiền theo km
  paymentStatus?: "paid" | "unpaid"; // Trạng thái thanh toán
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

const MapClient = dynamic(() => import("../map/MapClient"), { ssr: false });

function getStatusConfig(status: Order["status"]) {
  const configs = {
    pending: {
      bg: "bg-yellow-500/20",
      text: "text-yellow-400",
      border: "border-yellow-500",
      icon: Clock,
      label: "Chờ xử lý",
    },
    confirmed: {
      bg: "bg-blue-500/20",
      text: "text-blue-400",
      border: "border-blue-500",
      icon: CheckCircle,
      label: "Đã xác nhận",
    },
    completed: {
      bg: "bg-green-500/20",
      text: "text-green-400",
      border: "border-green-500",
      icon: CheckCheck,
      label: "Hoàn thành",
    },
    cancelled: {
      bg: "bg-red-500/20",
      text: "text-red-400",
      border: "border-red-500",
      icon: AlertCircle,
      label: "Đã hủy",
    },
  };
  return configs[status];
}

export default function ClientPage() {
  const { currentCustomer, isAuthenticated, logout } = useCustomerAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [tab, setTab] = useState<"orders" | "booking" | "chat">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [clientName, setClientName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [hasShippingCompany, setHasShippingCompany] = useState(false);
  const [selectedShippingCompany, setSelectedShippingCompany] =
    useState<string>("");
  const [pricePerKm, setPricePerKm] = useState<number>(0);
  const [shippingCompanies, setShippingCompanies] = useState<ShippingCompany[]>(
    []
  );
  const [serviceType, setServiceType] = useState<"drying" | "dryingAndStorage">(
    "drying"
  );
  const [selectedChat, setSelectedChat] = useState(1);
  const [messageInput, setMessageInput] = useState("");
  const [storageDays, setStorageDays] = useState(""); // Thời gian bảo quản (ngày)
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Mock chat contacts
  const chatContacts = [
    {
      id: 1,
      name: 'Nhà máy sấy lúa SẤU THO',
      lastMessage: 'Chúng tôi đã nhận đơn hàng của bạn',
      timestamp: '09:56',
      unread: 0,
      avatar: '🏭'
    },
    {
      id: 2,
      name: 'HT Vận Tải Thủy Bộ',
      lastMessage: 'Xe sẽ đến lấy hàng vào 8h sáng mai',
      timestamp: '07:15',
      unread: 0,
      avatar: '🚚'
    },
  ];

  useEffect(() => {
    // Only run on client side to avoid hydration mismatch
    if (typeof window !== "undefined") {
      setOrders(loadOrders());
      setShippingCompanies(db.listShippingCompanies());
      setChatMessages(loadChatMessages());
    }
  }, []);

  // Auto-fill customer info when logged in
  useEffect(() => {
    if (currentCustomer && isAuthenticated) {
      setClientName(currentCustomer.name);
      setPhoneNumber(currentCustomer.phoneNumber);
    }
  }, [currentCustomer, isAuthenticated]);

  useEffect(() => {
    saveOrders(orders);
  }, [orders]);

  useEffect(() => {
    saveChatMessages(chatMessages);
  }, [chatMessages]);

  // Poll for new orders and messages every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof window !== "undefined") {
        setOrders(loadOrders());
        setChatMessages(loadChatMessages());
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
          setOrders(newOrders);
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
        setOrders(customEvent.detail);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("ordersUpdated", handleOrdersUpdated);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("ordersUpdated", handleOrdersUpdated);
    };
  }, []);

  const sortedOrders = useMemo(() => {
    const mine = clientName.trim()
      ? orders.filter(
          (o) => o.clientName.toLowerCase() === clientName.trim().toLowerCase()
        )
      : orders;
    return [...mine].sort((a, b) => b.createdAt - a.createdAt);
  }, [orders, clientName]);

  function removeOrder(id: string) {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  }

  function sendMessage() {
    if (!messageInput.trim() || !selectedChat) return;

    const now = new Date();
    const newMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      chatId: selectedChat,
      sender: "client",
      text: messageInput.trim(),
      time: now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      timestamp: now.getTime(),
    };

    setChatMessages((prev) => [...prev, newMessage]);
    setMessageInput("");
  }

  function handleLogout() {
    const confirmLogout = window.confirm(
      "Bạn có chắc chắn muốn đăng xuất?\n\nBạn sẽ cần đăng nhập lại để đặt lịch."
    );

    if (confirmLogout) {
      logout();
      // Clear form data
      setClientName("");
      setPhoneNumber("");
      // Show success notification
      setNotification({ message: "Đã đăng xuất thành công!", type: 'success' });
      // Auto hide after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    }
  }

  // Show Landing Page if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <Chatbot />
        <LandingPage onOpenAuthModal={(mode) => setShowAuthModal(true)} />
        {showAuthModal && <CustomerAuthModal onClose={() => setShowAuthModal(false)} />}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900">
      <Chatbot />
      {showAuthModal && <CustomerAuthModal onClose={() => setShowAuthModal(false)} />}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in">
          <div className={`px-6 py-4 rounded-lg shadow-2xl border-l-4 flex items-center space-x-3 ${
            notification.type === 'success' 
              ? 'bg-green-600 border-green-400 text-white' 
              : notification.type === 'error'
              ? 'bg-red-600 border-red-400 text-white'
              : 'bg-blue-600 border-blue-400 text-white'
          }`}>
            <div className="text-2xl">
              {notification.type === 'success' ? '✅' : notification.type === 'error' ? '❌' : 'ℹ️'}
            </div>
            <div>
              <p className="font-semibold">{notification.message}</p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="ml-4 text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}

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
                  RiceLink
                </h1>
                <p className="text-sm text-gray-400">Kết nối chuỗi giá trị lúa gạo</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-green-900 px-4 py-2 rounded-full">
                <Navigation className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-green-300">Đồng Tháp, Việt Nam</span>
              </div>
              {isAuthenticated && currentCustomer ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 bg-gray-700 px-4 py-2 rounded-full">
                    <User className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-white">{currentCustomer.name}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-full transition-colors"
                    title="Đăng xuất"
                  >
                    <LogOut className="w-4 h-4 text-white" />
                    <span className="text-sm font-medium text-white hidden sm:inline">Đăng xuất</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-2 rounded-full font-medium transition-all shadow-lg"
                >
                  Đăng nhập / Đăng ký
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex space-x-2 bg-gray-800 rounded-xl p-2 shadow-xl overflow-x-auto">
          <button
            onClick={() => setTab('orders')}
            className={`flex items-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
              tab === 'orders'
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Package className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Đơn hàng</span>
          </button>
          <button
            onClick={() => setTab('booking')}
            className={`flex items-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
              tab === 'booking'
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Đặt lịch</span>
          </button>
          <button
            onClick={() => setTab('chat')}
            className={`flex items-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
              tab === 'chat'
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Trò chuyện</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-8">
        {/* Orders Page */}
        {tab === "orders" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-100">Danh sách đơn hàng</h2>
                <p className="text-gray-400 mt-1">{sortedOrders.length} đơn hàng</p>
              </div>
            </div>

            {sortedOrders.length === 0 ? (
              <div className="bg-gray-800 rounded-2xl shadow-xl p-12 text-center border border-gray-700">
                <div className="text-gray-400 mb-2">
                  <Clock size={40} className="mx-auto opacity-50" />
                </div>
                <p className="text-gray-300 font-medium">
                  Chưa có đơn hàng nào
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Tạo đơn hàng mới để bắt đầu
                </p>
              </div>
            ) : (
              <>
                {sortedOrders.map((o) => {
                  const statusConfig = getStatusConfig(o.status);
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
                                  <MapPin className="w-4 h-4 mr-2 text-red-400" />
                                  {o.clientAddress}
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
                                <p className="text-xs text-gray-300 uppercase tracking-wider mb-1">Tên cơ sở sấy</p>
                                <p className="text-white flex items-center">
                                  <Package className="w-4 h-4 mr-2 text-green-400" />
                                  {o.shopName}
                                </p>
                              </div>
                            )}
                            {o.shippingCompany && (
                              <div>
                                <p className="text-xs text-gray-300 uppercase tracking-wider mb-1">Đơn vị vận chuyển</p>
                                <p className="text-white flex items-center text-sm">
                                  <Truck className="w-4 h-4 mr-2 text-yellow-400" />
                                  {o.shippingCompany}
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
                                <p className="text-xs text-gray-300 uppercase tracking-wider mb-1">Giá sấy</p>
                                <p className="text-yellow-400 font-bold">💰 {o.servicePrice.toLocaleString("vi-VN")} VNĐ/Tấn</p>
                              </div>
                            )}
                            {o.moistureType && o.moistureType !== "unconfirmed" && o.moistureValue && (
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
                            {o.paymentMethod && (
                              <div>
                                <p className="text-xs text-gray-300 uppercase tracking-wider mb-1">Phương thức thanh toán</p>
                              <p className="text-white">
                                    💳 {
                                      o.paymentMethod === "momo" ? "Momo" :
                                      o.paymentMethod === "vnpay" ? "VnPay" :
                                      o.paymentMethod === "zalopay" ? "ZaloPay" :
                                      o.paymentMethod === "viettel_money" ? "Viettel Money" :
                                      o.paymentMethod === "bank" ? "Ngân hàng" :
                                      o.paymentMethod === "visa" ? "Thẻ Visa" :
                                      o.paymentMethod === "master" ? "Thẻ Master" :
                                      o.paymentMethod === "icb" ? "ICB" : o.paymentMethod
                                    }
                                  </p>
                              </div>
                            )}
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
                            disabled={true}
                            // onChange={(e) => updateStatus(o.id, e.target.value as Order["status"])}
                            className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm border-2 bg-transparent cursor-pointer ${statusConfig.text} ${statusConfig.border}`}
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

        {/* Chat Page */}
        {tab === 'chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
            {/* Chat List */}
            <div className="lg:col-span-1 bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-gray-100 mb-3">Tin nhắn</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="overflow-y-auto flex-1">
                {chatContacts.map((contact) => (
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
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-semibold text-gray-100 truncate">{contact.name}</h4>
                          <span className="text-xs text-gray-500">{contact.timestamp}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-400 truncate">{contact.lastMessage}</p>
                          {contact.unread > 0 && (
                            <span className="ml-2 bg-green-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">
                              {contact.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Window */}
            <div className="lg:col-span-2 bg-gray-800 rounded-2xl shadow-xl border border-gray-700 flex flex-col">
              {selectedChat ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl">
                        {chatContacts.find(c => c.id === selectedChat)?.avatar}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-100">
                          {chatContacts.find(c => c.id === selectedChat)?.name}
                        </h3>
                        <p className="text-xs text-green-400">● Đang hoạt động</p>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                      <MessageSquare className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    {chatMessages
                      .filter((m) => m.chatId === selectedChat)
                      .sort((a, b) => a.timestamp - b.timestamp)
                      .map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender === 'client' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                              message.sender === 'client'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-700 text-gray-100'
                            }`}
                          >
                            <p className="text-sm">{message.text}</p>
                            <p className={`text-xs mt-1 ${
                              message.sender === 'client' ? 'text-green-200' : 'text-gray-500'
                            }`}>
                              {message.time}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-700">
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            sendMessage();
                          }
                        }}
                        placeholder="Nhập tin nhắn..."
                        className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <button
                        onClick={sendMessage}
                        className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-xl transition-colors"
                      >
                        <MessageSquare className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Chọn một cuộc trò chuyện để bắt đầu</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Booking Page */}
        {tab === "booking" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Sidebar - Form */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
                  <Search className="w-5 h-5 mr-2 text-green-400" />
                  Thông tin đặt lịch
                </h3>

                {/* Customer Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tên khách hàng
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Nhập tên khách hàng"
                    disabled={isAuthenticated}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {isAuthenticated && (
                    <p className="mt-1 text-xs text-green-400">✓ Đã tự động điền từ tài khoản</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Chỉ cho phép nhập số
                      if (value === '' || /^[0-9]+$/.test(value)) {
                        setPhoneNumber(value);
                      }
                    }}
                    placeholder="Nhập số điện thoại"
                    disabled={isAuthenticated}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {isAuthenticated && (
                    <p className="mt-1 text-xs text-green-400">✓ Đã tự động điền từ tài khoản</p>
                  )}
                </div>

                {/* Service Type */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Loại dịch vụ
                  </label>
                  <div className="relative">
                    <select
                      value={serviceType}
                      onChange={(e) => setServiceType(e.target.value as "drying" | "dryingAndStorage")}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 rounded-xl appearance-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    >
                      <option value="drying">Sấy lúa</option>
                      <option value="dryingAndStorage">Sấy và bảo quản lúa</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Storage Days - only show when serviceType is "dryingAndStorage" */}
                {serviceType === "dryingAndStorage" && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Thời gian bảo quản mong muốn
                    </label>
                    <input
                      type="number"
                      value={storageDays}
                      min={0}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (e.target.value === '' || value >= 0) {
                          setStorageDays(e.target.value);
                        }
                      }}
                      placeholder="Nhập số ngày bảo quản"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    />
                  </div>
                )}


                {/* Transport Checkbox */}
                <div className="mb-4">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={hasShippingCompany}
                        onChange={(e) => {
                          setHasShippingCompany(e.target.checked);
                          if (e.target.checked) {
                            setSelectedShippingCompany("");
                            setPricePerKm(0);
                          }
                        }}
                        className="sr-only"
                      />
                      <div className={`w-6 h-6 border-2 rounded-md transition-all ${
                        hasShippingCompany ? 'bg-green-500 border-green-500' : 'border-gray-600 group-hover:border-green-400'
                      }`}>
                        {hasShippingCompany && <CheckCircle className="w-6 h-6 text-white" />}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-white">
                      Đã có đơn vị vận chuyển
                    </span>
                  </label>
                </div>

                {/* Transport Company */}
                {!hasShippingCompany && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <Truck className="w-4 h-4 inline mr-1" />
                      Chọn đơn vị vận chuyển
                    </label>
                    <div className="relative">
                      <select
                        value={selectedShippingCompany}
                        onChange={(e) => {
                          setPricePerKm(
                            shippingCompanies.find((c) => c.id === e.target.value)?.pricePerKm || 0
                          );
                          return setSelectedShippingCompany(e.target.value);
                        }}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 rounded-xl appearance-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                      >
                        <option value="">Chọn đơn vị...</option>
                        {shippingCompanies?.map((company) => (
                          <option key={company.id} value={company.id}>
                            {company.name} - {company.pricePerKm.toLocaleString("vi-VN")} VND/Tấn
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                )}

                {/* Delivery Date */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Ngày mang lúa đến sấy
                  </label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all [color-scheme:dark]"
                  />
                </div>

                {/* Delivery Time */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Giờ mang lúa đến sấy
                  </label>
                  <div className="relative">
                    <select
                      value={deliveryTime}
                      onChange={(e) => setDeliveryTime(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 rounded-xl appearance-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    >
                      <option value="">Chọn khung giờ...</option>
                      <option value="0-1">0:00 - 1:00</option>
                      <option value="1-2">1:00 - 2:00</option>
                      <option value="2-3">2:00 - 3:00</option>
                      <option value="3-4">3:00 - 4:00</option>
                      <option value="4-5">4:00 - 5:00</option>
                      <option value="5-6">5:00 - 6:00</option>
                      <option value="6-7">6:00 - 7:00</option>
                      <option value="7-8">7:00 - 8:00</option>
                      <option value="8-9">8:00 - 9:00</option>
                      <option value="9-10">9:00 - 10:00</option>
                      <option value="10-11">10:00 - 11:00</option>
                      <option value="11-12">11:00 - 12:00</option>
                      <option value="13-14">13:00 - 14:00</option>
                      <option value="14-15">14:00 - 15:00</option>
                      <option value="15-16">15:00 - 16:00</option>
                      <option value="16-17">16:00 - 17:00</option>
                      <option value="17-18">17:00 - 18:00</option>
                      <option value="18-19">18:00 - 19:00</option>
                      <option value="19-20">19:00 - 20:00</option>
                      <option value="20-21">20:00 - 21:00</option>
                      <option value="21-22">21:00 - 22:00</option>
                      <option value="22-23">22:00 - 23:00</option>
                      <option value="23-24">23:00 - 24:00</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phương thức thanh toán
                  </label>
                  <div className="relative">
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 rounded-xl appearance-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    >
                      <option value="">Chọn phương thức...</option>
                      <option value="momo">Momo</option>
                      <option value="vnpay">VnPay</option>
                      <option value="zalopay">ZaloPay</option>
                      <option value="viettel_money">Viettel Money</option>
                      <option value="bank">Ngân hàng</option>
                      <option value="visa">Thẻ Visa</option>
                      <option value="master">Thẻ Master</option>
                      <option value="icb">ICB</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-400">
                      Chọn lò trong danh sách gợi ý bên phải để hoàn tất đặt đơn.
                    </p>
              </div>
            </div>

            {/* Right Side - Map */}
            <div className="lg:col-span-2">
              <MapClient
                onSelectShop={(shopId, shopName, address, capacity, shopData) => {
                  console.log('📍 Client: Received shop selection');
                  console.log('Shop ID:', shopId);
                  console.log('Shop Name:', shopName);

                  // Check if user is logged in
                  if (!isAuthenticated) {
                    alert("Vui lòng đăng nhập trước khi đặt lịch.");
                    setShowAuthModal(true);
                    return;
                  }

                  if (!clientName.trim()) {
                    alert("Vui lòng nhập tên khách hàng trước.");
                    return;
                  }
                  if (!phoneNumber.trim()) {
                    alert("Vui lòng nhập số điện thoại khách hàng trước.");
                    return;
                  }
                  if (!hasShippingCompany && !selectedShippingCompany) {
                    alert(
                      "Vui lòng chọn đơn vị vận chuyển hoặc đánh dấu đã có đơn vị vận chuyển."
                    );
                    return;
                  }
                  if (!deliveryDate) {
                    alert("Vui lòng chọn ngày mang lúa đến sấy.");
                    return;
                  }
                  if (!deliveryTime) {
                    alert("Vui lòng chọn giờ mang lúa đến sấy.");
                    return;
                  }
                  if (!paymentMethod) {
                    alert("Vui lòng chọn phương thức thanh toán.");
                    return;
                  }
                  const shippingCompanyName = hasShippingCompany
                    ? "Đã có đơn vị vận chuyển"
                    : shippingCompanies?.find(
                        (s) => s.id === selectedShippingCompany
                      )?.name || "N/A";

                  const serviceTypeText =
                    serviceType === "drying"
                      ? "Sấy lúa"
                      : "Sấy và bảo quản lúa";
                  // Use only dryingPrice for both service types
                  const servicePrice = shopData?.dryingPrice || 0;

                  console.log('🔍 DEBUG: Creating new order');
                  console.log('Shop ID:', shopId);
                  console.log('Shop Name from MapClient:', `"${shopName}"`);
                  console.log('Shop Name length:', shopName.length);
                  console.log('Shop Name char codes:', Array.from(shopName).map(c => c.charCodeAt(0)));

                  const newOrder: Order = {
                    id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    clientName: clientName.trim(),
                    phoneNumber: phoneNumber.trim(),
                    item: `${serviceTypeText} ${capacity} Tấn · ${shopName}`,
                    quantity: 1,
                    status: "pending",
                    createdAt: Date.now(),
                    clientAddress: address,
                    clientCapacity: capacity,
                    shopId: shopId, // Save shop ID for filtering
                    shopName: shopName, // Keep name for display
                    shippingCompany: shippingCompanyName,
                    serviceType: serviceType,
                    servicePrice: servicePrice,
                    storageDays: serviceType === "dryingAndStorage" ? storageDays : undefined,
                    deliveryDate: deliveryDate,
                    deliveryTime: deliveryTime,
                    paymentMethod: paymentMethod,
                    pricePerKm: hasShippingCompany ? 0 : pricePerKm,
                    paymentStatus: "unpaid",
                  };

                  console.log('📦 New order created:', newOrder);
                  console.log('💾 Saving to localStorage...');

                  setOrders((prev) => [newOrder, ...prev]);

                  // Only reset name and phone if not authenticated
                  // If authenticated, keep customer info for next order
                  if (!isAuthenticated) {
                    setClientName("");
                    setPhoneNumber("");
                  }

                  // Reset other fields
                  setHasShippingCompany(false);
                  setSelectedShippingCompany("");
                  setServiceType("drying");
                  setStorageDays(""); // Reset storage days
                  setDeliveryDate("");
                  setDeliveryTime("");
                  setPaymentMethod("");

                  // Show success notification
                  setNotification({
                    message: "Đặt lịch thành công! Đơn hàng đã được ghi nhận.",
                    type: 'success'
                  });

                  // Auto hide notification after 3 seconds
                  setTimeout(() => {
                    setNotification(null);
                  }, 3000);

                  setTab("orders");
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
