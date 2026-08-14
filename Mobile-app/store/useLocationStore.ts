import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface LocationState {
  pincode: string;
  city: string;
  isDetecting: boolean;
  setPincode: (pincode: string, city?: string) => void;
  detectLocation: () => Promise<{ pincode: string; city: string }>;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      pincode: "734001",
      city: "Siliguri",
      isDetecting: false,
      setPincode: (pincode, city = "Siliguri Area") => set({ pincode, city }),
      detectLocation: async () => {
        set({ isDetecting: true });
        // Simulating rapid auto-detection for mobile
        await new Promise((r) => setTimeout(r, 600));
        const res = { pincode: "734001", city: "Hill Cart Road, Siliguri" };
        set({ pincode: res.pincode, city: res.city, isDetecting: false });
        return res;
      },
    }),
    {
      name: "qc-location-mobile",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
