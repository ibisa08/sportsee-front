// src/app/dashboard/page.tsx  (fichier complet corrigé : props + data charts)
"use client";

import styles from "./dashboard.module.css";

import WeeklyDistanceChart from "@/components/charts/WeeklyDistanceChart";
import BpmChart from "@/components/charts/BpmChart";
import WeeklyGoalDonut from "@/components/charts/WeeklyGoalDonut";

import { useSportseeData } from "@/hooks/useSportseeData";
import { toWeeklyDistance } from "@/utils/activity";
import { toBpmByDay } from "@/utils/bpm";

type Session = {
  date: string;
  distance?: number;
  duration?: number;
  heartRate?: { min?: number; max?: number; average?: number };
};

function sum(list: Session[], key: "distance" | "duration") {
  return (list || []).reduce((acc, s) => acc + Number(s?.[key] ?? 0), 0);
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function formatMinutes(mins: number) {
  const m = Math.max(0, Math.round(mins));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h <= 0) return `${r} minutes`;
  return `${h}h ${String(r).padStart(2, "0")}min`;
}

export default function DashboardPage() {
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
            <h1 className={styles.h1}>Dashboard</h1>
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
            <h1 className={styles.h1}>Dashboard</h1>
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
            <h1 className={styles.h1}>Dashboard</h1>
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

  const sessions = ((activity as any) || []) as Session[];

  const weeklyBars = toWeeklyDistance(sessions as any); // -> [{ week:"S1", km:number }, ...]
  const bpmByDay = toBpmByDay(sessions as any); // -> [{ day:"Lun", min,max,avg }, ...]

  const weekDone = 4; // maquette
  const weekGoal = 6; // maquette

  const totalWeekMinutes = sum(sessions, "duration");
  const totalWeekKm = round1(sum(sessions, "distance"));

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
              <a className={styles.navItem} href="/coach-ai">
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

          {/* CTA + PROFIL bloc */}
          <section className={styles.topBlock}>
            <div className={styles.cta}>
              <div className={styles.ctaLeft}>
                <span className={styles.ctaIcon} aria-hidden="true">
                  ✦
                </span>
                <span>Posez vos questions sur votre programme, vos performances ou vos objectifs.</span>
              </div>
              <button className={styles.ctaBtn}>Lancer une conversation</button>
            </div>

            <div className={styles.profileHeader}>
              <div className={styles.profileLeft}>
                <div className={styles.avatarWrap}>
                  <img
                    src={userInfo.profile.profilePicture}
                    alt="Photo profil"
                    className={styles.avatarImg}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>

                <div className={styles.profileText}>
                  <div className={styles.profileName}>
                    {userInfo.profile.firstName} {userInfo.profile.lastName}
                  </div>
                  <div className={styles.profileMeta}>Membre depuis le {userInfo.profile.createdAt}</div>
                </div>
              </div>

              <div className={styles.profileRight}>
                <div className={styles.profileRightLabel}>Distance totale parcourue</div>
                <div className={styles.kpiBlue}>
                  <span className={styles.kpiIcon} aria-hidden="true" />
                  <span className={styles.kpiValue}>
                    {userInfo.statistics.totalDistance}
                    <span className={styles.kpiUnit}> km</span>
                  </span>
                </div>
              </div>
            </div>
          </section>

          <h2 className={styles.sectionTitle}>Vos dernières performances</h2>

          <section className={styles.graphRow}>
            <div className={styles.graphCard}>
              <div className={styles.graphHeader}>
                <div className={styles.graphTitleBlue}>18km en moyenne</div>
                <div className={styles.graphPill}>28 mai - 25 juin</div>
              </div>

              <div className={styles.graphSub}>Total des kilomètres 4 dernières semaines</div>

              {/* ✅ FIX: WeeklyDistanceChart attend "data" */}
              <WeeklyDistanceChart data={weeklyBars as any} />

              <div className={styles.graphLegend}>
                <span
                  style={{
                    display: "inline-block",
                    width: 6,
                    height: 6,
                    borderRadius: 99,
                    background: "#9DA7FB",
                    marginRight: 8,
                    verticalAlign: "middle",
                  }}
                />
                Km
              </div>
            </div>

            <div className={styles.graphCard}>
              <div className={styles.graphHeader}>
                <div className={styles.graphTitleRed}>163 BPM</div>
                <div className={styles.graphPill}>28 mai - 04 juin</div>
              </div>

              <div className={styles.graphSub}>Fréquence cardiaque moyenne</div>

              {/* ✅ FIX: BpmChart attend "data" */}
              <BpmChart data={bpmByDay as any} />

              <div className={styles.legendRow}>
                <span className={styles.legendItem}>
                  <span
                    style={{
                      display: "inline-block",
                      width: 6,
                      height: 6,
                      borderRadius: 99,
                      background: "rgba(242,72,62,0.35)",
                      marginRight: 8,
                    }}
                  />
                  Min
                </span>
                <span className={styles.legendItem}>
                  <span
                    style={{
                      display: "inline-block",
                      width: 6,
                      height: 6,
                      borderRadius: 99,
                      background: "#F2483E",
                      marginRight: 8,
                    }}
                  />
                  Max
                </span>
                <span className={styles.legendItem}>
                  <span
                    style={{
                      display: "inline-block",
                      width: 6,
                      height: 6,
                      borderRadius: 99,
                      background: "#0B23F4",
                      marginRight: 8,
                    }}
                  />
                  Max BPM
                </span>
              </div>
            </div>
          </section>

          <h2 className={styles.sectionTitle}>Cette semaine</h2>
          <div className={styles.sectionSub}>Du 23/06/2025 au 30/06/2025</div>

          <section className={styles.weekRow}>
            <div className={styles.graphCard}>
              <div className={styles.weekInfo}>
                <div className={styles.weekKpi}>
                  x{weekDone} <span className={styles.weekMuted}>sur objectif de</span> {weekGoal}
                </div>
                <div className={styles.weekSub}>Courses hebdomadaires réalisées</div>
              </div>

              <WeeklyGoalDonut done={weekDone} goal={weekGoal} />
            </div>

            <div className={styles.weekRight}>
              <div className={styles.smallCard}>
                <div className={styles.smallLabel}>Durée d’activité</div>
                <div className={styles.smallValueBlue}>{formatMinutes(totalWeekMinutes)}</div>
              </div>

              <div className={styles.smallCard}>
                <div className={styles.smallLabel}>Distance</div>
                <div className={styles.smallValueRed}>
                  {totalWeekKm} <span className={styles.smallUnit}>kilomètres</span>
                </div>
              </div>
            </div>
          </section>
        </div>

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