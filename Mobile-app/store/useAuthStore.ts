import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "../lib/types";

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  loginWithBackend: (user: Partial<User>) => void;
  loginWithPhone: (phone: string, name?: string) => void;
  loginWithGoogle: () => void;
  logout: () => void;
  updateName: (name: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      loginWithBackend: (userData) =>
        set({
          user: {
            id: userData.id || "u_" + Date.now(),
            email: userData.email || "",
            name: userData.name || userData.email?.split("@")[0] || "QuickCart Shopper",
            phone: userData.phone || "",
            role: userData.role || "CUSTOMER",
          },
        }),
      loginWithPhone: (phone, name) =>
        set({
          user: {
            id: "u_" + Date.now(),
            name: name || "QuickCart Shopper",
            phone,
            role: "CUSTOMER",
          },
        }),
      loginWithGoogle: () =>
        set({
          user: {
            id: "u_google_demo",
            name: "Demo Shopper",
            email: "demo.shopper@gmail.com",
            phone: "+91 98000 12345",
            role: "CUSTOMER",
          },
        }),
      logout: () => set({ user: null }),
      updateName: (name) =>
        set((s) => (s.user ? { user: { ...s.user, name } } : s)),
    }),
    {
      name: "qc-auth-mobile",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
