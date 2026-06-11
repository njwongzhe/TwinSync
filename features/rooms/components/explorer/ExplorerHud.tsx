"use client";

import Image from "next/image";
import styles from "../../rooms.module.css";
import {
  DigitalTwinRoom,
  ItemDefinition,
  PlacementPreview,
  RoomEnvironmentReading,
  RoomKpi
} from "../../domain/types";
import { getItemDefinition, getItemIconPath } from "../../domain/items";

type ExplorerHudProps = {
  room: DigitalTwinRoom;
  kpi: RoomKpi;
  hotbar: string[];
  selectedSlot: number | null;
  selectedDefinition: ItemDefinition | null;
  placementPreview: PlacementPreview | null;
  pointerLocked: boolean;
  environment?: RoomEnvironmentReading;
  onExit: () => void;
};

export default function ExplorerHud({
  room,
  kpi,
  hotbar,
  selectedSlot,
  selectedDefinition,
  placementPreview,
  pointerLocked,
  environment,
  onExit
}: ExplorerHudProps) {
  return (
    <>
      {pointerLocked && <div className={styles.crosshair}>+</div>}

      <section className={styles.explorerTopBar}>
        <div>
          <strong>{room.name}</strong>
          <span>{room.width}m × {room.length}m × {room.height}m</span>
        </div>
        <div className={styles.explorerMetrics}>
          {environment && (
            <>
              <span>Room {environment.temperatureC.toFixed(1)} °C</span>
              <span>Humidity {environment.humidityPercent}% RH</span>
            </>
          )}
          <span>Active {kpi.activeDevices}/{kpi.totalDevices}</span>
          <span>Alerts {kpi.totalAlerts}</span>
          <span>{kpi.estimatedPowerWatt} W</span>
        </div>
        <button onClick={onExit}>ESC / Exit</button>
      </section>

      <section className={styles.explorerHelp}>
        <span>Double-click Capture Cursor</span>
        <span>ESC Release Cursor</span>
        <span>WASD Move</span>
        <span>Mouse Look</span>
        <span>1-0 Select</span>
        <span>B Bag</span>
        <span>Q Place</span>
        <span>E Remove</span>
        <span>Right Hold Rotate</span>
        <span>Left Click Control</span>
      </section>

      <section className={styles.hotbarWrapper}>
        <div className={styles.hotbarStatus}>
          {selectedDefinition ? (
            <>
              <strong>{selectedDefinition.label}</strong>
              <span className={placementPreview?.placeable ? styles.placeableText : styles.notPlaceableText}>
                {placementPreview?.placeable ? "Placeable" : "Point at a valid surface"}
              </span>
            </>
          ) : (
            <strong>No item selected</strong>
          )}
        </div>

        <div className={styles.hotbarSlots}>
          {hotbar.map((itemTypeId, index) => {
            const definition = getItemDefinition(itemTypeId);
            const numberLabel = index === 9 ? "0" : String(index + 1);

            return (
              <div key={index} className={`${styles.hotbarSlot} ${selectedSlot === index ? styles.activeHotbarSlot : ""}`}>
                <span>{numberLabel}</span>
                {definition && (
                  <Image
                    className={styles.hotbarSlotIcon}
                    src={getItemIconPath(definition.id)}
                    alt=""
                    width={40}
                    height={40}
                  />
                )}
                <small>{definition?.label ?? "Empty"}</small>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
