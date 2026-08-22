"use client";

import { useEffect } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { useAuth, useCatalog, useShop } from "@/lib/store";
import { createClient } from "@/utils/supabase/client";

function CatalogSync() {
  const { data: session } = useSession();
  const setProducts = useCatalog((s) => s.setProducts);
  const setCategories = useCatalog((s) => s.setCategories);
  const setBanners = useCatalog((s) => s.setBanners);
  const setConfig = useCatalog((s) => s.setConfig);
  const setPincodesFull = useCatalog((s) => s.setPincodesFull);
  const setFlashDeals = useCatalog((s) => s.setFlashDeals);
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/banners").then((r) => r.json()),
      fetch("/api/config").then((r) => r.json()),
      fetch("/api/flash-deals").then((r) => r.json()),
      isAdmin
        ? fetch("/api/admin/products").then((r) => r.json())
        : fetch("/api/products").then((r) => r.json()),
    ])
      .then(([categoriesRes, bannersRes, configRes, flashDealsRes, productsRes]) => {
        if (Array.isArray(categoriesRes.categories)) setCategories(categoriesRes.categories);
        if (Array.isArray(bannersRes.banners)) setBanners(bannersRes.banners);
        if (Array.isArray(productsRes.products)) setProducts(productsRes.products);
        if (Array.isArray(flashDealsRes.deals)) setFlashDeals(flashDealsRes.deals);
        if (configRes.config) {
          setConfig({
            store_name: configRes.config.storeName,
            delivery_fee: configRes.config.deliveryFee,
            free_delivery_above: configRes.config.freeDeliveryThreshold,
            platform_fee: configRes.config.platformFee,
            isStoreOpen: configRes.config.isStoreOpen,
          } as any);
        }
        if (Array.isArray(configRes.pincodes) && configRes.pincodes.length > 0) {
          setPincodesFull(configRes.pincodes);
        }
      })
      .catch((err) => console.warn("Catalog sync failed, using local seed data:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  return null;
}

function AddressSync() {
  const { status } = useSession();
  const setAddresses = useShop((s) => s.setAddresses);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/user/addresses")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.addresses)) setAddresses(data.addresses);
      })
      .catch((err) => console.warn("Address sync failed:", err));
  }, [status, setAddresses]);

  return null;
}

function AuthSync() {
  const { data: session, status } = useSession();
  const setUser = useAuth((s) => s.setUser);
  const setTokenBalance = useAuth((s) => s.setTokenBalance);
  const logout = useAuth((s) => s.logout);

  useEffect(() => {
    // 1. NextAuth session check
    if (status === "authenticated" && session?.user) {
      setUser({
        id: session.user.id || "u_session",
        name: session.user.name || "Customer",
        email: session.user.email || undefined,
        image: session.user.image || undefined,
        role: (session.user as any).role || "CUSTOMER",
      });
      fetch("/api/user/tokens")
        .then((r) => r.json())
        .then((d) => setTokenBalance(d.tokenBalance ?? 0))
        .catch(() => {});
      return;
    }

    // 2. Supabase auth check & subscription
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && user.email) {
        const userEmail: string = user.email;
        const meta = user.user_metadata || {};
        fetch("/api/auth/supabase-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: user.id,
            email: userEmail,
            name: meta.full_name || meta.name || userEmail.split("@")[0],
            image: meta.avatar_url || meta.picture,
          }),
        })
          .then((r) => r.json())
          .then((res) => {
            if (res.user) {
              setUser(res.user);
              if (typeof res.user.tokenBalance === "number") {
                setTokenBalance(res.user.tokenBalance);
              }
            }
          })
          .catch(() => {});
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && session.user.email) {
        const u = session.user;
        const uEmail = u.email!;
        const meta = u.user_metadata || {};
        fetch("/api/auth/supabase-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: u.id,
            email: uEmail,
            name: meta.full_name || meta.name || uEmail.split("@")[0],
            image: meta.avatar_url || meta.picture,
          }),
        })
          .then((r) => r.json())
          .then((res) => {
            if (res.user) {
              setUser(res.user);
              if (typeof res.user.tokenBalance === "number") {
                setTokenBalance(res.user.tokenBalance);
              }
            }
          })
          .catch(() => {});
      } else if (event === "SIGNED_OUT") {
        if (status !== "authenticated") {
          logout();
          setTokenBalance(0);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [session, status, setUser, setTokenBalance, logout]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthSync />
      <CatalogSync />
      <AddressSync />
      {children}
    </SessionProvider>
  );
}
