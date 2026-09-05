"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeading } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DocumentUploader } from "@/components/domain/DocumentUploader";
import { FaceCapture } from "@/components/domain/FaceCapture";
import { ProcessingStepper } from "@/components/domain/ProcessingStepper";
import { ResultsView } from "@/components/domain/ResultsView";
import { useScanStore } from "@/store/useScanStore";
import { hasToken, recordDecision, screenDocument } from "@/lib/api";
import type { OfficerDecision } from "@/lib/types";
import { ScanLine } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const {
    stage,
    documentImage,
    liveFaceImage,
    processingStepIndex,
    result,
    officerDecision,
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
          documentType: "PASSPORT",
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

  useEffect(() => () => {
    if (documentImage?.startsWith("blob:")) URL.revokeObjectURL(documentImage);
  }, [documentImage]);

  if (!authorized) return <div className="mx-auto max-w-5xl px-6 py-8 text-sm text-slate-500">Checking officer session…</div>;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">New scan</h1>
          <p className="text-sm text-slate-400">Upload a document and capture a live photo to begin screening.</p>
        </div>
        {stage !== "capture" && <Button variant="ghost" onClick={resetSession}>Cancel scan</Button>}
      </header>

      {error && <div role="alert" className="mb-4 rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>}

      {stage === "capture" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeading title="Document image" description="Passport or visa page" />
              <DocumentUploader imageUrl={documentImage} onChange={setDocumentImage} />
            </Card>
            <Card>
              <CardHeading title="Live photo" description="Face verification capture" />
              <FaceCapture imageUrl={liveFaceImage} onChange={setLiveFaceImage} />
            </Card>
          </div>
          <div className="flex justify-end">
            <Button variant="primary" disabled={!canRunScreening} onClick={runScreening}>
              <ScanLine className="h-4 w-4" /> Run screening
            </Button>
          </div>
        </div>
      )}

      {stage === "processing" && <Card><ProcessingStepper currentStepIndex={processingStepIndex} /></Card>}

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
