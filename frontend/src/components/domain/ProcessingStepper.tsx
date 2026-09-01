const steps = ["OCR extraction", "Validation", "Tampering analysis", "Face match"];

export function ProcessingStepper({ currentStepIndex }: { currentStepIndex: number }) {
  return (
    <div className="space-y-3 p-5">
      <h2 className="text-sm font-semibold text-slate-200">Screening in progress</h2>
      <div className="space-y-2">
        {steps.map((step, index) => {
          const complete = index < currentStepIndex;
          const active = index === currentStepIndex;
          return (
            <div key={step} className="flex items-center gap-3 text-sm">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${complete ? "border-success text-success" : active ? "border-accent text-accent" : "border-border text-slate-600"}`}>
                {complete ? "✓" : index + 1}
              </span>
              <span className={complete || active ? "text-slate-200" : "text-slate-500"}>{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
