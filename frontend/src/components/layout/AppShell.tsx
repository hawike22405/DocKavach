"use client";

import { usePathname } from "next/navigation";
import { LiquidNavBar } from "@/components/layout/LiquidNavBar";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { useAuthStore } from "@/store/useAuthStore";
import { LogOut, ShieldCheck } from "lucide-react";

const HIDE_CHROME_ROUTES = ["/login"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { officer, logout } = useAuthStore();
  const showChrome = !HIDE_CHROME_ROUTES.includes(pathname) && officer;

  return (
    <AuthGuard>
      {showChrome && (
        <>
          <LiquidNavBar />
          <div className="fixed right-4 top-5 z-50 flex items-center gap-2 sm:right-5">
            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-slate-950/55 px-3 py-2 text-xs text-slate-300 shadow-lg backdrop-blur-md sm:flex">
              <ShieldCheck className="h-4 w-4 text-cyan-300" aria-hidden="true" />
              <span>{officer.name}</span>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              aria-label="Sign out"
              className="security-pulse rounded-full border border-white/10 bg-slate-950/65 p-2 text-slate-400 shadow-lg backdrop-blur-md transition-colors hover:border-cyan-400/30 hover:bg-slate-900/80 hover:text-slate-100"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
      <main className={showChrome ? "min-w-0 pt-24" : ""}>{children}</main>
    </AuthGuard>
  );
}
