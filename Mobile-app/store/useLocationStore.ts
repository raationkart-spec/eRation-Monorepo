import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { SERVICEABLE_PINCODES } from "../lib/data";

interface LocationState {
  pincode: string;
  city: string;
  isDetecting: boolean;
  isServiceable: boolean;
  hasInitialized: boolean;
  setPincode: (pincode: string, city?: string) => void;
  initLocationOnAppLaunch: () => Promise<void>;
  detectLocation: (force?: boolean) => Promise<{ pincode: string; city: string; isServiceable: boolean }>;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      pincode: "734001",
      city: "Siliguri",
      isDetecting: false,
      isServiceable: true,
      hasInitialized: false,
      setPincode: (pincode, city = "Siliguri Area") => {
        const serviceable = SERVICEABLE_PINCODES.includes(pincode);
        set({ pincode, city, isServiceable: serviceable, hasInitialized: true });
      },
      initLocationOnAppLaunch: async () => {
        if (get().hasInitialized) {
          return;
        }
        await get().detectLocation(true);
      },
      detectLocation: async (force = false) => {
        if (!force && get().hasInitialized && get().pincode) {
          return {
            pincode: get().pincode,
            city: get().city,
            isServiceable: get().isServiceable,
          };
        }

        set({ isDetecting: true });
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== "granted") {
            set({ isDetecting: false, hasInitialized: true });
            return { pincode: "734001", city: "Siliguri (Default)", isServiceable: true };
          }

          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          const reverse = await Location.reverseGeocodeAsync({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });

          if (reverse && reverse.length > 0) {
            const first = reverse[0];
            const detectedPin = first.postalCode || "734001";
            const locName = first.name || first.street || first.district || first.city || "Siliguri";
            const detectedCity = first.city || first.subregion || "Siliguri";
            const serviceable = SERVICEABLE_PINCODES.includes(detectedPin);

            const displayCity = `${locName}, ${detectedCity}`;
            set({
              pincode: detectedPin,
              city: displayCity,
              isServiceable: serviceable,
              isDetecting: false,
              hasInitialized: true,
            });

            return {
              pincode: detectedPin,
              city: displayCity,
              isServiceable: serviceable,
            };
          }
        } catch (e) {
          console.log("Expo location detection error:", e);
        }

        const fallback = { pincode: "734001", city: "Siliguri", isServiceable: true };
        set({
          pincode: fallback.pincode,
          city: fallback.city,
          isServiceable: true,
          isDetecting: false,
          hasInitialized: true,
        });
        return fallback;
      },
    }),
    {
      name: "qc-location-mobile",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
