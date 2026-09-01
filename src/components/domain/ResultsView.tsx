"use client";

import { Card, CardHeading } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RiskGauge } from "./RiskGauge";
import { OcrTable } from "./OcrTable";
import { TamperingViewer } from "./TamperingViewer";
import { FaceMatchCard } from "./FaceMatchCard";
import type { ScreeningResponse, OfficerDecision } from "@/lib/types";
import { CheckCircle2, Flag, XCircle } from "lucide-react";

interface ResultsViewProps {
  result: ScreeningResponse;
  documentImage: string | null;
  liveFaceImage: string | null;
  decision: OfficerDecision | null;
  onDecision: (decision: OfficerDecision) => void;
  onNewScan: () => void;
}

export function ResultsView({
  result,
  documentImage,
  liveFaceImage,
  decision,
  onDecision,
  onNewScan,
}: ResultsViewProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[280px,1fr]">
        <Card className="flex flex-col items-center justify-center">
          <CardHeading title="Risk score" description={result.transactionId} />
          <RiskGauge score={result.overallRiskScore} recommendation={result.recommendation} />
        </Card>

        <Card>
          <CardHeading title="Face verification" description="Document photo vs. live capture" />
          <FaceMatchCard
            documentPhoto={documentImage}
            livePhoto={liveFaceImage}
            matchPercentage={result.module4_FaceMatch.matchPercentage}
            isMatch={result.module4_FaceMatch.isMatch}
          />
        </Card>
      </div>

      <Card>
        <CardHeading title="Extracted data (OCR)" description="Click a field to correct it before deciding" />
        <OcrTable fields={result.module1_OCR} />
      </Card>

      <Card>
        <CardHeading title="Validation & tampering analysis" />
        <TamperingViewer
          documentImage={documentImage}
          validation={result.module2_Validation}
          tampering={result.module3_Tampering}
        />
      </Card>

      <Card className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-sm text-slate-400">
          {decision
            ? `Recorded: ${decision === "APPROVE" ? "Approved" : decision === "FLAG" ? "Flagged for interrogation" : "Rejected"}. Session will clear.`
            : "Choose an action to close this screening."}
        </p>
        <div className="flex gap-2">
          <Button variant="success" onClick={() => onDecision("APPROVE")} disabled={!!decision}>
            <CheckCircle2 className="h-4 w-4" /> Approve
          </Button>
          <Button variant="warning" onClick={() => onDecision("FLAG")} disabled={!!decision}>
            <Flag className="h-4 w-4" /> Flag for interrogation
          </Button>
          <Button variant="danger" onClick={() => onDecision("REJECT")} disabled={!!decision}>
            <XCircle className="h-4 w-4" /> Reject
          </Button>
        </div>
      </Card>

      {decision && (
        <div className="flex justify-center">
          <Button variant="ghost" onClick={onNewScan}>
            Start next scan
          </Button>
        </div>
      )}
    </div>
  );
}
