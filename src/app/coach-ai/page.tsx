"use client";

import { useRouter, useSearchParams } from "next/navigation";
import CoachChat from "@/components/ai/CoachChat";
import { useSportseeData } from "@/hooks/useSportseeData";

export default function CoachAIPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const safeReturnTo = returnTo && returnTo.startsWith("/") ? returnTo : null;
  const { userInfo } = useSportseeData();
  const ui = userInfo as any;

  // Essaye plusieurs chemins possibles selon ta structure de données
  const avatarUrl: string | undefined =
    ui?.profilePicture ??
    ui?.avatarUrl ??
    ui?.userInfos?.profilePicture ??
    ui?.userInfos?.avatarUrl ??
    ui?.profile?.profilePicture ??
    ui?.profile?.avatarUrl ??
    undefined;

  const resolvedUserId = Number(ui?.id ?? ui?.userId ?? 12) || 12;

  return (
    <main
        style={{
            minHeight: "100vh",
            background: "#6B6A8E",
            padding: "44px 16px",
            display: "flex",
            justifyContent: "center",
        }}
        >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 14,
            minHeight: "calc(100vh - 88px)",
            padding: "22px 22px 18px",
            position: "relative",
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (safeReturnTo) {
                router.push(safeReturnTo);
                return;
              }
            
              if (typeof window !== "undefined" && window.history.length > 1) {
                router.back();
                return;
              }
            
              router.push("/dashboard");
            }}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              border: "none",
              background: "transparent",
              color: "#707070",
              cursor: "pointer",
              fontSize: 14,
            }}
            aria-label="Fermer"
          >
            Fermer ×
          </button>

          <h1
            style={{
              textAlign: "center",
              color: "#2F2CF5",
              fontWeight: 700,
              fontSize: 22,
              lineHeight: "28px",
              margin: "64px 0 18px",
            }}
          >
            Posez vos questions sur votre programme,
            <br />
            vos performances ou vos objectifs
          </h1>

          <div style={{ height: "calc(100vh - 220px)" }}>
            <CoachChat userId={resolvedUserId} userAvatarUrl={avatarUrl} />
          </div>
        </div>
      </div>
    </main>
  );
}