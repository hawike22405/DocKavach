"use client";

import { usePathname } from "next/navigation";
import { LiquidNavBar } from "@/components/layout/LiquidNavBar";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { useAuthStore } from "@/store/useAuthStore";
import { LogOut } from "lucide-react";

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
          {/* Logout button — fixed top-right */}
          <div className="fixed right-4 top-5 z-50 flex items-center gap-3">
            <span className="hidden text-sm text-slate-400 sm:inline">
              {officer.name}
            </span>
            <button
              onClick={logout}
              title="Sign out"
              className="rounded-full border border-white/10 bg-slate-800/60 p-2 text-slate-400
                         backdrop-blur-sm transition-colors hover:bg-slate-700 hover:text-slate-200"
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
