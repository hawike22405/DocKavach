const steps = ["OCR extraction", "Field validation", "Tamper analysis", "Face match"];

export function ProcessingStepper({ currentStepIndex }: { currentStepIndex: number }) {
  const safeIndex = Math.max(0, Math.min(currentStepIndex, steps.length - 1));

  return (
    <section className="relative overflow-hidden rounded-2xl border border-cyan-400/15 bg-slate-950/45 p-8 shadow-[0_20px_60px_rgba(2,12,27,0.35)] backdrop-blur-md" aria-live="polite" aria-busy="true">
      <div className="watermark-seal" aria-hidden="true">✓</div>
      <div className="relative flex flex-col items-center text-center">
        <div className="security-pulse mb-5 grid h-24 w-24 place-items-center rounded-full border border-cyan-400/20 bg-cyan-400/5">
          <div className="scan-loader" aria-hidden="true" />
        </div>
        <span className="gov-eyebrow">Secure screening pipeline</span>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">Analyzing document evidence</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
          DocKavach is running OCR, validation, forensic image analysis, and face verification. Keep this window open until the screening is complete.
        </p>

        <div className="mt-8 w-full max-w-xl">
          <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
            <span>Processing stage {safeIndex + 1} of {steps.length}</span>
            <span>{Math.round(((safeIndex + 1) / steps.length) * 100)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-[width] duration-500" style={{ width: `${((safeIndex + 1) / steps.length) * 100}%` }} />
          </div>
        </div>

        <div className="mt-8 grid w-full max-w-xl gap-3 sm:grid-cols-2">
          {steps.map((step, index) => {
            const complete = index < safeIndex;
            const active = index === safeIndex;
            return (
              <div key={step} className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left ${active ? "border-cyan-400/25 bg-cyan-400/5" : "border-white/5 bg-white/[0.015]"}`}>
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs font-semibold ${complete ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" : active ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-200" : "border-white/10 text-slate-600"}`}>
                  {complete ? "✓" : index + 1}
                </span>
                <span className={complete || active ? "text-sm text-slate-200" : "text-sm text-slate-500"}>{step}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
