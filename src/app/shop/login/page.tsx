"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import { LogIn } from "lucide-react";

export default function ShopLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simulate loading
    setTimeout(() => {
      const success = login(username, password);
      setIsLoading(false);

      if (success) {
        router.push("/shop");
      } else {
        setError("Tên đăng nhập hoặc mật khẩu không đúng!");
      }
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-green-900 to-emerald-900 p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl border-2 border-green-600 overflow-hidden transform hover:scale-[1.01] transition-all duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6">
            <div className="flex items-center justify-center mb-3">
              <div className="relative w-16 h-16 rounded-full overflow-hidden shadow-2xl bg-white p-2 ring-2 ring-white/30">
                <Image
                  src="/Logo RiceLink.png"
                  alt="RiceLink Logo"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-center text-white mb-2">
              🏭 Đăng nhập Cơ sở sấy
            </h1>
            <p className="text-center text-green-100 text-sm font-medium">
              Hệ thống quản lý cơ sở sấy lúa RiceLink
            </p>
          </div>

          {/* Form */}
          <div className="p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-200 mb-2">
                  👤 Tên đăng nhập
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập"
                  required
                  className="w-full px-4 py-2.5 text-base bg-gray-700 border-2 border-gray-600 text-gray-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-200 mb-2">
                  🔒 Mật khẩu
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  required
                  className="w-full px-4 py-2.5 text-base bg-gray-700 border-2 border-gray-600 text-gray-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                />
              </div>

              {error && (
                <div className="bg-red-500/20 border-2 border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm text-center font-bold">
                  ❌ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-base font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-xl hover:shadow-green-500/50 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang đăng nhập...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>Đăng nhập</span>
                  </>
                )}
              </button>
            </form>

            {/* Demo Accounts */}
            <div className="mt-6 p-4 bg-blue-500/20 border-2 border-blue-500 rounded-lg">
              <p className="text-sm font-bold text-blue-300 mb-3 flex items-center gap-2">
                <span className="text-lg">🔑</span>
                <span>Tài khoản demo</span>
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between bg-gray-700/50 p-2 rounded hover:bg-gray-700 transition-all">
                  <span className="text-gray-200 font-semibold">🏭 SÁU THO:</span>
                  <span className="text-green-400 font-mono font-bold">sautho / 123456a</span>
                </div>
                <div className="flex items-center justify-between bg-gray-700/50 p-2 rounded hover:bg-gray-700 transition-all">
                  <span className="text-gray-200 font-semibold">🏭 Lệ Hoa:</span>
                  <span className="text-green-400 font-mono font-bold">lehoa / 123456b</span>
                </div>
                <div className="flex items-center justify-between bg-gray-700/50 p-2 rounded hover:bg-gray-700 transition-all">
                  <span className="text-gray-200 font-semibold">🏭 Lộc Tấn:</span>
                  <span className="text-green-400 font-mono font-bold">loctan / 123456c</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-300 text-xs font-medium mt-4">
          © 2025 RiceLink - Hệ thống kết nối nông dân và cơ sở sấy lúa
        </p>
      </div>
    </div>
  );
}

