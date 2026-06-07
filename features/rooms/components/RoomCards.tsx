"use client";

import styles from "../rooms.module.css";
import { DigitalTwinRoom, RoomEnvironmentReading } from "../domain/types";
import { calculateRoomKpi } from "../domain/kpi";

type RoomCardsProps = {
  rooms: DigitalTwinRoom[];
  environmentReadings: RoomEnvironmentReading[];
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  onExplore: (roomId: string) => void;
  onPanel: (roomId: string) => void;
  onDelete: (roomId: string) => void;
};

export default function RoomCards({
  rooms,
  environmentReadings,
  selectedRoomId,
  onSelectRoom,
  onExplore,
  onPanel,
  onDelete
}: RoomCardsProps) {
  if (rooms.length === 0) {
    return (
      <section className={styles.emptyState}>
        <h2>No room yet</h2>
        <p>Create a room first, then start building the digital twin layout.</p>
      </section>
    );
  }

  return (
    <section className={styles.roomGrid}>
      {rooms.map((room) => {
        const kpi = calculateRoomKpi(room);
        const environment = environmentReadings.find(
          (reading) => reading.roomId === room.id
        );
        const isSelected = selectedRoomId === room.id;

        return (
          <article
            key={room.id}
            className={`${styles.roomCard} ${isSelected ? styles.selectedRoomCard : ""}`}
            onClick={() => onSelectRoom(room.id)}
          >
            <div className={styles.cardHeader}>
              <div>
                <h2>{room.name}</h2>
                <p>{room.width}m × {room.length}m × {room.height}m / {room.layoutType}</p>
              </div>
              <span className={styles.roomBadge}>{kpi.efficiencyScore}% efficient</span>
            </div>

            <div className={styles.kpiGrid}>
              <div>
                <span>Devices</span>
                <strong>{kpi.totalDevices}</strong>
              </div>
              <div>
                <span>Active</span>
                <strong>{kpi.activeDevices}/{kpi.totalDevices}</strong>
              </div>
              <div>
                <span>Alerts</span>
                <strong>{kpi.totalAlerts}</strong>
              </div>
              <div>
                <span>Load</span>
                <strong>{kpi.estimatedPowerWatt} W</strong>
              </div>
            </div>

            {environment && (
              <section className={styles.roomEnvironment}>
                <div className={styles.roomEnvironmentHeading}>
                  <div>
                    <strong>Room environmental sensor</strong>
                    <span>Ambient readings for the whole room, not a device</span>
                  </div>
                  <i className={environment.sensorStatus === "online"
                    ? styles.sensorOnline
                    : styles.sensorDegraded}
                  >
                    {environment.sensorStatus}
                  </i>
                </div>
                <div className={styles.roomEnvironmentValues}>
                  <div>
                    <span>Room temperature</span>
                    <strong>{environment.temperatureC.toFixed(1)} °C</strong>
                  </div>
                  <div>
                    <span>Room humidity</span>
                    <strong>{environment.humidityPercent}% RH</strong>
                  </div>
                </div>
              </section>
            )}

            <div className={styles.progressTrack}>
              <span style={{ width: `${kpi.efficiencyScore}%` }} />
            </div>

            <div className={styles.cardActions}>
              <button className={styles.primaryButtonSmall} onClick={(event) => {
                event.stopPropagation();
                onExplore(room.id);
              }}>
                3D Explore
              </button>
              <button className={styles.secondaryButtonSmall} onClick={(event) => {
                event.stopPropagation();
                onPanel(room.id);
              }}>
                Panel View
              </button>
              <button className={styles.dangerButtonSmall} onClick={(event) => {
                event.stopPropagation();
                onDelete(room.id);
              }}>
                Delete
              </button>
            </div>
          </article>
        );
      })}
    </section>
  );
}
