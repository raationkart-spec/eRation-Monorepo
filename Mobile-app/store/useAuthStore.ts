import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "../lib/types";

interface AuthState {
  user: User | null;
  tokenBalance: number;
  setTokenBalance: (tokenBalance: number) => void;
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
      tokenBalance: 0,
      setTokenBalance: (tokenBalance) => set({ tokenBalance }),
      setUser: (user) => set({ user }),
      loginWithBackend: (userData) =>
        set((state) => ({
          user: {
            id: userData.id || state.user?.id || "u_" + Date.now(),
            email: userData.email || state.user?.email || "",
            name: userData.name || state.user?.name || userData.email?.split("@")[0] || "Semart Shopper",
            phone: userData.phone || state.user?.phone || "",
            role: userData.role || state.user?.role || "CUSTOMER",
            image: userData.image || state.user?.image,
          },
          ...(typeof userData.tokenBalance === "number" ? { tokenBalance: userData.tokenBalance } : {}),
        })),
      loginWithPhone: (phone, name) =>
        set({
          user: {
            id: "u_" + Date.now(),
            name: name || "Semart Shopper",
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
      logout: () => set({ user: null, tokenBalance: 0 }),
      updateName: (name) =>
        set((s) => (s.user ? { user: { ...s.user, name } } : s)),
    }),
    {
      name: "qc-auth-mobile",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
