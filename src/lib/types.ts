export type DocumentType = "PASSPORT" | "VISA" | "NATIONAL_ID";
export type Recommendation = "APPROVE" | "REVIEW" | "REJECT";
export type TamperingAnomalyType = "PHOTO_REPLACEMENT" | "FONT_MISMATCH" | "METADATA";
export type OfficerDecision = "APPROVE" | "FLAG" | "REJECT";

export interface ScreeningRequest {
  documentImageBase64: string;
  documentType: DocumentType;
  liveFaceBase64?: string;
}

export interface BoundingBox {
  x: number; // 0-1, fraction of image width
  y: number; // 0-1, fraction of image height
  w: number; // 0-1, fraction of image width
  h: number; // 0-1, fraction of image height
}

export interface TamperingAnomaly {
  type: TamperingAnomalyType;
  description: string;
  boundingBox?: BoundingBox;
}

export interface ScreeningResponse {
  transactionId: string;
  timestamp: string;
  overallRiskScore: number; // 0 (safe) to 100 (high risk)
  recommendation: Recommendation;

  module1_OCR: {
    name: string;
    documentNumber: string;
    dob: string;
    expiry: string;
    nationality: string;
    mrz: string;
  };

  module2_Validation: {
    isValid: boolean;
    errors: string[];
  };

  module3_Tampering: {
    isTampered: boolean;
    confidence: number;
    anomalies: TamperingAnomaly[];
  };

  module4_FaceMatch: {
    matchPercentage: number;
    isMatch: boolean;
  };
}

/** The four AI modules shown in the processing stepper, in run order. */
export const PROCESSING_STEPS = [
  "Extracting text (OCR)",
  "Validating document format",
  "Analyzing tampering",
  "Matching face",
] as const;
