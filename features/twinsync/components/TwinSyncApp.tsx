"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  DigitalTwinRoom,
  loadRoomsFromLocalStorage,
  RoomManagementPage,
  saveRoomsToLocalStorage
} from "@/features/rooms";
import { buildTwinSyncAlerts } from "../domain/insights";
import {
  createLiveTelemetrySnapshot,
  TELEMETRY_INTERVAL_MS
} from "../domain/telemetry";
import AlertsPage from "./AlertsPage";
import DashboardPage from "./DashboardPage";
import styles from "../twinsync.module.css";

type MainTab = "dashboard" | "rooms" | "alerts";

const TABS: Array<{ id: MainTab; label: string; shortLabel: string }> = [
  { id: "dashboard", label: "Dashboard", shortLabel: "D" },
  { id: "rooms", label: "Rooms", shortLabel: "R" },
  { id: "alerts", label: "Alerts", shortLabel: "A" }
];

export default function TwinSyncApp() {
  const [activeTab, setActiveTab] = useState<MainTab>("dashboard");
  const [rooms, setRooms] = useState<DigitalTwinRoom[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [telemetryCycle, setTelemetryCycle] = useState(0);

  useEffect(() => {
    const loadedRooms = loadRoomsFromLocalStorage();
    // Browser storage is unavailable during the server render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRooms(loadedRooms);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      saveRoomsToLocalStorage(rooms);
    }
  }, [hydrated, rooms]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setTelemetryCycle((currentCycle) => currentCycle + 1);
    }, TELEMETRY_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [hydrated]);

  const telemetry = useMemo(
    () => createLiveTelemetrySnapshot(rooms, telemetryCycle),
    [rooms, telemetryCycle]
  );
  const alertCount = useMemo(
    () => buildTwinSyncAlerts(rooms, telemetry).length,
    [rooms, telemetry]
  );

  return (
    <div className={styles.appShell}>
      <header className={styles.appHeader}>
        <button className={styles.brand} onClick={() => setActiveTab("dashboard")} aria-label="Open dashboard">
          <Image
            className={styles.brandMark}
            src="/icon.svg"
            alt=""
            width={34}
            height={34}
            priority
          />
          <span><strong>TwinSync</strong><small>Digital Twin Intelligence</small></span>
        </button>

        <nav className={styles.mainTabs} aria-label="Main navigation">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? styles.activeTab : ""}
              onClick={() => setActiveTab(tab.id)}
            >
              <i>{tab.shortLabel}</i>
              <span>{tab.label}</span>
              {tab.id === "alerts" && alertCount > 0 && <em>{alertCount}</em>}
            </button>
          ))}
        </nav>

        <div className={styles.systemStatus}>
          <i />
          <span><strong>Demo online</strong><small>Local storage connected</small></span>
        </div>
      </header>

      {!hydrated ? (
        <main className={styles.loadingState}>
          <div />
          <p>Loading digital twin data...</p>
        </main>
      ) : (
        <>
          {activeTab === "dashboard" && (
            <DashboardPage
              rooms={rooms}
              telemetry={telemetry}
              onOpenRooms={() => setActiveTab("rooms")}
              onOpenAlerts={() => setActiveTab("alerts")}
            />
          )}
          {activeTab === "rooms" && (
            <RoomManagementPage
              rooms={rooms}
              environmentReadings={telemetry.rooms}
              setRooms={setRooms}
            />
          )}
          {activeTab === "alerts" && (
            <AlertsPage
              rooms={rooms}
              telemetry={telemetry}
              onOpenRooms={() => setActiveTab("rooms")}
            />
          )}
        </>
      )}
    </div>
  );
}
