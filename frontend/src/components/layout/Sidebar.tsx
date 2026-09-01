"use client";

import { LayoutDashboard, ScanLine, History, Settings, ShieldCheck } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Scan Document", href: "/", icon: ScanLine },
  { label: "History", href: "/history", icon: History },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <div className="flex items-center gap-2 border-b border-border px-5 py-5"><ShieldCheck className="h-6 w-6 text-accent" aria-hidden="true" /><div className="leading-tight"><p className="text-sm font-semibold text-slate-100">SSB Screening</p><p className="text-xs text-slate-400">Border Checkpoint Unit</p></div></div>
      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Primary">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href && label === "Dashboard";
          return <Link key={label} href={href} className={clsx("flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors", active ? "bg-accent/15 text-accent" : "text-slate-300 hover:bg-surface-raised hover:text-slate-100")} aria-current={active ? "page" : undefined}><Icon className="h-4 w-4" aria-hidden="true" />{label}</Link>;
        })}
      </nav>
      <div className="border-t border-border px-3 py-4"><div className="rounded-md bg-surface-raised px-3 py-2.5"><p className="text-xs text-slate-400">Station status</p><div className="mt-1 flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" /><p className="text-xs font-medium text-slate-200">Online · Lane 3</p></div></div></div>
    </aside>
  );
}
