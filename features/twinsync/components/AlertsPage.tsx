"use client";

import { useMemo, useState } from "react";
import { DigitalTwinRoom } from "@/features/rooms";
import {
  AlertKind,
  buildTwinSyncAlerts,
  calculatePortfolioSummary
} from "../domain/insights";
import { LiveTelemetrySnapshot } from "../domain/telemetry";
import styles from "../twinsync.module.css";

type AlertFilter = "all" | AlertKind;

export default function AlertsPage({ rooms, telemetry, onOpenRooms }: {
  rooms: DigitalTwinRoom[];
  telemetry: LiveTelemetrySnapshot;
  onOpenRooms: () => void;
}) {
  const [filter, setFilter] = useState<AlertFilter>("all");
  const alerts = useMemo(
    () => buildTwinSyncAlerts(rooms, telemetry),
    [rooms, telemetry]
  );
  const summary = useMemo(() => calculatePortfolioSummary(rooms), [rooms]);
  const visibleAlerts = filter === "all" ? alerts : alerts.filter((alert) => alert.kind === filter);
  const realtimeCount = alerts.filter((alert) => alert.kind === "realtime").length;
  const predictiveCount = alerts.filter((alert) => alert.kind === "predictive").length;
  const criticalCount = alerts.filter((alert) => alert.severity === "critical").length;
  const warningCount = alerts.filter((alert) => alert.severity === "warning").length;
  const cautionCount = alerts.filter((alert) => alert.severity === "caution").length;
  const goodCount = alerts.filter((alert) => alert.severity === "good").length;
  const generatedTime = new Date(telemetry.generatedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  return (
    <main className={styles.contentPage}>
      <section className={styles.pageHero}>
        <div>
          <p className={styles.eyebrow}>Operational intelligence</p>
          <h1>Alerts and Predictions</h1>
          <p>Review live device, consumption, temperature, humidity, sensor-health, and predictive findings from the current mock sensor cycle.</p>
        </div>
        <div className={styles.heroActions}>
          <span className={styles.liveBadge}>
            <i /> Cycle {telemetry.cycle + 1} / {generatedTime}
          </span>
          <button className={styles.primaryAction} onClick={onOpenRooms}>Open Room Controls</button>
        </div>
      </section>

      <section className={styles.metricGrid}>
        <Metric label="All insights" value={alerts.length} />
        <Metric label="Good" value={goodCount} tone="good" />
        <Metric label="Caution" value={cautionCount} tone="caution" />
        <Metric label="Warning" value={warningCount} tone="warning" />
        <Metric label="Critical" value={criticalCount} danger={criticalCount > 0} />
      </section>

      <section className={styles.alertToolbar}>
        <div className={styles.filterTabs}>
          {(["all", "realtime", "predictive"] as AlertFilter[]).map((value) => (
            <button
              key={value}
              className={filter === value ? styles.activeFilter : ""}
              onClick={() => setFilter(value)}
            >
              {value === "all" ? "All alerts" : value}
            </button>
          ))}
        </div>
        <span>
          {realtimeCount} real-time / {predictiveCount} predictive / {summary.totalRooms} rooms
        </span>
      </section>

      <section className={styles.alertList}>
        {visibleAlerts.map((alert) => (
          <article key={alert.id} className={`${styles.alertCard} ${styles[`alert${alert.severity}`]}`}>
            <div className={styles.alertBody}>
              <header className={styles.alertCardHeader}>
                <div>
                  <span className={styles.alertRoomLabel}>Room</span>
                  <h2>{alert.roomName}</h2>
                  {alert.itemName && <p>{alert.itemName}</p>}
                </div>
                <div className={styles.alertMeta}>
                  <span className={styles.alertSeverityBadge}>
                    {formatLabel(alert.severity)}
                  </span>
                  <span>{formatLabel(alert.kind)}</span>
                  <span>{formatLabel(alert.category)}</span>
                </div>
              </header>

              <div className={styles.alertTitleRow}>
                <div className={styles.alertIcon} aria-hidden="true">
                  {alert.kind === "predictive" ? "P" : "!"}
                </div>
                <div>
                  <span>Detected {formatDetectedTime(alert.detectedAt)}</span>
                  <h3>{alert.title}</h3>
                </div>
              </div>

              <div className={styles.alertKpiGrid}>
                {alert.metrics.map((alertMetric) => (
                  <div key={alertMetric.label} className={styles.alertKpi}>
                    <span>{alertMetric.label}</span>
                    <strong>{alertMetric.value}</strong>
                    <small>Normal: {alertMetric.normalValue}</small>
                    <em className={
                      alertMetric.deviationPercent > 0
                        ? styles.deviationIncrease
                        : alertMetric.deviationPercent < 0
                          ? styles.deviationDecrease
                          : styles.deviationStable
                    }>
                      {formatDeviation(alertMetric.deviationPercent)}
                    </em>
                  </div>
                ))}
              </div>

              <div className={styles.alertExplanationGrid}>
                <section className={styles.alertDescription}>
                  <strong>What happened</strong>
                  <p>{alert.description}</p>
                </section>
                <section className={styles.recommendation}>
                  <strong>Precaution and action</strong>
                  <span>{alert.recommendation}</span>
                </section>
              </div>
            </div>
          </article>
        ))}

        {visibleAlerts.length === 0 && (
          <section className={styles.clearState}>
            <span>✓</span>
            <h2>No alerts in this category</h2>
            <p>The current digital twin data does not indicate an issue requiring attention.</p>
          </section>
        )}
      </section>
    </main>
  );
}

function formatDetectedTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function formatLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDeviation(value: number) {
  if (value === 0) {
    return "At normal value";
  }

  return `${Math.abs(value)}% ${value > 0 ? "above" : "below"} normal`;
}

function Metric({
  label,
  value,
  danger = false,
  tone
}: {
  label: string;
  value: number;
  danger?: boolean;
  tone?: "good" | "caution" | "warning";
}) {
  const toneClass = danger
    ? styles.metricred
    : tone
      ? styles[`metric${tone}`]
      : styles.metricblue;

  return (
    <article className={`${styles.metricCard} ${toneClass}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>Based on current room data</small>
    </article>
  );
}
