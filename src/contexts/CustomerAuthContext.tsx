"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { db, Customer } from "@/data/fakeDb";

interface CustomerAuthContextType {
  currentCustomer: Customer | null;
  login: (phoneOrEmail: string, password: string) => { success: boolean; message: string };
  register: (data: RegisterData) => { success: boolean; message: string };
  logout: () => void;
  isAuthenticated: boolean;
}

export interface RegisterData {
  name: string;
  phoneNumber: string;
  email?: string;
  province: string;
  district: string;
  ward: string;
  customerType: "farmer" | "cooperative" | "trader" | "enterprise";
  password: string;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCustomerId = localStorage.getItem("currentCustomerId");
      if (savedCustomerId) {
        const customer = db.getCustomer(savedCustomerId);
        if (customer) {
          setCurrentCustomer(customer);
        }
      }
      setIsLoading(false);
    }
  }, []);

  const login = (phoneOrEmail: string, password: string): { success: boolean; message: string } => {
    console.log('🔐 Customer login attempt:', { phoneOrEmail, password });

    // Check if it's phone or email
    const isEmail = phoneOrEmail.includes('@');
    const customer = isEmail
      ? db.getCustomerByEmail(phoneOrEmail)
      : db.getCustomerByPhone(phoneOrEmail);

    console.log('🔍 Found customer:', customer);

    if (!customer) {
      return { success: false, message: "Không tìm thấy tài khoản" };
    }

    if (customer.password !== password) {
      return { success: false, message: "Mật khẩu không đúng" };
    }

    setCurrentCustomer(customer);
    localStorage.setItem("currentCustomerId", customer.id);
    console.log('✅ Login success!');

    return { success: true, message: "Đăng nhập thành công" };
  };

  const register = (data: RegisterData): { success: boolean; message: string } => {
    console.log('📝 Customer register attempt:', data);

    // Validate data
    if (!data.name || !data.phoneNumber || !data.password) {
      return { success: false, message: "Vui lòng điền đầy đủ thông tin bắt buộc" };
    }

    if (data.password.length < 6) {
      return { success: false, message: "Mật khẩu phải có ít nhất 6 ký tự" };
    }

    // Check if phone number already exists
    const existingCustomerByPhone = db.getCustomerByPhone(data.phoneNumber);
    if (existingCustomerByPhone) {
      return { success: false, message: "Số điện thoại đã được đăng ký" };
    }

    // Check if email already exists (if provided)
    if (data.email) {
      const existingCustomerByEmail = db.getCustomerByEmail(data.email);
      if (existingCustomerByEmail) {
        return { success: false, message: "Email đã được đăng ký" };
      }
    }

    // Create customer
    const address = `${data.ward}, ${data.district}, ${data.province}`;
    const newCustomer = db.createCustomer({
      name: data.name,
      phoneNumber: data.phoneNumber,
      email: data.email,
      address,
      province: data.province,
      district: data.district,
      ward: data.ward,
      customerType: data.customerType,
      password: data.password,
    });

    console.log('✅ Register success!', newCustomer);

    // Auto login after registration
    setCurrentCustomer(newCustomer);
    localStorage.setItem("currentCustomerId", newCustomer.id);

    return { success: true, message: "Đăng ký thành công" };
  };

  const logout = () => {
    setCurrentCustomer(null);
    localStorage.removeItem("currentCustomerId");
  };

  if (isLoading) {
    return null; // or a loading spinner
  }

  return (
    <CustomerAuthContext.Provider
      value={{
        currentCustomer,
        login,
        register,
        logout,
        isAuthenticated: !!currentCustomer,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error("useCustomerAuth must be used within CustomerAuthProvider");
  }
  return context;
}

