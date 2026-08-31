"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAuth } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { HomeSkeleton } from "@/components/skeletons";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const hydrated = useHydrated();
  const user = useAuth((s) => s.user);
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthed = Boolean(user || session?.user);
  const isPublicPage = pathname === "/terms" || pathname === "/privacy";

  useEffect(() => {
    if (hydrated && status === "unauthenticated" && !user && !isPublicPage) {
      router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
    }
  }, [hydrated, status, user, isAuthed, pathname, router, isPublicPage]);

  if (!hydrated || (status === "loading" && !user)) return <HomeSkeleton />;
  if (!isAuthed && !isPublicPage) return null;

  return <>{children}</>;
}
