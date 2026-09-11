"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeading } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DocumentUploader } from "@/components/domain/DocumentUploader";
import { FaceCapture } from "@/components/domain/FaceCapture";
import { ProcessingStepper } from "@/components/domain/ProcessingStepper";
import { ResultsView } from "@/components/domain/ResultsView";
import { useScanStore } from "@/store/useScanStore";
import { hasToken, recordDecision, screenDocument } from "@/lib/api";
import type { DocumentType, OfficerDecision } from "@/lib/types";
import { ScanLine, ShieldCheck } from "lucide-react";
import clsx from "clsx";

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: "PASSPORT", label: "Passport" },
  { value: "VISA", label: "Visa" },
  { value: "NATIONAL_ID", label: "National ID" },
];

export default function DashboardPage() {
  const router = useRouter();
  const {
    stage,
    documentType,
    documentImage,
    liveFaceImage,
    processingStepIndex,
    result,
    officerDecision,
    setDocumentType,
    setDocumentImage,
    setLiveFaceImage,
    startProcessing,
    setProcessingStep,
    setResult,
    setOfficerDecision,
    resetSession,
  } = useScanStore();
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingDecision, setSavingDecision] = useState(false);

  const canRunScreening = Boolean(documentImage && liveFaceImage);

  useEffect(() => {
    if (hasToken()) setAuthorized(true);
    else router.replace("/login");
  }, [router]);

  const runScreening = async () => {
    if (!documentImage || !liveFaceImage) return;
    setError(null);
    startProcessing();
    try {
      const response = await screenDocument(
        {
          documentImageBase64: documentImage,
          documentType,
          liveFaceBase64: liveFaceImage,
        },
        setProcessingStep
      );
      setProcessingStep(3);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Screening request failed");
      resetSession();
    }
  };

  const handleDecision = async (decision: OfficerDecision) => {
    if (!result || savingDecision) return;
    setSavingDecision(true);
    setError(null);
    try {
      await recordDecision(result.transactionId, decision);
      setOfficerDecision(decision);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save officer decision");
    } finally {
      setSavingDecision(false);
    }
  };

  const prevDocRef = useRef(documentImage);
  const prevFaceRef = useRef(liveFaceImage);

  useEffect(() => {
    if (prevDocRef.current && prevDocRef.current !== documentImage && prevDocRef.current.startsWith("blob:")) {
      URL.revokeObjectURL(prevDocRef.current);
    }
    prevDocRef.current = documentImage;
  }, [documentImage]);

  useEffect(() => {
    if (prevFaceRef.current && prevFaceRef.current !== liveFaceImage && prevFaceRef.current.startsWith("blob:")) {
      URL.revokeObjectURL(prevFaceRef.current);
    }
    prevFaceRef.current = liveFaceImage;
  }, [liveFaceImage]);

  useEffect(() => {
    return () => {
      if (prevDocRef.current?.startsWith("blob:")) URL.revokeObjectURL(prevDocRef.current);
      if (prevFaceRef.current?.startsWith("blob:")) URL.revokeObjectURL(prevFaceRef.current);
    };
  }, []);

  if (!authorized) {
    return (
      <div className="mx-auto flex min-h-[65vh] max-w-5xl items-center justify-center px-6 py-8">
        <div className="gov-panel flex items-center gap-3 px-5 py-4 text-sm text-slate-400">
          <span className="security-pulse grid h-9 w-9 place-items-center rounded-full border border-cyan-400/20 bg-cyan-400/5">
            <ShieldCheck className="h-4 w-4 text-cyan-300" />
          </span>
          Verifying officer session…
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-6">
      <header className="relative mb-6 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/35 p-6 shadow-[0_18px_45px_rgba(2,12,27,0.25)] backdrop-blur-md">
        <div className="watermark-seal" aria-hidden="true">✓</div>
        <div className="relative max-w-3xl">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-cyan-300" aria-hidden="true" />
            <span className="gov-eyebrow">National identity screening • authorized officer console</span>
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Secure document screening</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Upload the identity document and capture a live face image. DocKavach evaluates document fields, visual integrity, and face correspondence before presenting an officer decision.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">Encrypted transport</span>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">Audit logged</span>
            <span className="rounded-full border border-cyan-400/15 bg-cyan-400/5 px-3 py-1.5 text-cyan-300/80">Officer controlled</span>
          </div>
        </div>
      </header>

      {error && <div role="alert" className="mb-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>}

      {stage === "capture" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 backdrop-blur-md">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Document type</span>
            <div className="flex gap-1.5" role="radiogroup" aria-label="Document type">
              {DOCUMENT_TYPES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={documentType === option.value}
                  onClick={() => setDocumentType(option.value)}
                  className={clsx(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    documentType === option.value
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-slate-500"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeading
                title="01 · Document image"
                description={
                  documentType === "PASSPORT"
                    ? "Passport photo page, MRZ band fully visible"
                    : documentType === "VISA"
                    ? "Visa page or sticker, all printed fields visible"
                    : "National identity card, front side"
                }
              />
              <DocumentUploader imageUrl={documentImage} onChange={setDocumentImage} />
            </Card>
            <Card>
              <CardHeading title="02 · Live face capture" description="Current image for identity correspondence" />
              <FaceCapture imageUrl={liveFaceImage} onChange={setLiveFaceImage} />
            </Card>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-4 backdrop-blur-md">
            <div className="hidden text-xs text-slate-500 sm:block">
              Both evidence sources are required before analysis can begin.
            </div>
            <div className="ml-auto">
              <Button variant="primary" disabled={!canRunScreening} onClick={runScreening}>
                <ScanLine className="h-4 w-4" /> Run secure screening
              </Button>
            </div>
          </div>
        </div>
      )}

      {stage === "processing" && <ProcessingStepper currentStepIndex={processingStepIndex} />}

      {stage === "results" && result && (
        <ResultsView
          result={result}
          documentImage={documentImage}
          liveFaceImage={liveFaceImage}
          decision={officerDecision}
          onDecision={handleDecision}
          onNewScan={resetSession}
          decisionDisabled={savingDecision}
        />
      )}
    </div>
  );
}
