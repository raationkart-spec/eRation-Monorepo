"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { HomeSkeleton } from "@/components/skeletons";

// First-run onboarding: unauthenticated users are sent to the login screen.
export function AuthGate({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const user = useAuth((s) => s.user);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (hydrated && !user) {
      router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
    }
  }, [hydrated, user, pathname, router]);

  if (!hydrated || !user) return <HomeSkeleton />;
  return <>{children}</>;
}
