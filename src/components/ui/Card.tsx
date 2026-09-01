import { HTMLAttributes } from "react";
import clsx from "clsx";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx("rounded-lg border border-border bg-surface p-5", className)}
      {...props}
    />
  );
}

export function CardHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
      {description && <p className="mt-0.5 text-xs text-slate-400">{description}</p>}
    </div>
  );
}
