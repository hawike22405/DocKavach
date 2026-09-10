import { create } from "zustand";
import type { DocumentType, ScreeningResponse } from "@/lib/types";

export type ScanStage = "capture" | "processing" | "results";
interface ScanState {
  stage: ScanStage;
  documentType: DocumentType;
  documentImage: string | null;
  liveFaceImage: string | null;
  processingStepIndex: number;
  result: ScreeningResponse | null;
  officerDecision: "APPROVE" | "FLAG" | "REJECT" | null;
  setDocumentType: (type: DocumentType) => void;
  setDocumentImage: (url: string | null) => void;
  setLiveFaceImage: (url: string | null) => void;
  startProcessing: () => void;
  setProcessingStep: (index: number) => void;
  setResult: (result: ScreeningResponse) => void;
  setOfficerDecision: (decision: "APPROVE" | "FLAG" | "REJECT") => void;
  resetSession: () => void;
}

const initialState = {
  stage: "capture" as ScanStage,
  documentType: "PASSPORT" as DocumentType,
  documentImage: null,
  liveFaceImage: null,
  processingStepIndex: -1,
  result: null,
  officerDecision: null,
};

export const useScanStore = create<ScanState>((set) => ({
  ...initialState,
  setDocumentType: (type) => set({ documentType: type }),
  setDocumentImage: (url) => set({ documentImage: url }),
  setLiveFaceImage: (url) => set({ liveFaceImage: url }),
  startProcessing: () => set({ stage: "processing", processingStepIndex: -1 }),
  setProcessingStep: (index) => set({ processingStepIndex: index }),
  setResult: (result) => set({ stage: "results", result }),
  setOfficerDecision: (decision) => set({ officerDecision: decision }),
  resetSession: () =>
    set((state) => ({ ...initialState, documentType: state.documentType })),
}));
