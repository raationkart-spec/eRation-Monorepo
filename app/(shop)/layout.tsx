import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { ToastHost } from "@/components/toast";
import { AuthGate } from "@/components/AuthGate";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-white">
      <TopBar />
      <main className="px-4 pb-24 pt-3">
        <AuthGate>{children}</AuthGate>
      </main>
      <BottomNav />
      <ToastHost />
    </div>
  );
}
