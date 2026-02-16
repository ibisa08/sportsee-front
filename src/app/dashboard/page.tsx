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

  // Calendar AI (planning) widget
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarStep, setCalendarStep] = useState<0 | 1 | 2 | 3>(0);
  const [calendarObjective, setCalendarObjective] = useState("");
  const [calendarStartDate, setCalendarStartDate] = useState<string>("");
  const [calendarWeeks, setCalendarWeeks] = useState<
    Array<{ title: string; sessions: Array<{ day: string; title: string; details: string; duration: string }> }>
  >([]);
  const [expandedWeeks, setExpandedWeeks] = useState<number[]>([0]);

  const toggleExpandedWeek = (index: number) => {
    setExpandedWeeks((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  // plan complet + loading + error
  const [calendarPlan, setCalendarPlan] = useState<any>(null);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState("");
  const [isExportOpen, setIsExportOpen] = useState(false);

  const openCalendar = () => {
    setIsCalendarOpen(true);
    setCalendarObjective("");
    setCalendarStartDate("");
    setCalendarWeeks([]);
    setExpandedWeeks([0]);
    setCalendarPlan(null);
    setCalendarError("");
    setCalendarStep(1);
  };

  const closeCalendar = () => {
    setIsCalendarOpen(false);
    setCalendarError("");
    setCalendarStep(1);
  };

  // Génération via API /api/training-plan
  const generatePlan = async () => {
    try {
      setCalendarLoading(true);
      setCalendarError("");

      const res = await fetch("/api/training-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: ui?.id ?? 12,
          objective: calendarObjective,
          startDate: calendarStartDate,
          preferredStartTime: "18:00",
          availabilityDays: ["Lundi", "Mercredi", "Vendredi"],
          sportseeSummary: {
            profile: {
              firstName: firstName,
              age: ui?.profile?.age ?? ui?.age ?? null,
            },
            totals: {
              totalDistanceKm: Number(totalDistanceRaw) || null,
            },
            last10: [],
          },
        }),
      });

      const plan = await res.json();
      if (!res.ok) throw new Error(plan?.message || plan?.error || "Erreur génération plan");

      setCalendarPlan(plan);

      // Map backend plan -> UI (accordéon) + ✅ jour de semaine FR au lieu de YYYY-MM-DD
      setCalendarWeeks(
        (plan.weeks || []).map((w: any) => ({
          title: w.title,
          sessions: (w.sessions || []).map((s: any) => ({
            day: (() => {
              try {
                const d = new Date(`${s.date}T00:00:00`);
                const wd = new Intl.DateTimeFormat("fr-FR", { weekday: "long" }).format(d);
                return wd.charAt(0).toUpperCase() + wd.slice(1);
              } catch {
                return s.date;
              }
            })(),
            title: s.title,
            details: (() => {
              const main = (s.details?.main || s.sessionGoal || "").toString();
              const intensity = (s.intensity || "").toString().trim();
              if (!intensity) return main;
              return `${main} (Intensité: ${intensity})`;
            })(),
            duration: s.durationMinutes
              ? `${s.durationMinutes}min`
              : s.targetDistanceKm
                ? `${s.targetDistanceKm}km`
                : "",
          })),
        }))
      );

      setExpandedWeeks([0]);
      setCalendarStep(3);
    } catch (e: any) {
      setCalendarError(e?.message || "Erreur");
      setCalendarPlan(null);
    } finally {
      setCalendarLoading(false);
    }
  };

  // Télécharger ICS via /api/training-plan/ics
  const downloadIcs = async () => {
    if (!calendarPlan) return;

    const res = await fetch("/api/training-plan/ics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: calendarPlan }),
    });

    const icsText = await res.text();
    const blob = new Blob([icsText], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "sportsee-planning.ics";
    a.click();

    URL.revokeObjectURL(url);
  };

  const exportTo = async (target: "ics" | "apple" | "google" | "outlook") => {
    if (!calendarPlan) return;

    await downloadIcs();

    if (target === "google") {
      window.open("https://calendar.google.com", "_blank", "noopener,noreferrer");
    }
    if (target === "outlook") {
      window.open("https://outlook.live.com/calendar/", "_blank", "noopener,noreferrer");
    }

    setIsExportOpen(false);
  };

  const kmBlock = KM_BLOCKS[kmIndex] ?? KM_BLOCKS[0];
  const bpmBlock = BPM_BLOCKS[bpmIndex] ?? BPM_BLOCKS[0];

  const kmRangeLabel = useMemo(() => formatRangeDayMonthFR(kmBlock.start, kmBlock.end), [kmBlock]);
  const bpmRangeLabel = useMemo(() => formatRangeDayMonthFR(bpmBlock.start, bpmBlock.end), [bpmBlock]);

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
        <header className={styles.header}>
          <div className={styles.logoWrap}>
            <img src="/logo-sportsee.png" alt="SportSee" className={styles.logoImg} />
          </div>

          <nav className={styles.navPill} aria-label="Navigation principale">
            <Link className={styles.navItem} href="/dashboard">Dashboard</Link>
            <Link className={styles.navItem} href="/coach-ai?returnTo=/dashboard">Coach AI</Link>
            <Link className={styles.navItem} href="/profil">Mon profil</Link>
            <span className={styles.navDivider} aria-hidden="true" />
            <button className={styles.navLogout} onClick={handleLogout} type="button">
              Se déconnecter
            </button>
          </nav>
        </header>

        <div style={{ fontSize: 12, color: "#111111", marginBottom: 8 }}>Source: {dataSource}</div>

        <section className={styles.topBlock}>
          <div>
            <img src="/Icone-AI.png" alt="" className={styles.aiMark} aria-hidden="true" />
            <span>Posez vos questions sur votre programme, vos performances ou vos objectifs.</span>
          </div>

          <button
            className={styles.primaryBtn}
            type="button"
            onClick={() => router.push("/coach-ai?returnTo=/dashboard")}
          >
            Lancer une conversation
          </button>
        </section>

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

        <h2 className={styles.sectionTitle}>Vos dernières performances</h2>

        <section className={styles.graphRow}>
          <div className={styles.graphCard}>
            <div className={styles.graphHeader}>
              <div>
                <div className={styles.graphTitleBlue}>{avgKm}km en moyenne</div>
                <div className={styles.graphSub}>Total des kilomètres 4 dernières semaines</div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button className={styles.navCircle} type="button" onClick={handlePrevKm} aria-label="Période précédente">‹</button>
                <div className={styles.graphPill}>{kmRangeLabel}</div>
                <button className={styles.navCircle} type="button" onClick={handleNextKm} aria-label="Période suivante">›</button>
              </div>
            </div>

            <WeeklyDistanceChart
              data={kmBlock.bars.map((b) => ({ label: b.label, km: b.km, start: b.start, end: b.end })) as any}
            />

            <div className={styles.graphLegend} style={{ marginTop: 6 }}>
              <span className={styles.graphLegendDot} aria-hidden="true" />
              Km
            </div>
          </div>

          <div className={styles.graphCard}>
            <div className={styles.graphHeader}>
              <div>
                <div className={styles.graphTitleRed}>{avgBpm} BPM</div>
                <div className={styles.graphSub}>Fréquence cardiaque moyenne</div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button className={styles.navCircle} type="button" onClick={handlePrevBpm} aria-label="Période précédente">‹</button>
                <div className={styles.graphPill}>{bpmRangeLabel}</div>
                <button className={styles.navCircle} type="button" onClick={handleNextBpm} aria-label="Période suivante">›</button>
              </div>
            </div>
            <BpmChart data={bpmBlock.days} />

            <div className={styles.legendRow}>
              <span className={styles.legendItem}><span style={{ width: 6, height: 6, borderRadius: 99, background: "rgba(242,114,98,0.35)", display: "inline-block" }} />Min</span>
              <span className={styles.legendItem}><span style={{ width: 6, height: 6, borderRadius: 99, background: "#F4320B", display: "inline-block" }} />Max BPM</span>
              <span className={styles.legendItem}><span style={{ width: 6, height: 6, borderRadius: 99, background: "#0B23F4", display: "inline-block" }} />Max BPM</span>
            </div>
          </div>
        </section>

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

        {/* Calendar AI */}
        <section className={styles.calendarAiCard} aria-label="Calendar AI">
          <div className={styles.calendarAiSurface}>
            {!isCalendarOpen ? (
              <div className={styles.calendarAiInner}>
                <div className={styles.modalCardIcon} aria-hidden="true">
                      <img src="/icons/calendar-ai.svg" alt="" />
                    </div>
                <h2 className={styles.calendarAiTitle}>Créez votre planning d'entraînement intelligent</h2>
                <p className={styles.calendarAiDesc}>
                  Notre IA vous aide à bâtir un planning 100% personnalisé selon vos objectifs, votre niveau et votre emploi du temps.
                </p>
                <button type="button" className={styles.calendarAiBtn} onClick={openCalendar}>
                  Commencer
                </button>
              </div>
            ) : (
              <div className={styles.calendarAiWizard}>
                {calendarStep === 1 && (
                  <div className={styles.modalCard}>
                    <div className={styles.modalCardIcon} aria-hidden="true">
                      <img src="/icons/target.svg" alt="" />
                    </div>
                    <h3 className={styles.modalCardTitle}>Quel est votre objectif principal ?</h3>
                    <p className={styles.modalCardDesc}>Choisissez l'objectif qui vous motive le plus</p>

                    <label className={styles.modalLabel} htmlFor="calendarObjective">Objectif</label>
                    <input
                      id="calendarObjective"
                      className={styles.modalInput}
                      value={calendarObjective}
                      onChange={(e) => setCalendarObjective(e.target.value)}
                      placeholder=""
                    />

                    <button
                      type="button"
                      className={styles.modalPrimaryBtn}
                      onClick={() => setCalendarStep(2)}
                      disabled={!calendarObjective.trim()}
                    >
                      Suivant
                    </button>
                  </div>
                )}

                {calendarStep === 2 && (
                  <div className={styles.modalCard}>
                    <div className={styles.modalCardIcon} aria-hidden="true">
                      <img src="/icons/calendar-ai.svg" alt="" />
                    </div>
                    <h3 className={styles.modalCardTitle}>Quand souhaitez-vous commencer votre programme ?</h3>
                    <p className={styles.modalCardDesc}>
                      Générez un programme d'une semaine à partir de la date de votre choix
                    </p>

                    <label className={styles.modalLabel} htmlFor="calendarStartDate">Date de début</label>
                    <input
                      id="calendarStartDate"
                      type="date"
                      className={styles.modalInput}
                      value={calendarStartDate}
                      onChange={(e) => setCalendarStartDate(e.target.value)}
                    />

                    <div className={styles.modalStepActions}>
                      <button type="button" className={styles.modalBackBtn} onClick={() => setCalendarStep(1)} aria-label="Retour">←</button>
                      <button type="button" className={styles.modalPrimaryBtn} onClick={generatePlan} disabled={!calendarStartDate || calendarLoading}>
                        {calendarLoading ? "Génération…" : "Générer mon planning"}
                      </button>
                    </div>

                    {calendarError && (
                      <p className={styles.modalCardDesc} style={{ color: "#B00020", marginTop: 12 }}>
                        {calendarError}
                      </p>
                    )}
                  </div>
                )}

                {calendarStep === 3 && (
                  <div className={styles.modalPlan}>
                    <h3 className={styles.modalPlanTitle}>Votre planning de la semaine</h3>
                    <p className={styles.modalPlanSubtitle}>Important pour définir un programme adapté</p>

                    {Array.isArray(calendarPlan?.warnings) && calendarPlan.warnings.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        {calendarPlan.warnings.map((w: any, idx: number) => (
                          <p key={idx} className={styles.modalCardDesc} style={{ color: "#707070" }}>
                            ⚠️ {w.type}: {w.message}
                          </p>
                        ))}
                      </div>
                    )}

                    <div className={styles.accordion}>
                      {calendarWeeks.map((w, idx) => {
                        const isOpen = expandedWeeks.includes(idx);
                        return (
                          <div key={w.title} className={styles.accordionItem}>
                            <button type="button" className={styles.accordionHeader} onClick={() => toggleExpandedWeek(idx)}>
                              <span>{w.title}</span>
                              <span className={styles.accordionIcon}>{isOpen ? "−" : "+"}</span>
                            </button>

                            {isOpen && (
                              <div className={styles.accordionBody}>
                                {w.sessions.length ? (
                                  w.sessions.map((s, i) => (
                                    <div key={i} className={styles.sessionRow}>
                                      <div className={styles.sessionLeft}>
                                        <div className={styles.sessionDay}>{s.day}</div>
                                        <div className={styles.sessionTitle}>{s.title}</div>
                                        <div className={styles.sessionDetails}>{s.details}</div>
                                      </div>
                                      <div className={styles.sessionPill}>{s.duration}</div>
                                    </div>
                                  ))
                                ) : (
                                  <div className={styles.sessionEmpty}>Programme à venir…</div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className={styles.modalPlanActions}>
                      <button type="button" className={styles.modalSecondaryBtn} onClick={() => setIsExportOpen(true)} disabled={!calendarPlan}>
                        Télécharger
                      </button>
                      <button type="button" className={styles.modalPrimaryBtn} onClick={() => setCalendarStep(1)}>
                        Regénérer un programme
                      </button>
                    </div>

                    {isExportOpen && (
                      <div
                        role="dialog"
                        aria-modal="true"
                        style={{
                          position: "fixed",
                          inset: 0,
                          background: "rgba(0,0,0,0.35)",
                          display: "grid",
                          placeItems: "center",
                          zIndex: 1000,
                          padding: 16,
                        }}
                        onClick={() => setIsExportOpen(false)}
                      >
                        <div
                          style={{
                            width: "min(560px, 100%)",
                            background: "#fff",
                            borderRadius: 14,
                            padding: 18,
                            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <strong style={{ fontSize: 16 }}>Exporter le planning</strong>
                            <button
                              type="button"
                              onClick={() => setIsExportOpen(false)}
                              style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 18, lineHeight: 1 }}
                              aria-label="Fermer"
                            >
                              ×
                            </button>
                          </div>

                          <p className={styles.modalCardDesc} style={{ marginBottom: 12 }}>
                            Le planning est exporté au format <strong>.ics</strong> (compatible Apple/Google/Outlook). Choisissez où vous voulez l’utiliser.
                          </p>

                          <div style={{ display: "grid", gap: 10 }}>
                            <button type="button" className={styles.modalPrimaryBtn} onClick={() => exportTo("ics")}>Télécharger (.ics)</button>
                            <button type="button" className={styles.modalSecondaryBtn} onClick={() => exportTo("apple")}>Apple Calendrier (Mac)</button>
                            <button type="button" className={styles.modalSecondaryBtn} onClick={() => exportTo("google")}>Google Agenda</button>
                            <button type="button" className={styles.modalSecondaryBtn} onClick={() => exportTo("outlook")}>Outlook</button>
                          </div>

                          <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #eee" }}>
                            <p className={styles.modalCardDesc} style={{ marginBottom: 6 }}>Ensuite :</p>
                            <ul style={{ margin: 0, paddingLeft: 18, color: "#707070", fontSize: 13, lineHeight: "18px" }}>
                              <li><strong>Apple</strong> : double-cliquez le fichier téléchargé pour l’ajouter au Calendrier.</li>
                              <li><strong>Google</strong> : Paramètres → Importer/Exporter → Importer le fichier .ics.</li>
                              <li><strong>Outlook</strong> : Ajouter un calendrier → Importer/Charger un fichier .ics.</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            )}
          </div>
        </section>

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
