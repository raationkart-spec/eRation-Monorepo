"use client";
import { create } from "zustand";
import { useEffect } from "react";

interface ToastState {
  message: string | null;
  show: (msg: string) => void;
  hide: () => void;
}

export const useToast = create<ToastState>((set) => ({
  message: null,
  show: (message) => set({ message }),
  hide: () => set({ message: null }),
}));

export function ToastHost() {
  const { message, hide } = useToast();
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(hide, 2500);
    return () => clearTimeout(t);
  }, [message, hide]);

  if (!message) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4">
      <div className="animate-fade-in rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-float">
        {message}
      </div>
    </div>
  );
}
