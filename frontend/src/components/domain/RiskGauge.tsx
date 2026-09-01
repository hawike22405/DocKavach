import type { Recommendation } from "@/lib/types";
import clsx from "clsx";

const COLOR_BY_RECOMMENDATION: Record<Recommendation, string> = {
  APPROVE: "#10B981",
  REVIEW: "#F59E0B",
  REJECT: "#EF4444",
};

const LABEL_BY_RECOMMENDATION: Record<Recommendation, string> = {
  APPROVE: "Safe to clear",
  REVIEW: "Manual review needed",
  REJECT: "High risk",
};

export function RiskGauge({
  score,
  recommendation,
}: {
  score: number;
  recommendation: Recommendation;
}) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  const color = COLOR_BY_RECOMMENDATION[recommendation];

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-36 w-36">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#334155" strokeWidth="10" />
          <circle cx="60" cy="60" r={radius} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 700ms ease-out" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-2xl font-semibold text-slate-100">{score}</span>
          <span className="text-[11px] text-slate-500">risk / 100</span>
        </div>
      </div>
      <span className={clsx("mt-3 rounded-full px-3 py-1 text-xs font-medium")} style={{ backgroundColor: `${color}26`, color }}>
        {recommendation} · {LABEL_BY_RECOMMENDATION[recommendation]}
      </span>
    </div>
  );
}
