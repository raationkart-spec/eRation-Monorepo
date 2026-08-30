import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const rawUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabaseUrl =
  rawUrl && rawUrl.startsWith("http")
    ? rawUrl
    : "https://dopgzhmkexmuwjrllfcf.supabase.co";

const rawKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
const supabaseAnonKey =
  rawKey && rawKey.length > 10
    ? rawKey
    : "sb_publishable_u0o6JzFPooNNJcDyLiaGbg_6hO2BmM8";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
