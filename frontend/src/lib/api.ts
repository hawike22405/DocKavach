import type { ScreeningRequest, ScreeningResponse, OfficerDecision } from "./types";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api").replace(/\/$/, "");

export type ApiResponse<T> = {
  success: boolean;
  data: T;
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

  return json.data;
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

export async function screenDocument(request: ScreeningRequest, onStep?: (stepIndex: number) => void) {
  // The backend performs all four modules synchronously. Keep the UI stepper
  // visible by advancing the four display states while the request is running.
  onStep?.(0);
  const progress = [1, 2, 3].map((step, index) =>
    window.setTimeout(() => onStep?.(step), 500 + index * 900)
  );

  try {
    return await requestApi<ScreeningResponse>("/screen", {
      method: "POST",
      body: JSON.stringify(request),
    });
  } finally {
    progress.forEach(window.clearTimeout);
  }
}

async function requestApi<T>(endpoint: string, init: RequestInit) {
  return request<T>(endpoint, init);
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
