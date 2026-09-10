"use client";

import { create } from "zustand";
import { login as apiLogin, register as apiRegister, getMe, logout as apiLogout, type Officer } from "@/lib/api";

interface AuthState {
  officer: Officer | null;
  loading: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, badgeId?: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  officer: null,
  loading: true,
  error: null,

  hydrate: async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      set({ loading: false, officer: null });
      return;
    }
    try {
      const officer = await getMe();
      set({ officer: officer as Officer, loading: false });
    } catch {
      localStorage.removeItem("token");
      set({ officer: null, loading: false });
    }
  },

  login: async (email, password) => {
    set({ error: null, loading: true });
    try {
      const data = await apiLogin(email, password);
      set({ officer: data.officer, loading: false });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Login failed";
      set({ error: msg, loading: false });
      throw e;
    }
  },

  register: async (name, email, password, badgeId) => {
    set({ error: null, loading: true });
    try {
      const data = await apiRegister(name, email, password, badgeId);
      set({ officer: data.officer, loading: false });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Registration failed";
      set({ error: msg, loading: false });
      throw e;
    }
  },

  logout: () => {
    apiLogout();
    set({ officer: null, loading: false });
  },

  clearError: () => set({ error: null }),
}));