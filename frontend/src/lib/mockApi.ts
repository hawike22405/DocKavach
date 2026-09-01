import type { ScreeningRequest, ScreeningResponse } from "./types";

/** Browser-side stand-in for the future Python/FastAPI inference service. */
export function screenDocument(request: ScreeningRequest, onStep?: (stepIndex: number) => void): Promise<ScreeningResponse> {
  return new Promise((resolve) => {
    const stepDelays = [650, 550, 900, 700];
    let elapsed = 0;
    stepDelays.forEach((delay, index) => {
      elapsed += delay;
      setTimeout(() => onStep?.(index), elapsed);
    });
    setTimeout(() => resolve(buildMockResponse(request)), elapsed + 300);
  });
}

function buildMockResponse(request: ScreeningRequest): ScreeningResponse {
  const flagged = request.documentType === "PASSPORT";
  const matchPercentage = flagged ? 76 : 94;
  const overallRiskScore = flagged ? 58 : 6;
  const recommendation = flagged ? "REVIEW" : "APPROVE";
  return {
    transactionId: `TXN-${Date.now().toString(36).toUpperCase()}`,
    timestamp: new Date().toISOString(),
    overallRiskScore,
    recommendation,
    module1_OCR: { name: "RAVI KUMAR SHARMA", documentNumber: "P8317462", dob: "1991-04-12", expiry: flagged ? "2024-11-03" : "2029-11-03", nationality: "IND", mrz: "P<INDSHARMA<<RAVI<KUMAR<<<<<<<<<<<<<<<<<<<<<\nP8317462<3IND9104123M2911031<<<<<<<<<<<<<<08" },
    module2_Validation: { isValid: !flagged, errors: flagged ? ["Document expiry date has passed", "MRZ checksum digit mismatch on line 2"] : [] },
    module3_Tampering: {
      isTampered: flagged,
      confidence: flagged ? 0.83 : 0.04,
      anomalies: flagged ? [
        { type: "PHOTO_REPLACEMENT", description: "Pixel-density discontinuity around the photo laminate seam.", boundingBox: { x: 0.62, y: 0.14, w: 0.3, h: 0.38 } },
        { type: "FONT_MISMATCH", description: "Character kerning on the surname field differs from the issuing office's font table.", boundingBox: { x: 0.08, y: 0.56, w: 0.5, h: 0.09 } },
      ] : [],
    },
    module4_FaceMatch: { matchPercentage, isMatch: matchPercentage >= 85 },
  };
}
