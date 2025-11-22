"use client";

import { useState } from "react";
import { useCustomerAuth, RegisterData } from "@/contexts/CustomerAuthContext";
import { AlertCircle, CheckCircle, Eye, EyeOff, User, Phone, Mail, MapPin, Lock } from "lucide-react";

interface AuthModalProps {
  onClose: () => void;
}

export default function CustomerAuthModal({ onClose }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const { login, register } = useCustomerAuth();

  // Login state
  const [loginPhoneOrEmail, setLoginPhoneOrEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register state
  const [registerData, setRegisterData] = useState<RegisterData>({
    name: "",
    phoneNumber: "",
    email: "",
    province: "",
    district: "",
    ward: "",
    customerType: "farmer",
    password: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI state
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    if (!loginPhoneOrEmail || !loginPassword) {
      setMessage({ type: "error", text: "Vui lòng điền đầy đủ thông tin" });
      setIsLoading(false);
      return;
    }

    const result = login(loginPhoneOrEmail, loginPassword);
    setMessage({ type: result.success ? "success" : "error", text: result.message });
    setIsLoading(false);

    if (result.success) {
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    // Validate
    if (!registerData.name || !registerData.phoneNumber || !registerData.password) {
      setMessage({ type: "error", text: "Vui lòng điền đầy đủ thông tin bắt buộc" });
      setIsLoading(false);
      return;
    }

    if (!registerData.ward || !registerData.district || !registerData.province) {
      setMessage({ type: "error", text: "Vui lòng điền đầy đủ địa chỉ" });
      setIsLoading(false);
      return;
    }

    if (registerData.password.length < 6) {
      setMessage({ type: "error", text: "Mật khẩu phải có ít nhất 6 ký tự" });
      setIsLoading(false);
      return;
    }

    if (registerData.password !== confirmPassword) {
      setMessage({ type: "error", text: "Mật khẩu xác nhận không khớp" });
      setIsLoading(false);
      return;
    }

    const result = register(registerData);
    setMessage({ type: result.success ? "success" : "error", text: result.message });
    setIsLoading(false);

    if (result.success) {
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              {mode === "login" ? "Đăng nhập" : "Đăng ký tài khoản"}
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => {
              setMode("login");
              setMessage(null);
            }}
            className={`flex-1 py-3 px-4 font-medium transition-colors ${
              mode === "login"
                ? "bg-gray-700 text-white border-b-2 border-green-500"
                : "text-gray-400 hover:text-white hover:bg-gray-700/50"
            }`}
          >
            Đăng nhập
          </button>
          <button
            onClick={() => {
              setMode("register");
              setMessage(null);
            }}
            className={`flex-1 py-3 px-4 font-medium transition-colors ${
              mode === "register"
                ? "bg-gray-700 text-white border-b-2 border-green-500"
                : "text-gray-400 hover:text-white hover:bg-gray-700/50"
            }`}
          >
            Đăng ký
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Message */}
          {message && (
            <div
              className={`mb-4 p-4 rounded-lg flex items-start space-x-3 ${
                message.type === "success"
                  ? "bg-green-500/20 text-green-400 border border-green-500"
                  : "bg-red-500/20 text-red-400 border border-red-500"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              )}
              <p className="text-sm">{message.text}</p>
            </div>
          )}

          {/* Login Form */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Số điện thoại hoặc Email *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={loginPhoneOrEmail}
                    onChange={(e) => setLoginPhoneOrEmail(e.target.value)}
                    placeholder="Nhập số điện thoại hoặc email"
                    className="w-full px-4 py-3 pl-11 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <Phone className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Mật khẩu *
                </label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    className="w-full px-4 py-3 pl-11 pr-11 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-white"
                  >
                    {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>
            </form>
          )}

          {/* Register Form */}
          {mode === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Họ và tên *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    placeholder="Nhập họ và tên"
                    className="w-full px-4 py-3 pl-11 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Số điện thoại *
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={registerData.phoneNumber}
                      onChange={(e) => setRegisterData({ ...registerData, phoneNumber: e.target.value })}
                      placeholder="Nhập số điện thoại"
                      className="w-full px-4 py-3 pl-11 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <Phone className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email (Nếu có)
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      placeholder="Nhập email"
                      className="w-full px-4 py-3 pl-11 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Địa chỉ *
                </label>
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={registerData.ward}
                      onChange={(e) => setRegisterData({ ...registerData, ward: e.target.value })}
                      placeholder="Xã/Phường/Thị trấn"
                      className="w-full px-4 py-3 pl-11 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={registerData.district}
                    onChange={(e) => setRegisterData({ ...registerData, district: e.target.value })}
                    placeholder="Quận/Huyện"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    value={registerData.province}
                    onChange={(e) => setRegisterData({ ...registerData, province: e.target.value })}
                    placeholder="Tỉnh/Thành phố"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Đối tượng khách hàng *
                </label>
                <select
                  value={registerData.customerType}
                  onChange={(e) => setRegisterData({ ...registerData, customerType: e.target.value as "farmer" | "cooperative" | "trader" | "enterprise" })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="farmer">Nông dân</option>
                  <option value="cooperative">Hợp tác xã</option>
                  <option value="trader">Thương lái</option>
                  <option value="enterprise">Doanh nghiệp sản xuất lúa gạo</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Mật khẩu *
                  </label>
                  <div className="relative">
                    <input
                      type={showRegisterPassword ? "text" : "password"}
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                      className="w-full px-4 py-3 pl-11 pr-11 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="absolute right-3 top-3.5 text-gray-400 hover:text-white"
                    >
                      {showRegisterPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Xác nhận mật khẩu *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu"
                      className="w-full px-4 py-3 pl-11 pr-11 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3.5 text-gray-400 hover:text-white"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Đang đăng ký..." : "Đăng ký"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

