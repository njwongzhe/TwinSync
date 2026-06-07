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
  const environmentalCount = alerts.filter((alert) => (
    ["temperature", "humidity"].includes(alert.category)
  )).length;
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
        <Metric label="Real-time alerts" value={realtimeCount} />
        <Metric label="Predictive alerts" value={predictiveCount} />
        <Metric label="Environmental" value={environmentalCount} />
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
          {summary.totalRooms} rooms / {telemetry.portfolio.onlineSensors} of {telemetry.portfolio.totalSensors} sensors online
        </span>
      </section>

      <section className={styles.alertList}>
        {visibleAlerts.map((alert) => (
          <article key={alert.id} className={`${styles.alertCard} ${styles[`alert${alert.severity}`]}`}>
            <div className={styles.alertIcon}>
              {alert.kind === "predictive" ? "P" : "!"}
            </div>
            <div className={styles.alertBody}>
              <div className={styles.alertMeta}>
                <span>{alert.kind}</span>
                <span>{alert.severity}</span>
                <span>{alert.category}</span>
                <span>{alert.roomName}</span>
                {alert.itemName && <span>{alert.itemName}</span>}
              </div>
              <h2>{alert.title}</h2>
              <p>{alert.description}</p>
              <div className={styles.alertReading}>
                {alert.observedValue && <strong>{alert.observedValue}</strong>}
                <span>Detected {formatDetectedTime(alert.detectedAt)}</span>
              </div>
              <div className={styles.recommendation}>
                <strong>Recommended action</strong>
                <span>{alert.recommendation}</span>
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

function Metric({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return (
    <article className={`${styles.metricCard} ${danger ? styles.metricred : styles.metricblue}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>Based on current room data</small>
    </article>
  );
}
