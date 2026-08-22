import { createBrowserClient } from "@supabase/ssr";

const FALLBACK_SUPABASE_URL = "https://dopgzhmkexmuwjrllfcf.supabase.co";
const FALLBACK_SUPABASE_KEY = "sb_publishable_u0o6JzFPooNNJcDyLiaGbg_6hO2BmM8";

export const createClient = () => {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    FALLBACK_SUPABASE_KEY;

  return createBrowserClient(supabaseUrl, supabaseKey);
};
