import { create } from "zustand";
import type { ScreeningResponse } from "@/lib/types";

export type ScanStage = "capture" | "processing" | "results";

interface ScanState {
  stage: ScanStage;
  documentImage: string | null; // object URL, never persisted to disk/localStorage
  liveFaceImage: string | null;
  processingStepIndex: number;
  result: ScreeningResponse | null;
  officerDecision: "APPROVE" | "FLAG" | "REJECT" | null;

  setDocumentImage: (url: string | null) => void;
  setLiveFaceImage: (url: string | null) => void;
  startProcessing: () => void;
  setProcessingStep: (index: number) => void;
  setResult: (result: ScreeningResponse) => void;
  setOfficerDecision: (decision: "APPROVE" | "FLAG" | "REJECT") => void;
  /** Clears every field, including PII-bearing images and OCR data. */
  resetSession: () => void;
}

const initialState = {
  stage: "capture" as ScanStage,
  documentImage: null,
  liveFaceImage: null,
  processingStepIndex: -1,
  result: null,
  officerDecision: null,
};

export const useScanStore = create<ScanState>((set) => ({
  ...initialState,

  setDocumentImage: (url) => set({ documentImage: url }),
  setLiveFaceImage: (url) => set({ liveFaceImage: url }),

  startProcessing: () => set({ stage: "processing", processingStepIndex: -1 }),
  setProcessingStep: (index) => set({ processingStepIndex: index }),
  setResult: (result) => set({ stage: "results", result }),
  setOfficerDecision: (decision) => set({ officerDecision: decision }),

  resetSession: () => set({ ...initialState }),
}));
