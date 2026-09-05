import type { ScreeningRequest, ScreeningResponse, OfficerDecision } from "./types";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api").replace(/\/$/, "");

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

export type HistoryRecord = ScreeningResponse & {
  _id: string;
  documentType: string;
  officerId: string;
  officerDecision: OfficerDecision | null;
  decisionTimestamp: string | null;
};

export type HistoryResponse = {
  records: HistoryRecord[];
  page: number;
  limit: number;
  total: number;
};

export type Officer = {
  id: string;
  name: string;
  email: string;
  badgeId: string;
};

export type AuthPayload = {
  token: string;
  officer: Officer;
};

export type Settings = {
  stationName: string;
  checkpointId: string;
  autoFlagThreshold: number;
};

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function imageSourceToDataUrl(source: string) {
  if (!source.startsWith("blob:")) return source;

  const response = await fetch(source);
  if (!response.ok) throw new Error("Could not read the uploaded document image");
  const blob = await response.blob();

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not convert the uploaded image to base64"));
    };
    reader.onerror = () => reject(new Error("Could not read the uploaded image"));
    reader.readAsDataURL(blob);
  });
}

async function request<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  let json: ApiResponse<T> | null = null;
  try {
    json = await response.json();
  } catch {
    throw new Error(`Backend returned ${response.status} with a non-JSON response`);
  }

  if (!response.ok || !json?.success) {
    if (response.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
    throw new Error(json?.message ?? `Request failed (${response.status})`);
  }

  if (!("data" in json)) return null as T;
  return json.data as T;
}

export async function register(name: string, email: string, password: string, badgeId = "") {
  const data = await request<AuthPayload>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password, badgeId }),
  });
  localStorage.setItem("token", data.token);
  return data;
}

export async function login(email: string, password: string) {
  const data = await request<AuthPayload>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem("token", data.token);
  return data;
}

export async function getCurrentOfficer() {
  return request<Officer>("/auth/me");
}

export function logout() {
  if (typeof window !== "undefined") localStorage.removeItem("token");
}

export function hasToken() {
  return Boolean(getToken());
}

export async function screenDocument(screenRequest: ScreeningRequest, onStep?: (stepIndex: number) => void) {
  onStep?.(0);
  const timers: ReturnType<typeof window.setTimeout>[] = [
    window.setTimeout(() => onStep?.(1), 500),
    window.setTimeout(() => onStep?.(2), 1400),
    window.setTimeout(() => onStep?.(3), 2300),
  ];

  try {
    const normalizedRequest: ScreeningRequest = {
      ...screenRequest,
      documentImageBase64: await imageSourceToDataUrl(screenRequest.documentImageBase64),
      liveFaceBase64: screenRequest.liveFaceBase64
        ? await imageSourceToDataUrl(screenRequest.liveFaceBase64)
        : undefined,
    };

    return await request<ScreeningResponse>("/screen", {
      method: "POST",
      body: JSON.stringify(normalizedRequest),
    });
  } finally {
    timers.forEach((timer) => window.clearTimeout(timer));
  }
}

export async function getHistory(params: {
  page?: number;
  limit?: number;
  recommendation?: string;
  mine?: boolean;
} = {}) {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.recommendation) search.set("recommendation", params.recommendation);
  if (params.mine) search.set("mine", "true");
  const suffix = search.toString() ? `?${search.toString()}` : "";
  return request<HistoryResponse>(`/history${suffix}`);
}

export async function getHistoryRecord(transactionId: string) {
  return request<HistoryRecord>(`/history/${encodeURIComponent(transactionId)}`);
}

export async function recordDecision(transactionId: string, decision: OfficerDecision) {
  return request<null>(`/history/${encodeURIComponent(transactionId)}/decision`, {
    method: "POST",
    body: JSON.stringify({ decision }),
  });
}

export async function getSettings() {
  return request<Settings>("/settings");
}

export async function updateSettings(settings: Partial<Settings>) {
  return request<null>("/settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
}
