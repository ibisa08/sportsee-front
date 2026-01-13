"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = useMemo(() => params.get("next") || "/dashboard", [params]);

  const [username, setUsername] = useState("sophiemartin");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Connexion impossible");
        setLoading(false);
        return;
      }

      router.push(next);
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.leftCol}>
        <div className={styles.logo}>
          <img src="/logo-sportsee.png" alt="SportSee" className={styles.logoImg} />
        </div>

        <div className={styles.card}>
          <h1 className={styles.title}>Transformez vos stats en résultats</h1>

          <form className={styles.form} onSubmit={onSubmit}>
            <div className={styles.formTitle}>Se connecter</div>

            <label className={styles.label}>
              Adresse email
              <input
                className={styles.input}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </label>

            <label className={styles.label}>
              Mot de passe
              <input
                className={styles.input}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </label>

            <button className={styles.btnPrimary} type="submit" disabled={loading}>
              {loading ? "Connexion..." : "Se connecter"}
            </button>

            {error && <p className={styles.error}>{error}</p>}

            <a className={styles.forgot} href="#">
              Mot de passe oublié ?
            </a>
          </form>
        </div>
      </section>

      <section className={styles.rightCol}>
        <div className={styles.bgImage} />
        <div className={styles.bubble}>
          Analysez vos performances en un clin d'œil, suivez vos progrès et atteignez vos objectifs.
        </div>
      </section>
    </main>
  );
}