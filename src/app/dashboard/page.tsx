// src/app/dashboard/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import styles from "./dashboard.module.css";

import WeeklyDistanceChart from "@/components/charts/WeeklyDistanceChart";
import BpmChart, { BpmPoint } from "@/components/charts/BpmChart";
import WeeklyGoalDonut from "@/components/charts/WeeklyGoalDonut";
import { useSportseeData } from "@/hooks/useSportseeData";

// Helpers date (FR, mois en lettres, sans le point de "janv.")
const formatDayMonthFR = (d: Date) =>
  new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" })
    .format(d)
    .replace(/\./g, "");

const formatRangeDayMonthFR = (start: Date, end: Date) =>
  `${formatDayMonthFR(start)} - ${formatDayMonthFR(end)}`;

const formatDayMonthYearFR = (d: Date) =>
  new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
    .format(d)
    .replace(/\./g, "");

const formatRangeDayMonthYearFR = (start: Date, end: Date) =>
  `Du ${formatDayMonthYearFR(start)} au ${formatDayMonthYearFR(end)}`;

type KmBar = {
  label: string; // "S1"..."S4"
  km: number;
  start: Date;
  end: Date;
};

type KmBlock = {
  start: Date;
  end: Date;
  bars: KmBar[];
};

type BpmBlock = {
  start: Date;
  end: Date;
  days: BpmPoint[];
};

const KM_BLOCKS: KmBlock[] = [
  {
    start: new Date(2024, 11, 30),
    end: new Date(2025, 0, 26),
    bars: [
      { label: "S1", km: 9.1, start: new Date(2024, 11, 30), end: new Date(2025, 0, 5) },
      { label: "S2", km: 13.9, start: new Date(2025, 0, 6), end: new Date(2025, 0, 12) },
      { label: "S3", km: 4.8, start: new Date(2025, 0, 13), end: new Date(2025, 0, 19) },
      { label: "S4", km: 8.7, start: new Date(2025, 0, 20), end: new Date(2025, 0, 26) },
    ],
  },
  {
    start: new Date(2024, 11, 16),
    end: new Date(2025, 0, 12),
    bars: [
      { label: "S1", km: 0.0, start: new Date(2024, 11, 16), end: new Date(2024, 11, 22) },
      { label: "S2", km: 8.9, start: new Date(2024, 11, 23), end: new Date(2024, 11, 29) },
      { label: "S3", km: 13.9, start: new Date(2024, 11, 30), end: new Date(2025, 0, 5) },
      { label: "S4", km: 4.8, start: new Date(2025, 0, 6), end: new Date(2025, 0, 12) },
    ],
  },
  {
    start: new Date(2024, 11, 9),
    end: new Date(2025, 0, 5),
    bars: [
      { label: "S1", km: 0.0, start: new Date(2024, 11, 9), end: new Date(2024, 11, 15) },
      { label: "S2", km: 0.0, start: new Date(2024, 11, 16), end: new Date(2024, 11, 22) },
      { label: "S3", km: 0.0, start: new Date(2024, 11, 23), end: new Date(2024, 11, 29) },
      { label: "S4", km: 8.9, start: new Date(2024, 11, 30), end: new Date(2025, 0, 5) },
    ],
  },
];

