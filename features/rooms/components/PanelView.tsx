"use client";

import Image from "next/image";
import { useMemo } from "react";
import styles from "../rooms.module.css";
import {
  DeviceStatus,
  DigitalTwinRoom,
  PlacedItem,
  RoomEnvironmentReading
} from "../domain/types";
import { calculateRoomKpi } from "../domain/kpi";
import { getItemDefinition, getItemIconPath } from "../domain/items";

type PanelViewProps = {
  room: DigitalTwinRoom;
  environment?: RoomEnvironmentReading;
  onBack: () => void;
  onExplore: () => void;
  onRoomChange: (room: DigitalTwinRoom) => void;
};

export default function PanelView({
  room,
  environment,
  onBack,
  onExplore,
  onRoomChange
}: PanelViewProps) {
  const kpi = useMemo(() => calculateRoomKpi(room), [room]);
  const deviceItems = room.items.filter((item) => getItemDefinition(item.itemTypeId)?.isDevice);

  function updateDevice(itemId: string, patch: Partial<PlacedItem>) {
    onRoomChange({
      ...room,
      items: room.items.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        return {
          ...item,
          ...patch,
          updatedAt: new Date().toISOString()
        };
      })
    });
  }

  function setStatus(itemId: string, status: DeviceStatus) {
    const target = room.items.find((item) => item.id === itemId);

    if (!target) {
      return;
    }

    const alerts = status === "fault"
      ? Array.from(new Set([...target.alerts, "Manual fault status has been triggered."]))
      : target.alerts.filter((alert) => alert !== "Manual fault status has been triggered.");

    updateDevice(itemId, { status, alerts });
  }

  return (
    <main className={styles.pageShell}>
      <section className={styles.panelHeader}>
        <div>
          <p className={styles.eyebrow}>Panel View</p>
          <input
            className={styles.roomNameInput}
            aria-label="Room name"
            value={room.name}
            onChange={(event) => onRoomChange({
              ...room,
              name: event.target.value
            })}
          />
          <p>Monitor and control every electronic device in card format.</p>
          {environment && (
            <p className={styles.roomSensorCaption}>
              Room sensor: {environment.temperatureC.toFixed(1)} °C / {environment.humidityPercent}% RH
            </p>
          )}
        </div>
        <div className={styles.heroActions}>
          <button className={styles.secondaryButton} onClick={onBack}>Back to Rooms</button>
          <button className={styles.primaryButton} onClick={onExplore}>Open 3D Explore</button>
        </div>
      </section>

      <section className={styles.summaryGrid}>
        <div className={styles.summaryCard}><span>Total Devices</span><strong>{kpi.totalDevices}</strong></div>
        <div className={styles.summaryCard}><span>Active</span><strong>{kpi.activeDevices}</strong></div>
        <div className={styles.summaryCard}><span>Faults</span><strong>{kpi.faultDevices}</strong></div>
        <div className={styles.summaryCard}><span>Alerts</span><strong>{kpi.totalAlerts}</strong></div>
        <div className={styles.summaryCard}>
          <span>Room Temperature</span>
          <strong>{environment ? `${environment.temperatureC.toFixed(1)} °C` : "--"}</strong>
        </div>
        <div className={styles.summaryCard}>
          <span>Room Humidity</span>
          <strong>{environment ? `${environment.humidityPercent}% RH` : "--"}</strong>
        </div>
      </section>

      <section className={styles.deviceGrid}>
        {deviceItems.map((item) => {
          const definition = getItemDefinition(item.itemTypeId);

          if (!definition) {
            return null;
          }

          return (
            <article key={item.id} className={styles.deviceCard}>
              {definition.icon ? (
                <span className={styles.deviceIcon} style={{ fontSize: "2.5rem", display: "flex", alignItems: "center", justifyContent: "center", width: 56, height: 56 }}>
                  {definition.icon}
                </span>
              ) : (
                <Image
                  className={styles.deviceIcon}
                  src={getItemIconPath(definition.id)}
                  alt=""
                  width={56}
                  height={56}
                />
              )}
              <div className={styles.deviceCardBody}>
                <input
                  className={styles.deviceNameInput}
                  value={item.name}
                  onChange={(event) => updateDevice(item.id, { name: event.target.value })}
                />
                <p>{definition.label} / {definition.mount}</p>

                <div className={styles.deviceStats}>
                  <span>Status: <strong>{item.status}</strong></span>
                  <span>Power: <strong>{item.status === "on" ? item.powerWatt : 0} W</strong></span>
                  <span>Position: <strong>{item.position.x}, {item.position.z}</strong></span>
                  <span>Alerts: <strong>{item.alerts.length}</strong></span>
                </div>

                {item.alerts.length > 0 && (
                  <div className={styles.alertBox}>
                    {item.alerts.map((alert) => <p key={alert}>{alert}</p>)}
                  </div>
                )}

                <div className={styles.statusButtons}>
                  <button onClick={() => setStatus(item.id, "on")}>Turn On</button>
                  <button onClick={() => setStatus(item.id, "off")}>Turn Off</button>
                  <button onClick={() => setStatus(item.id, "fault")}>Mark Fault</button>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
