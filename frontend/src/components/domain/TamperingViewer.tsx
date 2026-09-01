import { AlertTriangle, ShieldAlert, ShieldCheck } from "lucide-react";
import type { ScreeningResponse } from "@/lib/types";

const ANOMALY_LABEL: Record<string, string> = {
  PHOTO_REPLACEMENT: "Photo replacement detected",
  FONT_MISMATCH: "Font mismatch",
  METADATA: "Metadata altered",
};

export function TamperingViewer({
  documentImage,
  validation,
  tampering,
}: {
  documentImage: string | null;
  validation: ScreeningResponse["module2_Validation"];
  tampering: ScreeningResponse["module3_Tampering"];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-[auto,1fr]">
      <div className="relative mx-auto aspect-[16/10] w-full max-w-[280px] overflow-hidden rounded-md border border-border bg-slate-950 sm:mx-0">
        {documentImage && <img src={documentImage} alt="Scanned document" className="h-full w-full object-cover opacity-90" />}
        {tampering.anomalies.map((anomaly, i) =>
          anomaly.boundingBox ? (
            <div key={i} className="absolute rounded-sm border-2 border-danger" style={{ left: `${anomaly.boundingBox.x * 100}%`, top: `${anomaly.boundingBox.y * 100}%`, width: `${anomaly.boundingBox.w * 100}%`, height: `${anomaly.boundingBox.h * 100}%`, boxShadow: "0 0 0 9999px rgba(15,23,42,0.15)" }} aria-hidden="true" />
          ) : null
        )}
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          {tampering.isTampered ? <ShieldAlert className="h-4 w-4 text-danger" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4 text-success" aria-hidden="true" />}
          <span className="font-medium text-slate-100">{tampering.isTampered ? "Tampering indicators found" : "No tampering detected"}</span>
          <span className="ml-auto font-mono text-xs text-slate-500">{Math.round(tampering.confidence * 100)}% confidence</span>
        </div>
        <ul className="space-y-1.5">
          {tampering.anomalies.map((anomaly, i) => (
            <li key={i} className="flex items-start gap-2 rounded border border-danger/30 bg-danger/10 px-2.5 py-1.5 text-xs text-slate-200">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" aria-hidden="true" />
              <span><span className="font-medium">{ANOMALY_LABEL[anomaly.type] ?? anomaly.type}</span> — {anomaly.description}</span>
            </li>
          ))}
          {validation.errors.map((message, i) => (
            <li key={`val-${i}`} className="flex items-start gap-2 rounded border border-warning/30 bg-warning/10 px-2.5 py-1.5 text-xs text-slate-200">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" aria-hidden="true" />
              {message}
            </li>
          ))}
          {tampering.anomalies.length === 0 && validation.errors.length === 0 && <li className="text-xs text-slate-500">No format or tampering issues to review.</li>}
        </ul>
      </div>
    </div>
  );
}
