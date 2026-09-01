import { UserRound } from "lucide-react";
import clsx from "clsx";

export function FaceMatchCard({
  documentPhoto,
  livePhoto,
  matchPercentage,
  isMatch,
}: {
  documentPhoto: string | null;
  livePhoto: string | null;
  matchPercentage: number;
  isMatch: boolean;
}) {
  return (
    <div className="flex items-center justify-center gap-4">
      <Portrait src={documentPhoto} label="Document photo" />
      <div className="flex flex-col items-center gap-1">
        <span className={clsx("font-mono text-lg font-semibold", isMatch ? "text-success" : "text-warning")}>
          {matchPercentage}%
        </span>
        <span className="text-[11px] text-slate-500">match</span>
      </div>
      <Portrait src={livePhoto} label="Live capture" />
    </div>
  );
}

function Portrait({ src, label }: { src: string | null; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-slate-950">
        {src ? <img src={src} alt={label} className="h-full w-full object-cover" /> : <UserRound className="h-8 w-8 text-slate-600" aria-hidden="true" />}
      </div>
      <span className="text-[11px] text-slate-500">{label}</span>
    </div>
  );
}
