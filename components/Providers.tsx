"use client";

import { useEffect } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { useAuth } from "@/lib/store";

function AuthSync() {
  const { data: session, status } = useSession();
  const setUser = useAuth((s) => s.setUser);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setUser({
        id: session.user.id || "u_session",
        name: session.user.name || "Customer",
        email: session.user.email || undefined,
        image: session.user.image || undefined,
        role: (session.user as any).role || "CUSTOMER",
      });
    }
  }, [session, status, setUser]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthSync />
      {children}
    </SessionProvider>
  );
}
