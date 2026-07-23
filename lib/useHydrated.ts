"use client";
import { useEffect, useState } from "react";

// Avoids hydration mismatches for localStorage-backed Zustand stores.
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
