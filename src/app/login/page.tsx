"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();

  const next = useMemo(() => params.get("next") || "/dashboard", [params]);

  // Le back attend username/password (même si la maquette affiche "Adresse email")
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
      {/* Colonne gauche (632 x 1024, padding top/bottom 55, left 100, gap 151) */}
      <section className={styles.leftCol}>
        <div className={styles.logo}>
          <span className={styles.logoIcon} aria-hidden="true" />
          <span className={styles.logoText}>SPORTSEE</span>
        </div>

        {/* Card login (398 x 617, radius 20, padding 40/40/80/40, gap 40) */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h1 className={styles.title}>Transformez vos stats en résultats</h1>
          </div>

          <form className={styles.form} onSubmit={onSubmit}>
            <div className={styles.formBlock}>
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
            </div>

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

      {/* Colonne droite (image 808 x 1024, left 632) */}
      <section className={styles.rightCol}>
        {/* Remplace login-bg.png par ton image dans /public */}
        <div className={styles.bgImage} />

        <div className={styles.bubble}>
          Analysez vos performances en un clin d'œil, suivez vos progrès et atteignez vos objectifs.
        </div>
      </section>
    </main>
  );
}