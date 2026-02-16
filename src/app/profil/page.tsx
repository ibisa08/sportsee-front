"use client";

import styles from "./profil.module.css";
import { useSportseeData } from "@/hooks/useSportseeData";

function formatMinutesToHM(totalMinutes: number) {
  const mins = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h <= 0) return `${m}min`;
  return `${h}h ${String(m).padStart(2, "0")}min`;
}

function toNumberSafe(v: unknown, fallback = 0) {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : fallback;
}

export default function ProfilPage() {
  const { userInfo, activity, loading, error, refresh } = useSportseeData();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.frame}>
          <div className={styles.content}>
            <h1 className={styles.h1}>Profil</h1>
            <p>Chargement…</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.page}>
        <div className={styles.frame}>
          <div className={styles.content}>
            <h1 className={styles.h1}>Profil</h1>
            <p className={styles.error}>Erreur : {error}</p>
            <div className={styles.actions}>
              <button className={styles.btnGhost} onClick={() => refresh()}>
                Rafraîchir
              </button>
              <button className={styles.btnGhost} onClick={logout}>
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!userInfo) {
    return (
      <main className={styles.page}>
        <div className={styles.frame}>
          <div className={styles.content}>
            <h1 className={styles.h1}>Profil</h1>
            <p>Aucune donnée utilisateur.</p>
            <div className={styles.actions}>
              <button className={styles.btnGhost} onClick={() => refresh()}>
                Rafraîchir
              </button>
              <button className={styles.btnGhost} onClick={logout}>
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Stats
  const totalDurationMin = toNumberSafe(userInfo.statistics.totalDuration);
  const totalSessions = toNumberSafe(userInfo.statistics.totalSessions);
  const totalDistance = userInfo.statistics.totalDistance;

  // calories: somme si dispo, sinon fallback
  const sessions = (activity as any[]) || [];
  const caloriesFromSessions = sessions.reduce((acc, s) => acc + toNumberSafe(s?.caloriesBurned, 0), 0);
  const calories = caloriesFromSessions > 0 ? caloriesFromSessions : 25000;

  const restDays = 9;

  const age = userInfo.profile.age ?? 29;
  const gender = "Femme";
  const height = userInfo.profile.height ? `${userInfo.profile.height}cm` : "1m68";
  const weight = userInfo.profile.weight ? `${userInfo.profile.weight}kg` : "58kg";

  return (
    <main className={styles.page}>
      <div className={styles.frame}>
        <div className={styles.content}>
          {/* HEADER */}
          <header className={styles.header}>
            <div className={styles.logoWrap}>
              <img src="/logo-sportsee.png" alt="SportSee" className={styles.logoImg} />
            </div>

            <nav className={styles.navPill} aria-label="Navigation principale">
              <a className={styles.navItem} href="/dashboard">
                Dashboard
              </a>
              <a className={styles.navItem} href="/coach-ai?returnTo=/profil">
                Coach AI
              </a>
              <a className={styles.navItem} href="/profil">
                Mon profil
              </a>
              <span className={styles.navDivider} />
              <button className={styles.navLogout} onClick={logout}>
                Se déconnecter
              </button>
            </nav>
          </header>

          {/* MAIN (Frame 2604: 1140 x 778, gap 57) */}
          <section className={styles.mainRow}>
            {/* LEFT (Frame 2594: 508 x 717, gap 16) */}
            <div className={styles.leftCol}>
              {/* Header profil (508 x 165, radius 10, padding 24/52/24/32, gap 24) */}
              <div className={styles.cardHeaderProfil}>
                <div className={styles.avatarWrap}>
                  <img
                    src={userInfo.profile.profilePicture}
                    alt="Photo profil"
                    className={styles.avatarImg}
                  />
                </div>

                <div className={styles.headerText}>
                  <div className={styles.userName}>
                    {userInfo.profile.firstName} {userInfo.profile.lastName}
                  </div>
                  <div className={styles.userMeta}>Membre depuis le {userInfo.profile.createdAt}</div>
                </div>
              </div>

              {/* Votre profil (508 x 331, radius 10, padding 40/28/60/28, gap 32) */}
              <div className={styles.cardYourProfil}>
                <div className={styles.cardTitle}>Votre profil</div>
                <div className={styles.divider} />

                <div className={styles.profileList}>
                  <div className={styles.profileLine}>
                    <span>Âge :</span> <strong>{age}</strong>
                  </div>
                  <div className={styles.profileLine}>
                    <span>Genre :</span> <strong>{gender}</strong>
                  </div>
                  <div className={styles.profileLine}>
                    <span>Taille :</span> <strong>{height}</strong>
                  </div>
                  <div className={styles.profileLine}>
                    <span>Poids :</span> <strong>{weight}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT (block 575 x 347, gap 19) */}
            <div className={styles.rightCol}>
              <div className={styles.statsTitleBlock}>
                <div className={styles.statsTitle}>Vos statistiques</div>
                <div className={styles.statsSub}>depuis le {userInfo.profile.createdAt}</div>
              </div>

              {/* KPI grid: 2 cols de 278 + gap 19 */}
              <div className={styles.kpiGrid}>
                <div className={styles.kpiTile}>
                  <div className={styles.kpiLabel}>Temps total couru</div>
                  <div className={styles.kpiValue}>{formatMinutesToHM(totalDurationMin)}</div>
                </div>

                <div className={styles.kpiTile}>
                  <div className={styles.kpiLabel}>Calories brûlées</div>
                  <div className={styles.kpiValue}>
                    {calories} <span className={styles.kpiUnit}>cal</span>
                  </div>
                </div>

                <div className={styles.kpiTile}>
                  <div className={styles.kpiLabel}>Distance totale parcourue</div>
                  <div className={styles.kpiValue}>
                    {totalDistance} <span className={styles.kpiUnit}>km</span>
                  </div>
                </div>

                <div className={styles.kpiTile}>
                  <div className={styles.kpiLabel}>Nombre de jours de repos</div>
                  <div className={styles.kpiValue}>
                    {restDays} <span className={styles.kpiUnit}>jours</span>
                  </div>
                </div>

                <div className={styles.kpiTile}>
                  <div className={styles.kpiLabel}>Nombre de sessions</div>
                  <div className={styles.kpiValue}>
                    {totalSessions} <span className={styles.kpiUnit}>sessions</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* FOOTER */}
        <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerLeft}>
            <span>©Sportsee</span>
            <span>Tous droits réservés</span>
          </div>

          <div className={styles.footerRight}>
            <a href="#">Conditions générales</a>
            <a href="#">Contact</a>
            <img src="/icon-logo.png" alt="" className={styles.footerIcon} />
          </div>
        </div>
        </footer>
      </div>
    </main>
  );
}