"use client";

import { FormEvent, useMemo, useState } from "react";
import styles from "../rooms.module.css";
import { DigitalTwinRoom, RoomLayoutType } from "../domain/types";
import { createRoom } from "../domain/layouts";

type CreateRoomModalProps = {
  rooms: DigitalTwinRoom[];
  onCreate: (params: Parameters<typeof createRoom>[0]) => void;
  onClose: () => void;
};

const layoutOptions: { value: RoomLayoutType; label: string }[] = [
  { value: "empty", label: "Empty Room" },
  { value: "computer-lab", label: "Computer Lab" },
  { value: "study-room", label: "Study Room" },
  { value: "office", label: "Office" }
];

export default function CreateRoomModal({ rooms, onCreate, onClose }: CreateRoomModalProps) {
  const [name, setName] = useState("New Digital Twin Room");
  const [width, setWidth] = useState(12);
  const [length, setLength] = useState(12);
  const [height, setHeight] = useState(4);
  const [layoutType, setLayoutType] = useState<RoomLayoutType>("computer-lab");
  const [cloneRoomId, setCloneRoomId] = useState("none");

  const cloneRoom = useMemo(() => {
    return rooms.find((room) => room.id === cloneRoomId) ?? null;
  }, [cloneRoomId, rooms]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    onCreate({
      name: name.trim() || "Unnamed Room",
      width,
      length,
      height,
      layoutType,
      cloneFrom: cloneRoom
    });
  }

  return (
    <div className={styles.modalBackdrop}>
      <form className={styles.modalCard} onSubmit={handleSubmit}>
        <div className={styles.modalHeader}>
          <div>
            <p className={styles.eyebrow}>Room Creator</p>
            <h2>Create a new room</h2>
          </div>
          <button type="button" className={styles.iconButton} onClick={onClose}>×</button>
        </div>

        <label className={styles.fieldLabel}>
          Room Name
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>

        <div className={styles.formGrid3}>
          <label className={styles.fieldLabel}>
            Width
            <input type="number" min="6" max="30" value={width} onChange={(event) => setWidth(Number(event.target.value))} />
          </label>
          <label className={styles.fieldLabel}>
            Length
            <input type="number" min="6" max="30" value={length} onChange={(event) => setLength(Number(event.target.value))} />
          </label>
          <label className={styles.fieldLabel}>
            Height
            <input type="number" min="3" max="8" value={height} onChange={(event) => setHeight(Number(event.target.value))} />
          </label>
        </div>

        <label className={styles.fieldLabel}>
          Default Layout
          <select value={layoutType} onChange={(event) => setLayoutType(event.target.value as RoomLayoutType)}>
            {layoutOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label className={styles.fieldLabel}>
          Clone Existing Room Optional
          <select value={cloneRoomId} onChange={(event) => setCloneRoomId(event.target.value)}>
            <option value="none">Do not clone</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>{room.name}</option>
            ))}
          </select>
        </label>

        <div className={styles.modalActions}>
          <button type="button" className={styles.secondaryButton} onClick={onClose}>Cancel</button>
          <button type="submit" className={styles.primaryButton}>Create Room</button>
        </div>
      </form>
    </div>
  );
}