const BPM_BLOCKS: BpmBlock[] = [
  {
    start: new Date(2025, 0, 20),
    end: new Date(2025, 0, 26),
    days: [
      { day: "Lun", min: 138, max: 176, avg: 165 },
      { day: "Mar", min: 140, max: 179, avg: 168 },
      { day: "Mer", min: 145, max: 184, avg: 169 },
      { day: "Jeu", min: 140, max: 177, avg: 165 },
      { day: "Ven", min: 133, max: 172, avg: 170 },
      { day: "Sam", min: 145, max: 168, avg: 162 },
      { day: "Dim", min: 133, max: 179, avg: 168 },
    ],
  },
  {
    start: new Date(2025, 0, 6),
    end: new Date(2025, 0, 12),
    days: [
      { day: "Lun", min: 140, max: 175, avg: 165 },
      { day: "Mar", min: 142, max: 178, avg: 170 },
      { day: "Mer", min: 145, max: 185, avg: 172 },
      { day: "Jeu", min: 142, max: 180, avg: 168 },
      { day: "Ven", min: 135, max: 176, avg: 172 },
      { day: "Sam", min: 147, max: 169, avg: 162 },
      { day: "Dim", min: 135, max: 180, avg: 170 },
    ],
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { userInfo, dataSource } = useSportseeData();
  const ui = userInfo as any;

  const [kmIndex, setKmIndex] = useState<number>(0);
  const [bpmIndex, setBpmIndex] = useState<number>(0);

  const kmBlock = KM_BLOCKS[kmIndex] ?? KM_BLOCKS[0];
  const bpmBlock = BPM_BLOCKS[bpmIndex] ?? BPM_BLOCKS[0];

  const kmRangeLabel = useMemo(() => formatRangeDayMonthFR(kmBlock.start, kmBlock.end), [kmBlock]);
  const bpmRangeLabel = useMemo(
    () => formatRangeDayMonthFR(bpmBlock.start, bpmBlock.end),
    [bpmBlock],
  );

  const avgKm = useMemo(() => {
    const vals = kmBlock.bars.map((b) => b.km).filter((n) => Number.isFinite(n));
    if (!vals.length) return 0;
    const sum = vals.reduce((a, b) => a + b, 0);
    return Math.round((sum / vals.length) * 10) / 10;
  }, [kmBlock]);

  const avgBpm = useMemo(() => {
    const vals = bpmBlock.days.map((d) => d.avg).filter((n) => Number.isFinite(n));
    if (!vals.length) return 0;
    const sum = vals.reduce((a, b) => a + b, 0);
    return Math.round(sum / vals.length);
  }, [bpmBlock]);

  // UserInfo (fallbacks sûrs) — cast en `any` (api/mock)
  const firstName = ui?.profile?.firstName ?? ui?.firstName ?? ui?.user?.firstName ?? "Sophie";
  const lastName = ui?.profile?.lastName ?? ui?.lastName ?? ui?.user?.lastName ?? "Martin";

  const memberSinceRaw =
    ui?.profile?.memberSince ??
    ui?.memberSince ??
    ui?.profile?.createdAt ??
    ui?.createdAt ??
    "2025-01-01";

  const memberSinceDate = new Date(memberSinceRaw);
  const memberSinceLabel = `Membre depuis le ${formatDayMonthYearFR(memberSinceDate)}`;

  const totalDistanceRaw =
    ui?.statistics?.totalDistance ??
    ui?.statistics?.distanceTotal ??
    ui?.statistics?.totalDistanceKm ??
    ui?.totalDistance ??
    ui?.distanceTotal ??
    ui?.distance ??
    2250.2;

  const totalDistanceNum = Number(totalDistanceRaw);
  const totalDistanceStr = (Number.isFinite(totalDistanceNum) ? totalDistanceNum : 0)
    .toFixed(1)
    .replace(".", ",");

  const avatarUrl =
    ui?.profile?.profilePicture ?? ui?.profile?.avatarUrl ?? ui?.avatarUrl ?? "/sophie.jpg";

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    } finally {
      router.replace("/login");
    }
  };

  // NOTE: logique identique à ton code actuel (tu ajustes ensuite si tu veux inverser le sens)
  const handlePrevKm = () => setKmIndex((v) => (v + 1 >= KM_BLOCKS.length ? v : v + 1));
  const handleNextKm = () => setKmIndex((v) => (v - 1 < 0 ? v : v - 1));

  const handlePrevBpm = () => setBpmIndex((v) => (v + 1 >= BPM_BLOCKS.length ? v : v + 1));
  const handleNextBpm = () => setBpmIndex((v) => (v - 1 < 0 ? v : v - 1));

  // “Cette semaine” (démo)
  const thisWeekStart = new Date(2025, 0, 20);
  const thisWeekEnd = new Date(2025, 0, 26);
  const weekRangeLabel = formatRangeDayMonthYearFR(thisWeekStart, thisWeekEnd);

  const weekDone = 1;
  const weekGoal = 6;
  const totalWeekMinutes = 32;
  const totalWeekKm = 4.8;

  return (
    <main className={styles.page}>
      <div className={styles.frame}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.logoWrap}>
            <img src="/logo-sportsee.png" alt="SportSee" className={styles.logoImg} />
          </div>

          <nav className={styles.navPill} aria-label="Navigation principale">
            <Link className={styles.navItem} href="/dashboard">
              Dashboard
            </Link>
            <Link className={styles.navItem} href="/coach-ai">
              Coach AI
            </Link>
            <Link className={styles.navItem} href="/profil">
              Mon profil
            </Link>
            <span className={styles.navDivider} aria-hidden="true" />
            <button className={styles.navLogout} onClick={handleLogout} type="button">
              Se déconnecter
            </button>
          </nav>
        </header>

        {/* (debug) Source */}
        <div style={{ fontSize: 12, color: "#111111", marginBottom: 8 }}>Source: {dataSource}</div>

        {/* Bande question */}
        <section className={styles.topBlock}>
          <div >
            <img src="Icone AI.png" alt="" className={styles.aiMark} aria-hidden="true" />
            <span>Posez vos questions sur votre programme, vos performances ou vos objectifs.</span>
          </div>

          <button className={styles.primaryBtn} type="button">
            Lancer une conversation
          </button>
        </section>

        {/* Carte profil */}
        <section className={styles.profileCard}>
          <div className={styles.profileLeft}>
            <div className={styles.avatarWrap}>
              <img src={avatarUrl} alt="Photo profil" className={styles.avatar} />
            </div>

            <div className={styles.profileMeta}>
              <div className={styles.profileName}>
                {firstName} {lastName}
              </div>
              <div className={styles.profilSince}>{memberSinceLabel}</div>
            </div>
          </div>

          <div className={styles.profileRight}>
            <div className={styles.profileRightLabel}>Distance totale parcourue</div>

            <div className={styles.kpiPill}>
              <img src="/OUTLINE.png" alt="" className={styles.kpiIcon} aria-hidden="true" />
              <span className={styles.kpiValue}>{totalDistanceStr}</span>
              <span className={styles.kpiUnit}>km</span>
            </div>
          </div>
        </section>

        {/* Graphs */}
        <h2 className={styles.sectionTitle}>Vos dernières performances</h2>

        <section className={styles.graphRow}>
          {/* Stats Km */}
          <div className={styles.graphCard}>
            <div className={styles.graphHeader}>
              <div>
                <div className={styles.graphTitleBlue}>{avgKm}km en moyenne</div>
                <div className={styles.graphSub}>Total des kilomètres 4 dernières semaines</div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  className={styles.navCircle}
                  type="button"
                  onClick={handlePrevKm}
                  aria-label="Période précédente"
                >
                  ‹
                </button>
                <div className={styles.graphPill}>{kmRangeLabel}</div>
                <button
                  className={styles.navCircle}
                  type="button"
                  onClick={handleNextKm}
                  aria-label="Période suivante"
                >
                  ›
                </button>
              </div>
            </div>

            <WeeklyDistanceChart
              data={
                kmBlock.bars.map((b) => ({
                  label: b.label,
                  km: b.km,
                  start: b.start,
                  end: b.end,
                })) as any
              }
            />

            <div className={styles.graphLegend} style={{ marginTop: 6 }}>
              <span className={styles.graphLegendDot} aria-hidden="true" />
              Km
            </div>
          </div>

          {/* Stats BPM */}
          <div className={styles.graphCard}>
            <div className={styles.graphHeader}>
              <div>
                <div className={styles.graphTitleRed}>{avgBpm} BPM</div>
                <div className={styles.graphSub}>Fréquence cardiaque moyenne</div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  className={styles.navCircle}
                  type="button"
                  onClick={handlePrevBpm}
                  aria-label="Période précédente"
                >
                  ‹
                </button>
                <div className={styles.graphPill}>{bpmRangeLabel}</div>
                <button
                  className={styles.navCircle}
                  type="button"
                  onClick={handleNextBpm}
                  aria-label="Période suivante"
                >
                  ›
                </button>
              </div>
            </div>

            {/* IMPORTANT: prop = data */}
            <BpmChart data={bpmBlock.days} />

            <div className={styles.legendRow}>
              <span className={styles.legendItem}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 99,
                    background: "rgba(242,114,98,0.35)",
                    display: "inline-block",
                  }}
                />
                Min
              </span>
              <span className={styles.legendItem}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 99,
                    background: "#F4320B",
                    display: "inline-block",
                  }}
                />
                Max BPM
              </span>
              <span className={styles.legendItem}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 99,
                    background: "#0B23F4",
                    display: "inline-block",
                  }}
                />
                Max BPM
              </span>
            </div>
          </div>
        </section>

        {/* Cette semaine */}
        <h2 className={styles.sectionTitle}>Cette semaine</h2>
        <div className={styles.sectionSub}>{weekRangeLabel}</div>

        <section className={styles.weekRow}>
          <div className={styles.weekCard}>
            <div className={styles.weekKpi}>
              <span className={styles.weekDone}>x{weekDone}</span>
              <span className={styles.weekMuted}>sur objectif de</span>
              <span className={styles.weekGoal}>{weekGoal}</span>
            </div>
            <div className={styles.weekSub}>Courses hebdomadaire réalisées</div>

            <div style={{ marginTop: 10 }}>
              <WeeklyGoalDonut done={weekDone} goal={weekGoal} />
            </div>
          </div>

          <div className={styles.weekRight}>
            <div className={styles.smallCard}>
              <div className={styles.smallLabel}>Durée d’activité</div>
              <div className={styles.smallValueBlue}>
                {totalWeekMinutes} <span className={styles.smallUnit}>min</span>
              </div>
            </div>

            <div className={styles.smallCard}>
              <div className={styles.smallLabel}>Distance</div>
              <div className={styles.smallValueRed}>
                {String(totalWeekKm).replace(".", ",")}
                <span className={styles.smallUnit}>kilomètres</span>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
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