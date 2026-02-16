"use client";

import { useState } from "react";

export default function TestAIPage() {
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  async function onSend() {
    setLoading(true);
    setError("");
    setAnswer("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Erreur inconnue");

      setAnswer(data.answer || "");
    } catch (err: any) {
      setError(err?.message || "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 720 }}>
      <h1>Test Coach AI</h1>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Pose une question au coach..."
        rows={4}
        style={{ width: "100%", marginTop: 12 }}
      />

      <button
        onClick={onSend}
        disabled={loading || !input.trim()}
        style={{ marginTop: 12, padding: "10px 14px" }}
      >
        {loading ? "Analyse..." : "Envoyer"}
      </button>

      {error && <p style={{ marginTop: 12 }}>Erreur: {error}</p>}
      {answer && (
        <div style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>
          <strong>Réponse :</strong>
          <p>{answer}</p>
        </div>
      )}
    </main>
  );
}