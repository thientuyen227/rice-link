"use client";

import { MessageSquare, Navigation, Package, Search, Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

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
  const [tab, setTab] = useState<"orders" | "chat">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<"all" | Order["status"]>("all");
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Mock chat contacts (orders with messages)
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
      setOrders(loadOrders());
      setChatMessages(loadChatMessages());
    }
  }, []);

  useEffect(() => {
    saveOrders(orders);
  }, [orders]);

  useEffect(() => {
    saveChatMessages(chatMessages);
  }, [chatMessages]);

  // Poll for new messages every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof window !== "undefined") {
        setChatMessages(loadChatMessages());
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const visible = useMemo(() => {
    const sorted = [...orders].sort((a, b) => b.createdAt - a.createdAt);
    if (filter === "all") return sorted;
    return sorted.filter((o) => o.status === filter);
  }, [orders, filter]);

  function updateStatus(id: string, status: Order["status"]) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }

  function removeOrder(id: string) {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  }

  function sendMessage() {
    if (!messageInput.trim() || !selectedChat) return;

    const now = new Date();
    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
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
                  RiceLink - Quản lý Lò Sấy
                </h1>
                <p className="text-sm text-gray-400">Quản lý đơn hàng của lò sấy</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-green-900 px-4 py-2 rounded-full">
              <Navigation className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-green-300">Đồng Tháp, Việt Nam</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setTab("orders")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              tab === "orders"
                ? "bg-green-600 text-white shadow-lg"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            📦 Quản lý đơn hàng
          </button>
          <button
            onClick={() => setTab("chat")}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
              tab === "chat"
                ? "bg-green-600 text-white shadow-lg"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span>Trò chuyện</span>
          </button>
        </div>
      </div>

      {/* Filter Section - Only show on orders tab */}
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
                <h2 className="text-2xl font-bold text-gray-100">Danh sách đơn hàng của tất cả khách</h2>
                <p className="text-gray-400 mt-1">{visible.length} đơn hàng</p>
              </div>
            </div>

          {visible.length === 0 ? (
            <div className="bg-gray-800 rounded-2xl shadow-xl p-12 text-center border border-gray-700">
              <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-300 font-medium">
                Không có đơn nào
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Chưa có đơn hàng phù hợp với bộ lọc
              </p>
            </div>
          ) : (
            <>
              {visible.map((o) => {
                const cfg = getStatusConfig(o.status);
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
                              <p className="text-gray-300 font-semibold">{(o.clientCapacity / 1000).toFixed(2)} Tấn</p>
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
                                <p className="text-2xl font-bold text-green-400">💵 {(o.servicePrice * (o.clientCapacity / 1000)).toLocaleString("vi-VN")} VNĐ</p>
                              </>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleString("vi-VN")}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end space-y-3 ml-6">
                        <select
                          value={o.status}
                          onChange={(e) => updateStatus(o.id, e.target.value as Order["status"])}
                          className={`px-4 py-2 rounded-lg font-medium text-sm border-2 bg-transparent cursor-pointer ${cfg.text} ${cfg.border}`}
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
                          {contact.phoneNumber && (
                            <p className="text-xs text-gray-500 mt-1">📞 {contact.phoneNumber}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
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
                          className={`flex ${message.sender === 'shop' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                              message.sender === 'shop'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-700 text-gray-100'
                            }`}
                          >
                            <p className="text-sm">{message.text}</p>
                            <p className={`text-xs mt-1 ${
                              message.sender === 'shop' ? 'text-green-200' : 'text-gray-500'
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
                    <p className="text-gray-400">Chọn một khách hàng để bắt đầu trò chuyện</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
