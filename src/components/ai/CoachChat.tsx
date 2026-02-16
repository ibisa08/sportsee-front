"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type CoachChatProps = {
  userId?: number;
  userAvatarUrl?: string;
  suggestions?: string[];
};

function uid() {
  return Math.random().toString(36).slice(2);
}

// Nettoie le Markdown / la numérotation résiduelle + harmonise l'affichage
function cleanAssistantText(text: string) {
  const raw = String(text ?? "").replace(/\r\n/g, "\n");

  let out = raw
    // remove common markdown
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]*)`/g, "$1");

  // Remove leading numbering like "(1)" or "1)" or "1."
  out = out
    .replace(/^\s*\(\d+\)\s*/gm, "")
    .replace(/^\s*\d+\)\s*/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "• ");

  // Convert dashed lists to bullets
  out = out.replace(/^\s*-\s+/gm, "• ");

  // Force a line break before emojis so each emoji item appears on its own line
  // (matches the mockups when the model returns inline emoji sequences)
  out = out.replace(/([^\n])\s+(?=\p{Extended_Pictographic})/gu, "$1\n");

  // Cleanup spaces before newlines
  out = out.replace(/[\t ]+\n/g, "\n");

  // Collapse extra blank lines
  out = out.replace(/\n{3,}/g, "\n\n").trim();

  return out;
}

const DEFAULT_SUGGESTIONS = [
  "Comment améliorer mon endurance ?",
  "Que signifie mon score de récupération ?",
  "Peux-tu m'expliquer mon dernier graphique ?",
];

export default function CoachChat({
  userId,
  userAvatarUrl,
  suggestions = DEFAULT_SUGGESTIONS,
}: CoachChatProps) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const canSend = useMemo(() => {
    const v = input.trim();
    return v.length > 0 && v.length <= 600 && !isLoading;
  }, [input, isLoading]);

  async function callApi(
    message: string,
    history: Array<{ role: "user" | "assistant"; content: string }>
  ) {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, userId, history }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Erreur lors de la génération.");

    const answer = String(data?.answer ?? "").trim();
    return answer || "Je n’ai pas pu répondre. Réessaie.";
  }

  async function send(message: string) {
    const content = message.trim();
    if (!content || content.length > 600 || isLoading) return;

    setError("");
    setIsLoading(true);

    // Historique AVANT le message courant (évite doublon côté backend)
    const history = messages.slice(-8).map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, { id: uid(), role: "user", content }]);

    try {
      const answer = await callApi(content, history);
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "assistant", content: cleanAssistantText(answer) },
      ]);
    } catch (e: any) {
      setError(e?.message || "Erreur inconnue.");
    } finally {
      setIsLoading(false);
    }
  }

  async function onSendFromInput() {
    const content = input.trim();
    if (!content) return;
    setInput("");
    await send(content);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Entrée = envoyer, Shift+Entrée = nouvelle ligne
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void onSendFromInput();
    }
  }

  function onSuggestionClick(s: string) {
    void send(s);
  }

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        gap: 14,
      }}
    >
      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "6px 6px 0",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {messages.map((m) => {
          const isUser = m.role === "user";
          return (
            <div
              key={m.id}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: isUser ? "flex-end" : "center",
              }}
            >
              {isUser ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, maxWidth: 720 }}>
                  <div
                    style={{
                      background: "#FCE7E7",
                      borderRadius: 18,
                      padding: "10px 14px",
                      whiteSpace: "pre-wrap",
                      color: "#222",
                      fontSize: 14,
                      lineHeight: "20px",
                      maxWidth: 520,
                    }}
                  >
                    {m.content}
                  </div>

                  {userAvatarUrl ? (
                    <img
                      src={userAvatarUrl}
                      alt=""
                      aria-hidden="true"
                      style={{ width: 28, height: 28, borderRadius: 999, objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 999,
                        background: "#EAEAEA",
                        display: "grid",
                        placeItems: "center",
                        fontSize: 12,
                        color: "#666",
                      }}
                    >
                      U
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ width: "100%", maxWidth: 560, display: "flex", gap: 10 }}>
                  <div
                    aria-hidden="true"
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 999,
                      background: "#FF3B30",
                      display: "grid",
                      placeItems: "center",
                      color: "#fff",
                      fontSize: 12,
                      flex: "0 0 auto",
                      marginTop: 6,
                    }}
                  >
                    ✦
                  </div>

                  <div
                    style={{
                      flex: 1,
                      background: "#EFEFEF",
                      borderRadius: 14,
                      padding: "14px 16px",
                      color: "#222",
                      whiteSpace: "pre-wrap",
                      fontSize: 14,
                      lineHeight: "20px",
                    }}
                  >
                    <div style={{ fontSize: 12, color: "#707070", marginBottom: 6 }}>Coach AI</div>
                    {m.content}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Loader : points animés (conforme maquette) */}
        {isLoading && (
          <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
            <div style={{ width: "100%", maxWidth: 560, display: "flex", gap: 10, alignItems: "center" }}>
              <div
                aria-hidden="true"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  background: "#FF3B30",
                  display: "grid",
                  placeItems: "center",
                  color: "#fff",
                  fontSize: 12,
                  flex: "0 0 auto",
                }}
              >
                ✦
              </div>

              <div className="typingBubble" role="status" aria-label="Coach AI est en train d'écrire">
                <span className="typingDot d1" />
                <span className="typingDot d2" />
                <span className="typingDot d3" />
                <span className="typingDot d4" />
              </div>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input + Suggestions */}
      <div style={{ width: "100%", maxWidth: 780, margin: "0 auto" }}>
        {error && <div style={{ color: "#B00020", fontSize: 12, marginBottom: 8 }}>{error}</div>}

        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            gap: 10,
            background: "#FFFFFF",
            border: "1px solid #E6E6E6",
            borderRadius: 10,
            padding: 10,
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width: 26,
              height: 26,
              borderRadius: 999,
              background: "#FDECEC",
              display: "grid",
              placeItems: "center",
              color: "#FF3B30",
              fontSize: 12,
              marginTop: 2,
              flex: "0 0 auto",
            }}
          >
            ✦
          </div>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Comment puis-je vous aider ?"
            rows={2}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              resize: "none",
              fontSize: 14,
              lineHeight: "20px",
              padding: "2px 0",
            }}
          />

          <button
            type="button"
            disabled={!canSend}
            onClick={() => void onSendFromInput()}
            aria-label="Envoyer"
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              border: "none",
              background: canSend ? "#2F2CF5" : "#D9D9D9",
              color: "#fff",
              cursor: canSend ? "pointer" : "not-allowed",
              display: "grid",
              placeItems: "center",
              fontSize: 18,
              flex: "0 0 auto",
            }}
          >
            ↑
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 12,
            marginTop: 12,
          }}
        >
          {suggestions.slice(0, 3).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSuggestionClick(s)}
              disabled={isLoading}
              style={{
                textAlign: "left",
                padding: "12px 12px",
                borderRadius: 10,
                border: "1px solid #EFEFEF",
                background: "#F6F6FF",
                color: "#666",
                fontSize: 12,
                lineHeight: "16px",
                cursor: isLoading ? "not-allowed" : "pointer",
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 12, color: "#707070", marginTop: 8 }}>Limite : 600 caractères.</div>

        <style jsx global>{`
          .typingBubble {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: transparent;
            padding: 0;
            min-height: 24px;
          }

          .typingDot {
            width: 12px;
            height: 12px;
            border-radius: 999px;
            background: #f3b1b1;
            opacity: 0.45;
            animation: coachTypingPulse 1.2s infinite ease-in-out;
          }

          .typingDot.d1 { animation-delay: 0s; }
          .typingDot.d2 { animation-delay: 0.15s; }
          .typingDot.d3 { animation-delay: 0.3s; }
          .typingDot.d4 { animation-delay: 0.45s; }

          @keyframes coachTypingPulse {
            0%,
            80%,
            100% {
              transform: translateY(0);
              opacity: 0.45;
            }
            40% {
              transform: translateY(-6px);
              opacity: 1;
            }
          }
        `}</style>
      </div>
    </div>
  );
}