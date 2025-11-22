"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ShopData } from "@/data/shop";
import { db } from "@/data/fakeDb";

interface AuthContextType {
  currentShop: ShopData | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
  // Admin functions - không cần đăng nhập, mọi người đều có thể dùng
  shopsList: ShopData[];
  updateShop: (updated: ShopData) => void;
  deleteShop: (shopId: string) => void;
  addShop: (shop: ShopData) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local type for records from fakeDb
interface ShopRecord {
  id?: string;
  name?: string;
  district?: string;
  address?: string;
  coordinates?: [number, number];
  rating?: number;
  limitCapacity?: number;
  dryingPrice?: number;
  username?: string;
  password?: string;
}

// Convert ShopRecord from fakeDb to ShopData format
function convertShopRecordToShopData(shopRecord: ShopRecord): ShopData {
  return {
    STT: 0,
    id: shopRecord.id,
    "Tên lò sấy": shopRecord.name || "",
    "TP/Huyện": shopRecord.district || "",
    "Địa điểm": shopRecord.address || "",
    "Tọa độ": shopRecord.coordinates || [0, 0],
    Rating: shopRecord.rating || 0,
    LimitCapacity: shopRecord.limitCapacity || 0,
    "Giá sấy lúa": shopRecord.dryingPrice || 0,
    username: shopRecord.username || "",
    password: shopRecord.password || "",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentShop, setCurrentShop] = useState<ShopData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shopsList, setShopsList] = useState<ShopData[]>([]);

  // Load shops from fakeDb
  const loadShopsFromDb = () => {
    const dbShops = db.listShops();
    const convertedShops = dbShops.map(convertShopRecordToShopData);
    setShopsList(convertedShops);
    return convertedShops;
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Load shops from fakeDb first
      const shops = loadShopsFromDb();

      const savedShopName = localStorage.getItem("currentShopName");
      if (savedShopName) {
        const shop = shops.find((s) => s["Tên lò sấy"] === savedShopName);
        if (shop) {
          setCurrentShop(shop);
        }
      }

      setIsLoading(false);

      // Listen for shops updates from admin page
      const handleShopsUpdate = () => {
        loadShopsFromDb();
      };
      window.addEventListener("demo:shops-updated", handleShopsUpdate);

      return () => {
        window.removeEventListener("demo:shops-updated", handleShopsUpdate);
      };
    }
  }, []);


  const login = (username: string, password: string): boolean => {
    // Reload shops from fakeDb to get latest data
    const latestShops = loadShopsFromDb();

    console.log('🔐 Login attempt:', { username, password });
    console.log('📋 Available shops:', latestShops.map(s => ({
      name: s["Tên lò sấy"],
      username: s.username,
      password: s.password
    })));

    // Check shop login (case-insensitive username)
    const shop = latestShops.find(
      (s) => s.username?.toLowerCase() === username.toLowerCase() && s.password === password
    );

    console.log('🔍 Found shop:', shop ? shop["Tên lò sấy"] : 'NOT FOUND');

    if (shop) {
      setCurrentShop(shop);
      localStorage.setItem("currentShopName", shop["Tên lò sấy"]);
      console.log('✅ Login success!');
      return true;
    }
    console.log('❌ Login failed - Check console for available shops');
    return false;
  };

  const logout = () => {
    setCurrentShop(null);
    localStorage.removeItem("currentShopName");
  };

  const updateShop = (updated: ShopData) => {
    // Update in fakeDb
    if (updated.id) {
      db.updateShop(updated.id, {
        name: updated["Tên lò sấy"],
        address: updated["Địa điểm"],
        district: updated["TP/Huyện"],
        limitCapacity: updated.LimitCapacity,
        dryingPrice: updated["Giá sấy lúa"],
        username: updated.username,
        password: updated.password,
      });
    }
    // Reload from db
    loadShopsFromDb();
  };

  const deleteShop = (shopId: string) => {
    db.deleteShop(shopId);
    loadShopsFromDb();
  };

  const addShop = (shop: ShopData) => {
    db.createShop({
      name: shop["Tên lò sấy"],
      address: shop["Địa điểm"],
      district: shop["TP/Huyện"],
      coordinates: shop["Tọa độ"] as [number, number],
      rating: shop.Rating,
      limitCapacity: shop.LimitCapacity,
      dryingPrice: shop["Giá sấy lúa"],
      username: shop.username,
      password: shop.password,
    });
    loadShopsFromDb();
  };

  return (
    <AuthContext.Provider
      value={{
        currentShop,
        login,
        logout,
        isAuthenticated: !!currentShop && !isLoading,
        shopsList,
        updateShop,
        deleteShop,
        addShop,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

