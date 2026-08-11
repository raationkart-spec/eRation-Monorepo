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

  useEffect(() => {
    if (hydrated && status !== "loading" && !isAuthed) {
      router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
    }
  }, [hydrated, status, isAuthed, pathname, router]);

  if (!hydrated || status === "loading") return <HomeSkeleton />;
  if (!isAuthed) return null;

  return <>{children}</>;
}
