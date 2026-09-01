"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  motion,
  animate,
  useMotionValue,
  useTransform,
  type MotionValue,
  type PanInfo,
} from "framer-motion";
import { LayoutDashboard, ScanLine, History, Settings, type LucideIcon } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface Rect {
  left: number;
  width: number;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  // Points at the same route as Dashboard for now, matching Sidebar.tsx —
  // give it its own route (e.g. "/scan") once the flows diverge.
  { label: "Scan Document", href: "/", icon: ScanLine },
  { label: "History", href: "/history", icon: History },
  { label: "Settings", href: "/settings", icon: Settings },
];

const SPRING = { type: "spring", stiffness: 300, damping: 26, mass: 0.6 } as const;

// How far (px) from the pill's center a neighboring item still feels some
// magnification, and how much extra scale the item directly under the pill
// gets at distance 0.
const MAGNIFY_RADIUS = 90;
const MAGNIFY_SCALE = 0.22;

function smoothstep(t: number) {
  const clamped = Math.max(0, Math.min(1, t));
  return clamped * clamped * (3 - 2 * clamped);
}

/**
 * One nav item's icon + label. Its scale is a motion value derived directly
 * from the pill's live center position and a "drag intensity" gate — no
 * React state or re-renders are involved, so the falloff stays smooth even
 * at 60fps. `intensity` decays to 0 shortly after the pill is released, so
 * the item nearest the pill at rest doesn't stay magnified forever.
 */
function NavItemLabel({
  active,
  icon: Icon,
  label,
  pillCenter,
  intensity,
  rect,
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  pillCenter: MotionValue<number>;
  intensity: MotionValue<number>;
  rect: Rect | null;
}) {
  const scale = useTransform([pillCenter, intensity], (latest) => {
    const [center, gate] = latest as [number, number];
    if (!rect || gate <= 0) return 1;
    const itemCenter = rect.left + rect.width / 2;
    const distance = Math.abs(center - itemCenter);
    const falloff = smoothstep(1 - distance / MAGNIFY_RADIUS);
    return 1 + falloff * MAGNIFY_SCALE * gate;
  });

  return (
    <motion.span style={{ scale, transformOrigin: "center" }} className="flex items-center gap-2">
      <Icon className={`h-4 w-4 shrink-0 ${active ? "text-cyan-300" : "text-slate-400"}`} aria-hidden="true" />
      <span className={`hidden sm:inline ${active ? "text-cyan-100" : "text-slate-300"}`}>{label}</span>
    </motion.span>
  );
}

/**
 * Floating glassmorphic nav bar with a single, physically draggable pill.
 *
 * Unlike a `layoutId`-based pill (which animates between two *different*
 * elements and can't be grabbed), this pill is one persistent element whose
 * x-position and width are driven by Framer Motion values. It snaps to the
 * active route on navigation, and can also be dragged by hand — items near
 * the pill magnify with a smooth Dock-style falloff while dragging, and on
 * release it snaps to the nearest tab and navigates there.
 */
export function LiquidNavBar() {
  const pathname = usePathname();
  const router = useRouter();

  const containerRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<Array<HTMLLIElement | null>>([]);

  const pillX = useMotionValue(0);
  const pillWidth = useMotionValue(0);
  const pillCenter = useTransform([pillX, pillWidth], (latest) => {
    const [x, w] = latest as [number, number];
    return x + w / 2;
  });
  const dragIntensity = useMotionValue(0);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [itemRects, setItemRects] = useState<Array<Rect | null>>(() => NAV_ITEMS.map(() => null));

  const measure = useCallback((index: number): Rect | null => {
    const el = itemRefs.current[index];
    if (!el) return null;
    return { left: el.offsetLeft, width: el.offsetWidth };
  }, []);

  const findNearest = useCallback((center: number, rects: Array<Rect | null>) => {
    let nearest = 0;
    let nearestDistance = Infinity;
    rects.forEach((rect, i) => {
      if (!rect) return;
      const distance = Math.abs(rect.left + rect.width / 2 - center);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = i;
      }
    });
    return nearest;
  }, []);

  const snapTo = useCallback(
    (index: number) => {
      const rect = measure(index);
      if (!rect) return;
      animate(pillX, rect.left, SPRING);
      animate(pillWidth, rect.width, SPRING);
    },
    [measure, pillX, pillWidth]
  );

  // Measure every tab's position on mount and whenever the layout might
  // reflow (e.g. labels toggling visibility at the sm breakpoint).
  useLayoutEffect(() => {
    const recompute = () => setItemRects(NAV_ITEMS.map((_, i) => measure(i)));
    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, [measure]);

  // Keep the pill glued to the active route — but don't fight the user
  // while they're mid-drag.
  useLayoutEffect(() => {
    if (isDragging) return;
    const index = NAV_ITEMS.findIndex(
      (item) => item.href === pathname && (item.href !== "/" || item.label === "Dashboard")
    );
    const resolved = index === -1 ? 0 : index;
    setActiveIndex(resolved);
    snapTo(resolved);
  }, [pathname, isDragging, snapTo]);

  const dragRectsRef = useRef<Array<Rect | null>>([]);

  const handleDragStart = () => {
    setIsDragging(true);
    dragRectsRef.current = NAV_ITEMS.map((_, i) => measure(i));
    dragIntensity.stop();
    dragIntensity.set(1);
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, _info: PanInfo) => {
    setIsDragging(false);

    const center = pillX.get() + pillWidth.get() / 2;
    const nearest = findNearest(center, dragRectsRef.current);

    setActiveIndex(nearest);
    snapTo(nearest);
    animate(dragIntensity, 0, { duration: 0.3, ease: "easeOut" });

    const target = NAV_ITEMS[nearest];
    if (target) router.push(target.href);
  };

  return (
    <nav aria-label="Primary" className="fixed left-1/2 top-4 z-50 -translate-x-1/2">
      <ul
        ref={containerRef}
        className="relative flex items-center gap-1 rounded-full border border-white/10
                   bg-slate-900/60 px-1.5 py-1.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]
                   backdrop-blur-xl backdrop-saturate-150"
      >
        {/* The single draggable "liquid" pill. Grab it and drag it to another tab. */}
        <motion.span
          drag="x"
          dragConstraints={containerRef}
          dragElastic={0.12}
          dragMomentum={false}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          whileDrag={{ scaleY: 0.85, scaleX: 1.06 }}
          style={{ x: pillX, width: pillWidth }}
          transition={SPRING}
          className="absolute inset-y-1.5 left-0 z-0 cursor-grab touch-none rounded-full
                     bg-cyan-400/15 ring-1 ring-inset ring-cyan-400/40 will-change-transform
                     active:cursor-grabbing"
        />

        {NAV_ITEMS.map(({ label, href, icon: Icon }, i) => {
          const active = i === activeIndex;
          return (
            <li
              key={label}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              className="relative z-10"
            >
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={() => setActiveIndex(i)}
                className="relative block rounded-full px-3.5 py-2 text-sm font-medium transition-colors sm:px-4"
              >
                <NavItemLabel
                  active={active}
                  icon={Icon}
                  label={label}
                  pillCenter={pillCenter}
                  intensity={dragIntensity}
                  rect={itemRects[i] ?? null}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}