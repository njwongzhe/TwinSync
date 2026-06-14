"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "../rooms.module.css";
import {
  DEFAULT_HOTBAR_ITEM_IDS,
  getItemIconPath,
  ITEM_DEFINITIONS
} from "../domain/items";
import { ItemDefinition } from "../domain/types";

type BagOverlayProps = {
  hotbar: string[];
  selectedSlot: number;
  onSelectSlot: (slot: number) => void;
  onAssignItem: (slot: number, itemTypeId: string) => void;
  onClose: () => void;
};

function loadCustomModels() {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem("twinsync-custom-models");
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

export default function BagOverlay({
  hotbar,
  selectedSlot,
  onSelectSlot,
  onAssignItem,
  onClose
}: BagOverlayProps) {
  const [customModels] = useState<ItemDefinition[]>(loadCustomModels);

  const allModels = [...ITEM_DEFINITIONS, ...customModels];

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
            const item = allModels.find((definition) => definition.id === hotbar[index]);
            const numberLabel = index === 9 ? "0" : String(index + 1);

            return (
              <button
                key={index}
                className={`${styles.bagSlot} ${selectedSlot === index ? styles.activeBagSlot : ""}`}
                onClick={() => onSelectSlot(index)}
              >
                <span className={styles.bagSlotNumber}>{numberLabel}</span>
                {item && (
                  <span className={styles.bagSlotIconFrame}>
                    {item.icon ? (
                      <span className={styles.generatedItemIcon} aria-hidden="true">
                        {item.icon}
                      </span>
                    ) : (
                      <Image
                        className={styles.bagSlotIcon}
                        src={getItemIconPath(item.id)}
                        alt=""
                        width={30}
                        height={30}
                      />
                    )}
                  </span>
                )}
                <strong>{item?.label ?? "Empty"}</strong>
              </button>
            );
          })}
        </div>

        <div className={styles.itemLibraryGrid}>
          {allModels.map((definition) => (
            <button
              key={definition.id}
              className={styles.libraryItem}
              onClick={() => onAssignItem(selectedSlot, definition.id)}
            >
              {definition.icon ? (
                <span style={{ fontSize: "2.8rem", display: "flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, minHeight: 64, overflow: "hidden", flexShrink: 0, lineHeight: 1, borderRadius: 8, margin: "0 auto" }}>
                  {definition.icon}
                </span>
              ) : (
                <Image
                  className={styles.libraryItemPreview}
                  src={getItemIconPath(definition.id)}
                  alt=""
                  width={64}
                  height={64}
                />
              )}
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
