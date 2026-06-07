"use client";

import styles from "../rooms.module.css";
import { DeviceStatus, PlacedItem } from "../domain/types";
import { getItemDefinition } from "../domain/items";

type DeviceControlPanelProps = {
  item: PlacedItem;
  onClose: () => void;
  onUpdate: (patch: Partial<PlacedItem>) => void;
  onRemove: () => void;
};

export default function DeviceControlPanel({ item, onClose, onUpdate, onRemove }: DeviceControlPanelProps) {
  const definition = getItemDefinition(item.itemTypeId);

  if (!definition) {
    return null;
  }

  function changeStatus(status: DeviceStatus) {
    const alerts = status === "fault"
      ? Array.from(new Set([...item.alerts, "Manual fault status has been triggered."]))
      : item.alerts.filter((alert) => alert !== "Manual fault status has been triggered.");

    onUpdate({ status, alerts });
  }

  return (
    <div className={styles.controlPanelWindow}>
      <div className={styles.modalHeader}>
        <div>
          <p className={styles.eyebrow}>Item Control Panel</p>
          <h2>{definition.label}</h2>
        </div>
        <button className={styles.iconButton} onClick={onClose}>×</button>
      </div>

      <label className={styles.fieldLabel}>
        Rename Item
        <input value={item.name} onChange={(event) => onUpdate({ name: event.target.value })} />
      </label>

      <div className={styles.controlDetailsGrid}>
        <div><span>Type</span><strong>{definition.category}</strong></div>
        <div><span>Mount</span><strong>{definition.mount}</strong></div>
        <div><span>Status</span><strong>{item.status}</strong></div>
        <div><span>Power</span><strong>{item.status === "on" ? item.powerWatt : 0} W</strong></div>
        <div><span>Position</span><strong>{item.position.x}, {item.position.y.toFixed(1)}, {item.position.z}</strong></div>
        <div><span>Rotation</span><strong>{Math.round(item.rotationY * 180 / Math.PI)}°</strong></div>
      </div>

      <p className={styles.helpText}>{definition.description}</p>

      {item.alerts.length > 0 && (
        <div className={styles.alertBox}>
          {item.alerts.map((alert) => <p key={alert}>{alert}</p>)}
        </div>
      )}

      {definition.isDevice && (
        <div className={styles.statusButtons}>
          <button onClick={() => changeStatus("on")}>Turn On</button>
          <button onClick={() => changeStatus("off")}>Turn Off</button>
          <button onClick={() => changeStatus("fault")}>Mark Fault</button>
        </div>
      )}

      <button className={styles.dangerWideButton} onClick={onRemove}>Remove Item</button>
    </div>
  );
}
