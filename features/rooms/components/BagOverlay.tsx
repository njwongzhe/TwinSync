"use client";

import Image from "next/image";
import styles from "../rooms.module.css";
import {
  DEFAULT_HOTBAR_ITEM_IDS,
  getItemIconPath,
  ITEM_DEFINITIONS
} from "../domain/items";

type BagOverlayProps = {
  hotbar: string[];
  selectedSlot: number;
  onSelectSlot: (slot: number) => void;
  onAssignItem: (slot: number, itemTypeId: string) => void;
  onClose: () => void;
};

export default function BagOverlay({
  hotbar,
  selectedSlot,
  onSelectSlot,
  onAssignItem,
  onClose
}: BagOverlayProps) {
  return (
    <div className={styles.gameOverlayBackdrop}>
      <section className={styles.bagWindow}>
        <div className={styles.modalHeader}>
          <div>
            <p className={styles.eyebrow}>Bag / Item Library</p>
            <h2>Select 3D item for hotbar slot {selectedSlot === 9 ? 0 : selectedSlot + 1}</h2>
          </div>
          <button className={styles.iconButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.bagHotbarSection}>
          {DEFAULT_HOTBAR_ITEM_IDS.map((_, index) => {
            const item = ITEM_DEFINITIONS.find((definition) => definition.id === hotbar[index]);
            const numberLabel = index === 9 ? "0" : String(index + 1);

            return (
              <button
                key={index}
                className={`${styles.bagSlot} ${selectedSlot === index ? styles.activeBagSlot : ""}`}
                onClick={() => onSelectSlot(index)}
              >
                <span>{numberLabel}</span>
                {item && (
                  <Image
                    className={styles.bagSlotIcon}
                    src={getItemIconPath(item.id)}
                    alt=""
                    width={38}
                    height={38}
                  />
                )}
                <strong>{item?.label ?? "Empty"}</strong>
              </button>
            );
          })}
        </div>

        <div className={styles.itemLibraryGrid}>
          {ITEM_DEFINITIONS.map((definition) => (
            <button
              key={definition.id}
              className={styles.libraryItem}
              onClick={() => onAssignItem(selectedSlot, definition.id)}
            >
              <Image
                className={styles.libraryItemPreview}
                src={getItemIconPath(definition.id)}
                alt=""
                width={64}
                height={64}
              />
              <strong>{definition.label}</strong>
              <small>{definition.width} × {definition.length} × {definition.height} grid</small>
              <small>{definition.category} / {definition.mount}</small>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
