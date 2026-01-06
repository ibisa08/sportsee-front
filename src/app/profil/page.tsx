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

  const totalDurationMin = toNumberSafe(userInfo.statistics.totalDuration);
  const totalSessions = toNumberSafe(userInfo.statistics.totalSessions);
  const totalDistance = userInfo.statistics.totalDistance;

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
          <header className={styles.header}>
            <div className={styles.logoWrap}>
              <div className={styles.logoMark} aria-hidden="true" />
              <div className={styles.logoText}>SPORTSEE</div>
            </div>

            <nav className={styles.navPill} aria-label="Navigation principale">
              <a className={styles.navItem} href="/dashboard">Dashboard</a>
              <a className={styles.navItem} href="/coach-ai">Coach AI</a>
              <a className={styles.navItem} href="/profil">Mon profil</a>
              <span className={styles.navDivider} />
              <button className={styles.navLogout} onClick={logout}>Se déconnecter</button>
            </nav>
          </header>

          <section className={styles.mainRow}>
            <div className={styles.leftCol}>
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

              <div className={styles.cardYourProfil}>
                <div className={styles.cardTitle}>Votre profil</div>
                <div className={styles.divider} />

                <div className={styles.profileList}>
                  <div className={styles.profileLine}><span>Âge :</span> <strong>{age}</strong></div>
                  <div className={styles.profileLine}><span>Genre :</span> <strong>{gender}</strong></div>
                  <div className={styles.profileLine}><span>Taille :</span> <strong>{height}</strong></div>
                  <div className={styles.profileLine}><span>Poids :</span> <strong>{weight}</strong></div>
                </div>
              </div>
            </div>

            <div className={styles.rightCol}>
              <div className={styles.statsTitleBlock}>
                <div className={styles.statsTitle}>Vos statistiques</div>
                <div className={styles.statsSub}>depuis le {userInfo.profile.createdAt}</div>
              </div>

              <div className={styles.kpiGrid}>
                <div className={styles.kpiTile}>
                  <div className={styles.kpiLabel}>Temps total couru</div>
                  <div className={styles.kpiValue}>{formatMinutesToHM(totalDurationMin)}</div>
                </div>

                <div className={styles.kpiTile}>
                  <div className={styles.kpiLabel}>Calories brûlées</div>
                  <div className={styles.kpiValue}>{calories} <span className={styles.kpiUnit}>cal</span></div>
                </div>

                <div className={styles.kpiTile}>
                  <div className={styles.kpiLabel}>Distance totale parcourue</div>
                  <div className={styles.kpiValue}>{totalDistance} <span className={styles.kpiUnit}>km</span></div>
                </div>

                <div className={styles.kpiTile}>
                  <div className={styles.kpiLabel}>Nombre de jours de repos</div>
                  <div className={styles.kpiValue}>{restDays} <span className={styles.kpiUnit}>jours</span></div>
                </div>

                <div className={styles.kpiTile}>
                  <div className={styles.kpiLabel}>Nombre de sessions</div>
                  <div className={styles.kpiValue}>{totalSessions} <span className={styles.kpiUnit}>sessions</span></div>
                </div>
              </div>
            </div>
          </section>

          <footer className={styles.footer}>
            <div className={styles.footerLeft}>
              <span>©Sportsee</span>
              <span>Tous droits réservés</span>
            </div>

            <div className={styles.footerRight}>
              <a href="#">Conditions générales</a>
              <a href="#">Contact</a>
              <span className={styles.footerMark} aria-hidden="true" />
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}