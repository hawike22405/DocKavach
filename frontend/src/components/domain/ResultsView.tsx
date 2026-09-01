"use client";

import type { ScreeningResponse } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card, CardHeading } from "@/components/ui/Card";
import { RiskGauge } from "@/components/domain/RiskGauge";
import { OcrTable } from "@/components/domain/OcrTable";
import { TamperingViewer } from "@/components/domain/TamperingViewer";
import { FaceMatchCard } from "@/components/domain/FaceMatchCard";

export function ResultsView({
  result,
  documentImage,
  liveFaceImage,
  decision,
  onDecision,
  onNewScan,
}: {
  result: ScreeningResponse;
  documentImage: string | null;
  liveFaceImage: string | null;
  decision: "APPROVE" | "FLAG" | "REJECT" | null;
  onDecision: (decision: "APPROVE" | "FLAG" | "REJECT") => void;
  onNewScan: () => void;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Screening result</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-100">{result.recommendation}</h2>
            <p className="mt-1 font-mono text-xs text-slate-500">{result.transactionId}</p>
          </div>
          <RiskGauge score={result.overallRiskScore} />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeading title="OCR extraction" description="Fields extracted from the document image" />
          <OcrTable data={result.module1_OCR} />
        </Card>
        <Card>
          <CardHeading title="Face match" description="Document portrait compared with live capture" />
          <FaceMatchCard
            documentPhoto={documentImage}
            livePhoto={liveFaceImage}
            matchPercentage={result.module4_FaceMatch.matchPercentage}
            isMatch={result.module4_FaceMatch.isMatch}
          />
        </Card>
        <Card>
          <CardHeading title="Validation" description="Machine-readable validity checks" />
          <div className="space-y-2">
            <p className={result.module2_Validation.isValid ? "text-sm text-success" : "text-sm text-danger"}>
              {result.module2_Validation.isValid ? "Document passed validation" : "Validation failed"}
            </p>
            {result.module2_Validation.errors.map((error) => (
              <p key={error} className="text-sm text-slate-400">{error}</p>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeading title="Tampering analysis" description="Anomalies identified by the screening model" />
          <TamperingViewer imageUrl={documentImage} data={result.module3_Tampering} />
        </Card>
      </div>

      <Card>
        <CardHeading title="Officer decision" description="Record the final disposition for this screening" />
        <div className="flex flex-wrap items-center gap-2">
          {(["APPROVE", "FLAG", "REJECT"] as const).map((option) => (
            <Button key={option} variant={decision === option ? "primary" : "ghost"} onClick={() => onDecision(option)}>
              {option}
            </Button>
          ))}
          <div className="ml-auto">
            <Button variant="ghost" onClick={onNewScan}>New scan</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
