"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { mockUserActivity, mockUserInfo } from "@/mocks/sportseeMock";

export type SportseeUserInfo = ReturnType<typeof mockUserInfo>;
export type SportseeUserActivity = ReturnType<typeof mockUserActivity>;
export type SportseeDataSource = "mock" | "api";

export type SportseeContextValue = {
  dataSource: SportseeDataSource;
  userInfo: SportseeUserInfo | null;
  activity: SportseeUserActivity | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const SportseeContext = createContext<SportseeContextValue | null>(null);

function getDataSource(): SportseeDataSource {
  const raw = process.env.NEXT_PUBLIC_DATA_SOURCE;
  return raw === "api" ? "api" : "mock";
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    cache: "no-store",
    credentials: "include", // IMPORTANT: envoie les cookies (sportsee_token)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(`${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`);
    (err as any).status = res.status;
    throw err;
  }

  return (await res.json()) as T;
}

export function SportseeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const dataSource = useMemo(() => getDataSource(), []);

  const [userInfo, setUserInfo] = useState<SportseeUserInfo | null>(null);
  const [activity, setActivity] = useState<SportseeUserActivity | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);

    try {
      if (dataSource === "mock") {
        setUserInfo(mockUserInfo());
        setActivity(mockUserActivity());
        return;
      }

      const [ui, act] = await Promise.all([
        fetchJson<SportseeUserInfo>("/api/sportsee/user-info"),
        fetchJson<SportseeUserActivity>("/api/sportsee/user-activity"),
      ]);

      setUserInfo(ui);
      setActivity(act);
    } catch (e: any) {
      if (e?.status === 401) {
        setUserInfo(null);
        setActivity(null);

        // redirection vers login seulement si on n'y est pas
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          window.location.replace("/login");
        }
        return;
      }

      setUserInfo(null);
      setActivity(null);
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Relancer automatiquement quand on change de route
  useEffect(() => {
    // Sur /login : on ne fetch pas (évite boucle 401), et on remet un état propre
    if (pathname === "/login") {
      setUserInfo(null);
      setActivity(null);
      setError(null);
      setLoading(false);
      return;
    }

    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const value: SportseeContextValue = {
    dataSource,
    userInfo,
    activity,
    loading,
    error,
    refresh,
  };

  // IMPORTANT: pas de JSX ici pour rester compatible .ts
  return React.createElement(SportseeContext.Provider, { value }, children);
}

export function useSportseeData(): SportseeContextValue {
  const ctx = useContext(SportseeContext);
  if (!ctx) throw new Error("useSportseeData must be used within <SportseeProvider>");
  return ctx;
}