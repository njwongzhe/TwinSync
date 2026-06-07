"use client";

import { useMemo } from "react";
import {
  calculateRoomKpi,
  DigitalTwinRoom
} from "@/features/rooms";
import { buildTwinSyncAlerts, calculatePortfolioSummary } from "../domain/insights";
import {
  LiveTelemetrySnapshot,
  RoomTelemetry,
  TelemetryHistoryPoint
} from "../domain/telemetry";
import styles from "../twinsync.module.css";

type DashboardPageProps = {
  rooms: DigitalTwinRoom[];
  telemetry: LiveTelemetrySnapshot;
  onOpenRooms: () => void;
  onOpenAlerts: () => void;
};

export default function DashboardPage({
  rooms,
  telemetry,
  onOpenRooms,
  onOpenAlerts
}: DashboardPageProps) {
  const summary = useMemo(() => calculatePortfolioSummary(rooms), [rooms]);
  const alerts = useMemo(
    () => buildTwinSyncAlerts(rooms, telemetry),
    [rooms, telemetry]
  );
  const roomMetrics = useMemo(() => rooms.map((room) => ({
    room,
    kpi: calculateRoomKpi(room),
    telemetry: telemetry.rooms.find((reading) => reading.roomId === room.id)
  })), [rooms, telemetry]);
  const maxLoad = Math.max(
    1,
    ...telemetry.rooms.map((reading) => reading.livePowerWatt)
  );
  const statusTotal = Math.max(1, summary.totalDevices);
  const activeDegrees = summary.activeDevices / statusTotal * 360;
  const faultDegrees = summary.faultDevices / statusTotal * 360;
  const offDevices = Math.max(0, summary.totalDevices - summary.activeDevices - summary.faultDevices);
  const generatedTime = new Date(telemetry.generatedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  return (
    <main className={styles.contentPage}>
      <section className={styles.pageHero}>
        <div>
          <p className={styles.eyebrow}>Real-time overview</p>
          <h1>Digital Twin Command Dashboard</h1>
          <p>Live operational insight generated from the devices and room layouts stored in this browser.</p>
        </div>
        <div className={styles.heroActions}>
          <span className={styles.liveBadge}>
            <i /> Updated {generatedTime} / 8s cycle
          </span>
          <button className={styles.primaryAction} onClick={onOpenRooms}>Manage Rooms</button>
        </div>
      </section>

      <section className={styles.metricGrid}>
        <MetricCard label="Rooms monitored" value={String(summary.totalRooms)} detail="Digital twin spaces" tone="blue" />
        <MetricCard
          label="Live consumption"
          value={formatPower(telemetry.portfolio.totalPowerWatt)}
          detail={`${telemetry.phase} dataset`}
          tone="amber"
        />
        <MetricCard
          label="Average temperature"
          value={`${telemetry.portfolio.averageTemperatureC.toFixed(1)} °C`}
          detail={telemetry.portfolio.hottestRoomName
            ? `Hottest: ${telemetry.portfolio.hottestRoomName} at ${telemetry.portfolio.hottestTemperatureC.toFixed(1)} °C`
            : "Waiting for sensor data"}
          tone={telemetry.portfolio.averageTemperatureC > 27 ? "red" : "green"}
        />
        <MetricCard
          label="Average humidity"
          value={`${telemetry.portfolio.averageHumidityPercent}%`}
          detail={`${telemetry.portfolio.comfortableRooms}/${summary.totalRooms} rooms in comfort range`}
          tone={telemetry.portfolio.averageHumidityPercent >= 65 ? "red" : "blue"}
        />
        <MetricCard
          label="Portfolio efficiency"
          value={`${summary.efficiencyScore}%`}
          detail={`${summary.activeDevices}/${summary.totalDevices} active / ${summary.faultDevices} faulted`}
          tone={summary.efficiencyScore >= 70 ? "green" : "red"}
        />
      </section>

      <section className={styles.dashboardGrid}>
        <article className={styles.dataCard}>
          <CardHeading title="Room energy load" subtitle="Live sensor estimate by room" />
          <div className={styles.barChart}>
            {roomMetrics.map(({ room, kpi, telemetry: reading }) => (
              <div className={styles.barRow} key={room.id}>
                <div>
                  <strong>{room.name}</strong>
                  <span>
                    {kpi.activeDevices}/{kpi.totalDevices} active
                    {reading ? ` / ${formatDelta(reading.powerDeltaPercent)}` : ""}
                  </span>
                </div>
                <div className={styles.barTrack}>
                  <span style={{
                    width: `${Math.max(
                      3,
                      (reading?.livePowerWatt ?? 0) / maxLoad * 100
                    )}%`
                  }} />
                </div>
                <strong>{formatPower(reading?.livePowerWatt ?? 0)}</strong>
              </div>
            ))}
            {roomMetrics.length === 0 && <EmptyMessage message="Create a room to begin monitoring energy load." />}
          </div>
        </article>

        <article className={styles.dataCard}>
          <CardHeading title="Device status" subtitle="Operational distribution" />
          <div className={styles.donutLayout}>
            <div
              className={styles.donut}
              style={{
                background: `conic-gradient(
                  #22c55e 0deg ${activeDegrees}deg,
                  #ef4444 ${activeDegrees}deg ${activeDegrees + faultDegrees}deg,
                  #cbd5e1 ${activeDegrees + faultDegrees}deg 360deg
                )`
              }}
            >
              <div><strong>{summary.totalDevices}</strong><span>devices</span></div>
            </div>
            <div className={styles.legend}>
              <Legend color="#22c55e" label="Active" value={summary.activeDevices} />
              <Legend color="#ef4444" label="Fault" value={summary.faultDevices} />
              <Legend color="#cbd5e1" label="Off" value={offDevices} />
            </div>
          </div>
        </article>

        <article className={styles.dataCard}>
          <CardHeading
            title="Environmental sensors"
            subtitle="Temperature, humidity, occupancy, and sensor health"
          />
          <div className={styles.environmentList}>
            {telemetry.rooms.map((reading) => (
              <EnvironmentReading key={reading.roomId} reading={reading} />
            ))}
            {telemetry.rooms.length === 0 && (
              <EmptyMessage message="No environmental sensor data is available." />
            )}
          </div>
        </article>

        <article className={styles.dataCard}>
          <CardHeading title="Room efficiency" subtitle="Operational health score" />
          <div className={styles.efficiencyList}>
            {roomMetrics.map(({ room, kpi, telemetry: reading }) => (
              <div key={room.id}>
                <div className={styles.listHeading}>
                  <strong>{room.name}</strong>
                  <span>
                    {kpi.efficiencyScore}%
                    {reading ? ` / ${reading.temperatureC.toFixed(1)} °C` : ""}
                  </span>
                </div>
                <div className={styles.efficiencyTrack}>
                  <span
                    className={kpi.efficiencyScore < 60 ? styles.lowScore : ""}
                    style={{ width: `${kpi.efficiencyScore}%` }}
                  />
                </div>
              </div>
            ))}
            {roomMetrics.length === 0 && <EmptyMessage message="No efficiency data is available yet." />}
          </div>
        </article>

        <article className={`${styles.dataCard} ${styles.wideCard}`}>
          <CardHeading
            title="Live telemetry trend"
            subtitle="Rolling 96-second consumption and average-temperature history"
          />
          <TelemetryTrend history={telemetry.history} />
        </article>

        <article className={`${styles.dataCard} ${styles.wideCard}`}>
          <div className={styles.cardHeadingWithAction}>
            <CardHeading title="Priority alerts" subtitle="Most important current and predicted issues" />
            <button className={styles.textAction} onClick={onOpenAlerts}>View all alerts</button>
          </div>
          <div className={styles.compactAlerts}>
            {alerts.slice(0, 4).map((alert) => (
              <button key={alert.id} onClick={onOpenAlerts}>
                <span className={`${styles.severityDot} ${styles[alert.severity]}`} />
                <span>
                  <strong>{alert.title}</strong>
                  <small>
                    {alert.roomName}
                    {alert.itemName ? ` / ${alert.itemName}` : ""}
                    {alert.observedValue ? ` / ${alert.observedValue}` : ""}
                  </small>
                </span>
                <em>{alert.category}</em>
              </button>
            ))}
            {alerts.length === 0 && <EmptyMessage message="Everything looks stable. No active or predictive alerts." />}
          </div>
        </article>
      </section>
    </main>
  );
}

function EnvironmentReading({ reading }: { reading: RoomTelemetry }) {
  return (
    <div className={styles.environmentRow}>
      <div>
        <strong>{reading.roomName}</strong>
        <span>{reading.phase} / {reading.temperatureTrend}</span>
      </div>
      <span className={`${styles.temperaturePill} ${styles[reading.temperatureStatus]}`}>
        {reading.temperatureC.toFixed(1)} °C
      </span>
      <div className={styles.sensorValues}>
        <span>{reading.humidityPercent}% RH</span>
        <span>{reading.occupancyPercent}% occupied</span>
        <span>Sensor {reading.sensorStatus}</span>
      </div>
    </div>
  );
}

function TelemetryTrend({ history }: { history: TelemetryHistoryPoint[] }) {
  const maxPower = Math.max(1, ...history.map((point) => point.totalPowerWatt));
  const minimumTemperature = Math.min(
    18,
    ...history.map((point) => point.averageTemperatureC)
  );
  const maximumTemperature = Math.max(
    30,
    ...history.map((point) => point.averageTemperatureC)
  );
  const temperatureRange = Math.max(1, maximumTemperature - minimumTemperature);

  return (
    <div className={styles.telemetryTrend}>
      <div className={styles.trendLegend}>
        <span><i className={styles.powerLegend} /> Consumption</span>
        <span><i className={styles.temperatureLegend} /> Temperature</span>
      </div>
      <div className={styles.trendPlot}>
        {history.map((point) => {
          const temperaturePosition = (
            point.averageTemperatureC - minimumTemperature
          ) / temperatureRange * 100;

          return (
            <div className={styles.trendColumn} key={point.label}>
              <span
                className={styles.temperatureMarker}
                style={{ bottom: `${temperaturePosition}%` }}
                title={`${point.averageTemperatureC.toFixed(1)} °C`}
              />
              <i
                style={{ height: `${Math.max(
                  4,
                  point.totalPowerWatt / maxPower * 100
                )}%` }}
                title={formatPower(point.totalPowerWatt)}
              />
              <small>{point.label}</small>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MetricCard({ label, value, detail, tone }: {
  label: string;
  value: string;
  detail: string;
  tone: "blue" | "green" | "amber" | "red";
}) {
  return (
    <article className={`${styles.metricCard} ${styles[`metric${tone}`]}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function CardHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className={styles.cardHeading}>
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div>
      <i style={{ background: color }} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function EmptyMessage({ message }: { message: string }) {
  return <p className={styles.emptyMessage}>{message}</p>;
}

function formatPower(watt: number) {
  return watt >= 1000 ? `${(watt / 1000).toFixed(1)} kW` : `${watt} W`;
}

function formatDelta(value: number) {
  if (value === 0) {
    return "stable";
  }

  return `${value > 0 ? "+" : ""}${value}%`;
}
