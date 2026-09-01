"use client";

import { useEffect } from "react";
import { Card, CardHeading } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DocumentUploader } from "@/components/domain/DocumentUploader";
import { FaceCapture } from "@/components/domain/FaceCapture";
import { ProcessingStepper } from "@/components/domain/ProcessingStepper";
import { ResultsView } from "@/components/domain/ResultsView";
import { useScanStore } from "@/store/useScanStore";
import { screenDocument } from "@/lib/mockApi";
import { ScanLine } from "lucide-react";

export default function DashboardPage() {
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

  const canRunScreening = Boolean(documentImage && liveFaceImage);

  const runScreening = () => {
    if (!documentImage) return;
    startProcessing();
    screenDocument(
      { documentImageBase64: documentImage, documentType: "PASSPORT", liveFaceBase64: liveFaceImage ?? undefined },
      (step) => setProcessingStep(step)
    ).then((response) => setResult(response));
  };

  useEffect(() => {
    return () => {
      if (documentImage) URL.revokeObjectURL(documentImage);
    };
  }, [documentImage]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-100">New scan</h1>
          <p className="text-sm text-slate-400">Upload a document and capture a live photo to begin screening.</p>
        </div>
        {stage !== "capture" && (
          <Button variant="ghost" onClick={resetSession}>
            Cancel scan
          </Button>
        )}
      </header>

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

      {stage === "processing" && (
        <Card>
          <ProcessingStepper currentStepIndex={processingStepIndex} />
        </Card>
      )}

      {stage === "results" && result && (
        <ResultsView
          result={result}
          documentImage={documentImage}
          liveFaceImage={liveFaceImage}
          decision={officerDecision}
          onDecision={setOfficerDecision}
          onNewScan={resetSession}
        />
      )}
    </div>
  );
}
