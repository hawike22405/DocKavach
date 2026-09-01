import { CheckCircle2, LoaderCircle } from "lucide-react";
import { PROCESSING_STEPS } from "@/lib/types";
import clsx from "clsx";

export function ProcessingStepper({ currentStepIndex }: { currentStepIndex: number }) {
  return (
    <div className="mx-auto max-w-md py-10">
      <ol className="space-y-4">
        {PROCESSING_STEPS.map((label, index) => {
          const done = index < currentStepIndex;
          const active = index === currentStepIndex;
          return (
            <li key={label} className="flex items-center gap-3">
              <span
                className={clsx(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                  done && "bg-success text-white",
                  active && "text-accent",
                  !done && !active && "border border-border text-slate-600"
                )}
              >
                {done ? (
                  <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                ) : active ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
                ) : (
                  <span className="text-xs">{index + 1}</span>
                )}
              </span>
              <span
                className={clsx(
                  "text-sm",
                  done && "text-slate-400",
                  active && "text-slate-100 font-medium",
                  !done && !active && "text-slate-600"
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
