"use client";

import { useEffect } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { useAuth, useCatalog, useShop } from "@/lib/store";

function CatalogSync() {
  const { data: session } = useSession();
  const setProducts = useCatalog((s) => s.setProducts);
  const setCategories = useCatalog((s) => s.setCategories);
  const setBanners = useCatalog((s) => s.setBanners);
  const setConfig = useCatalog((s) => s.setConfig);
  const setPincodesFull = useCatalog((s) => s.setPincodesFull);
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/banners").then((r) => r.json()),
      fetch("/api/config").then((r) => r.json()),
      isAdmin
        ? fetch("/api/admin/products").then((r) => r.json())
        : fetch("/api/products").then((r) => r.json()),
    ])
      .then(([categoriesRes, bannersRes, configRes, productsRes]) => {
        if (Array.isArray(categoriesRes.categories)) setCategories(categoriesRes.categories);
        if (Array.isArray(bannersRes.banners)) setBanners(bannersRes.banners);
        if (Array.isArray(productsRes.products)) setProducts(productsRes.products);
        if (configRes.config) {
          setConfig({
            store_name: configRes.config.storeName,
            delivery_fee: configRes.config.deliveryFee,
            free_delivery_above: configRes.config.freeDeliveryThreshold,
            platform_fee: configRes.config.platformFee,
          });
        }
        if (Array.isArray(configRes.pincodes) && configRes.pincodes.length > 0) {
          setPincodesFull(configRes.pincodes);
        }
      })
      .catch((err) => console.warn("Catalog sync failed, using local seed data:", err));
  }, [isAdmin, setProducts, setCategories, setBanners, setConfig, setPincodesFull]);

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
      <CatalogSync />
      <AddressSync />
      {children}
    </SessionProvider>
  );
}
