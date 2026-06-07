"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
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

const NOTIFICATION_STORAGE_KEY = "twinsync-critical-notifications";

function loadNotificationPreference() {
  try {
    const storedValue = window.localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    return storedValue === "true" || storedValue === "on";
  } catch {
    return false;
  }
}

function saveNotificationPreference(enabled: boolean) {
  try {
    window.localStorage.setItem(
      NOTIFICATION_STORAGE_KEY,
      JSON.stringify(enabled)
    );
  } catch {
    // The app remains usable if browser storage is unavailable.
  }
}

export default function TwinSyncApp() {
  const [activeTab, setActiveTab] = useState<MainTab>("dashboard");
  const [rooms, setRooms] = useState<DigitalTwinRoom[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [telemetryCycle, setTelemetryCycle] = useState(0);
  const [criticalNotificationsEnabled, setCriticalNotificationsEnabled] =
    useState(false);
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const loadedRooms = loadRoomsFromLocalStorage();
    // Browser storage is unavailable during the server render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRooms(loadedRooms);
    setCriticalNotificationsEnabled(loadNotificationPreference());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      saveRoomsToLocalStorage(rooms);
    }
  }, [hydrated, rooms]);

  useEffect(() => {
    if (hydrated) {
      saveNotificationPreference(criticalNotificationsEnabled);
    }
  }, [criticalNotificationsEnabled, hydrated]);

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
  const alerts = useMemo(
    () => buildTwinSyncAlerts(rooms, telemetry),
    [rooms, telemetry]
  );
  const alertCount = alerts.filter((alert) => alert.severity !== "good").length;
  const criticalCount = alerts.filter(
    (alert) => alert.severity === "critical"
  ).length;
  const criticalAlertActive =
    criticalNotificationsEnabled && criticalCount > 0;
  const notificationClassName = [
    styles.notificationButton,
    criticalNotificationsEnabled ? styles.notificationEnabled : null,
    criticalCount > 0 ? styles.notificationCritical : null
  ].filter(Boolean).join(" ");

  useEffect(() => {
    const alarmAudio = new Audio("/alarm-sound/alarm-sound.wav");
    alarmAudio.loop = true;
    alarmAudio.volume = 0.65;
    alarmAudioRef.current = alarmAudio;

    return () => {
      alarmAudio.pause();
      alarmAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const alarmAudio = alarmAudioRef.current;

    if (!alarmAudio) {
      return;
    }

    if (criticalAlertActive) {
      alarmAudio.currentTime = 0;
      void alarmAudio.play().catch(() => {
        // Browsers may still require a direct interaction before audio playback.
      });
      return;
    }

    alarmAudio.pause();
    alarmAudio.currentTime = 0;
  }, [criticalAlertActive, telemetryCycle]);

  useEffect(() => {
    if (!criticalNotificationsEnabled || criticalAlertActive) {
      return;
    }

    function unlockAlarmAudio() {
      const alarmAudio = alarmAudioRef.current;

      if (!alarmAudio) {
        return;
      }

      alarmAudio.volume = 0;
      void alarmAudio.play().then(() => {
        alarmAudio.pause();
        alarmAudio.currentTime = 0;
        alarmAudio.volume = 0.65;
      }).catch(() => {
        alarmAudio.volume = 0.65;
      });
    }

    window.addEventListener("pointerdown", unlockAlarmAudio, { once: true });
    return () => window.removeEventListener("pointerdown", unlockAlarmAudio);
  }, [criticalAlertActive, criticalNotificationsEnabled]);

  function toggleCriticalNotifications() {
    const nextEnabled = !criticalNotificationsEnabled;
    setCriticalNotificationsEnabled(nextEnabled);

    const alarmAudio = alarmAudioRef.current;

    if (!alarmAudio) {
      return;
    }

    if (!nextEnabled) {
      alarmAudio.pause();
      alarmAudio.currentTime = 0;
      return;
    }

    if (criticalCount > 0) {
      alarmAudio.volume = 0.65;
      alarmAudio.currentTime = 0;
      void alarmAudio.play().catch(() => {
        // The next direct interaction will retry browser audio permission.
      });
      return;
    }

    alarmAudio.volume = 0;
    void alarmAudio.play().then(() => {
      alarmAudio.pause();
      alarmAudio.currentTime = 0;
      alarmAudio.volume = 0.65;
    }).catch(() => {
      alarmAudio.volume = 0.65;
    });
  }

  return (
    <div className={styles.appShell}>
      {criticalAlertActive && (
        <>
          <div className={`${styles.criticalEdge} ${styles.criticalEdgeLeft}`} />
          <div className={`${styles.criticalEdge} ${styles.criticalEdgeRight}`} />
          <div className={styles.criticalAnnouncement} role="alert">
            {criticalCount} critical {criticalCount === 1 ? "alert" : "alerts"} detected
          </div>
        </>
      )}
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

        <button
          className={notificationClassName}
          type="button"
          onClick={toggleCriticalNotifications}
          aria-pressed={criticalNotificationsEnabled}
          aria-label={`Critical alert notifications ${
            criticalNotificationsEnabled ? "enabled" : "disabled"
          }`}
          title={`Critical alert notifications ${
            criticalNotificationsEnabled ? "enabled" : "disabled"
          }`}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
          </svg>
          {criticalCount > 0 && <span>{criticalCount}</span>}
          <i />
        </button>
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
