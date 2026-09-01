"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, animate, useMotionValue, useTransform, type MotionValue } from "framer-motion";
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

function getClientX(event: MouseEvent | TouchEvent | PointerEvent): number {
  if ("clientX" in event) return event.clientX;
  return event.touches[0]?.clientX ?? 0;
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
 * The drag gesture is attached to each nav item (via `onPan*`), not to the
 * pill itself — the pill is purely decorative (`pointer-events-none`) and
 * sits visually behind the items, so it can never be the thing receiving
 * the pointerdown. Pressing and moving on ANY item starts the drag; the
 * pill follows the pointer live, magnifies nearby items with a Dock-style
 * falloff, and on release snaps to the nearest tab and navigates there.
 */
export function LiquidNavBar() {
  const pathname = usePathname();
  const router = useRouter();

  const containerRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<Array<HTMLLIElement | null>>([]);
  const dragRectsRef = useRef<Array<Rect | null>>([]);

  const pillX = useMotionValue(0);
  const pillWidth = useMotionValue(0);
  const pillScaleX = useMotionValue(1);
  const pillScaleY = useMotionValue(1);
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
    const recompute = () => {
      setItemRects(NAV_ITEMS.map((_, i) => measure(i)));
      // Re-sync the pill's actual position/size too — a resize can change
      // an item's width/left (e.g. labels appearing at the sm breakpoint)
      // without pathname/isDragging changing, which previously left the
      // pill visually stuck at its old (now wrong) geometry.
      if (!isDragging) snapTo(activeIndex);
    };
    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handlePanStart = (index: number) => {
    setIsDragging(true);
    dragRectsRef.current = NAV_ITEMS.map((_, i) => measure(i));
    const startRect = dragRectsRef.current[index];
    if (startRect) pillWidth.set(startRect.width);
    dragIntensity.stop();
    dragIntensity.set(1);
    animate(pillScaleX, 1.06, { duration: 0.15 });
    animate(pillScaleY, 0.85, { duration: 0.15 });
  };

  const handlePan = (event: MouseEvent | TouchEvent | PointerEvent) => {
    const container = containerRef.current;
    if (!container) return;
    const containerLeft = container.getBoundingClientRect().left;
    const pointerX = getClientX(event) - containerLeft;
    const half = pillWidth.get() / 2;
    const maxLeft = Math.max(container.offsetWidth - pillWidth.get(), 0);
    pillX.set(Math.min(Math.max(pointerX - half, 0), maxLeft));
  };

  const handlePanEnd = () => {
    setIsDragging(false);

    const center = pillX.get() + pillWidth.get() / 2;
    const nearest = findNearest(center, dragRectsRef.current);

    setActiveIndex(nearest);
    snapTo(nearest);
    animate(dragIntensity, 0, { duration: 0.3, ease: "easeOut" });
    animate(pillScaleX, 1, SPRING);
    animate(pillScaleY, 1, SPRING);

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
        {/* Purely decorative — never receives pointer events, so it can
            never block the items above it. Position/size/squish are all
            driven by motion values set from the item-level pan handlers. */}
        <motion.span
          style={{ x: pillX, width: pillWidth, scaleX: pillScaleX, scaleY: pillScaleY }}
          transition={SPRING}
          className="pointer-events-none absolute inset-y-1.5 left-0 z-0 rounded-full bg-cyan-400/15
                     ring-1 ring-inset ring-cyan-400/40 will-change-transform"
        />

        {NAV_ITEMS.map(({ label, href, icon: Icon }, i) => {
          const active = i === activeIndex;
          return (
            <motion.li
              key={label}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              onPanStart={() => handlePanStart(i)}
              onPan={(event) => handlePan(event)}
              onPanEnd={handlePanEnd}
              className="relative z-10 touch-none select-none"
            >
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={() => setActiveIndex(i)}
                // Anchors are natively draggable in browsers. With a mouse
                // (i.e. any normal desktop window — this is what "full
                // screen" turned out to mean, not the Fullscreen API),
                // pressing and moving on a link fires the browser's native
                // dragstart and hijacks the pointer, so Framer's onPan
                // gesture never sees the follow-up pointermove events and
                // the pill doesn't budge. Touch input never triggers native
                // HTML5 drag, which is why this only showed up with a
                // mouse. draggable={false} + onDragStart + the CSS
                // property (Safari sometimes ignores the prop) shut that
                // native drag off so the custom pan gesture gets the
                // pointer instead.
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                className="relative block select-none rounded-full px-3.5 py-2 text-sm font-medium
                           transition-colors [-webkit-user-drag:none] sm:px-4"
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
            </motion.li>
          );
        })}
      </ul>
    </nav>
  );
}
