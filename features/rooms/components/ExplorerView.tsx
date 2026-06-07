"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import styles from "../rooms.module.css";
import {
  DEFAULT_HOTBAR_ITEM_IDS,
  getItemDefinition
} from "../domain/items";
import { createPlacedItem } from "../domain/grid";
import { calculateRoomKpi } from "../domain/kpi";
import {
  DigitalTwinRoom,
  PlacedItem,
  PlacementPreview,
  RoomEnvironmentReading
} from "../domain/types";
import BagOverlay from "./BagOverlay";
import DeviceControlPanel from "./DeviceControlPanel";
import ExplorerHud from "./explorer/ExplorerHud";
import PlayerController from "./explorer/PlayerController";
import RoomScene from "./explorer/RoomScene";

type ExplorerViewProps = {
  room: DigitalTwinRoom;
  environment?: RoomEnvironmentReading;
  onRoomChange: (room: DigitalTwinRoom) => void;
  onExit: () => void;
};

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

function numberKeyToSlot(key: string) {
  if (key === "0") {
    return 9;
  }

  const number = Number(key);
  if (Number.isInteger(number) && number >= 1 && number <= 9) {
    return number - 1;
  }

  return null;
}

export default function ExplorerView({
  room,
  environment,
  onRoomChange,
  onExit
}: ExplorerViewProps) {
  const [hotbar, setHotbar] = useState<string[]>(DEFAULT_HOTBAR_ITEM_IDS);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [bagSlot, setBagSlot] = useState(0);
  const [showBag, setShowBag] = useState(false);
  const [selectedControlItemId, setSelectedControlItemId] = useState<string | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [placementPreview, setPlacementPreview] = useState<PlacementPreview | null>(null);
  const [previewRotation, setPreviewRotation] = useState(0);
  const [isRightMouseDown, setIsRightMouseDown] = useState(false);
  const [pointerLocked, setPointerLocked] = useState(false);
  const selectedSlotRef = useRef(selectedSlot);
  const placementPreviewRef = useRef(placementPreview);
  const selectedControlItemIdRef = useRef(selectedControlItemId);
  const showBagRef = useRef(showBag);
  const pointerLockedRef = useRef(pointerLocked);
  const resumePointerLockOnEscapeReleaseRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const selectedItemTypeId = selectedSlot === null ? null : hotbar[selectedSlot] ?? null;
  const selectedDefinition = selectedItemTypeId ? getItemDefinition(selectedItemTypeId) ?? null : null;
  const selectedControlItem = room.items.find((item) => item.id === selectedControlItemId) ?? null;
  const kpi = useMemo(() => calculateRoomKpi(room), [room]);
  const controlsEnabled = !showBag && !selectedControlItemId;

  useEffect(() => {
    selectedSlotRef.current = selectedSlot;
    placementPreviewRef.current = placementPreview;
    selectedControlItemIdRef.current = selectedControlItemId;
    showBagRef.current = showBag;
    pointerLockedRef.current = pointerLocked;
  }, [placementPreview, pointerLocked, selectedControlItemId, selectedSlot, showBag]);

  useEffect(() => {
    function handlePointerLockChange() {
      const isLocked = document.pointerLockElement !== null;
      pointerLockedRef.current = isLocked;
      setPointerLocked(isLocked);
      setIsRightMouseDown(false);
    }

    document.addEventListener("pointerlockchange", handlePointerLockChange);
    handlePointerLockChange();

    return () => document.removeEventListener("pointerlockchange", handlePointerLockChange);
  }, []);

  useEffect(() => {
    if ((showBag || selectedControlItemId) && document.pointerLockElement) {
      document.exitPointerLock?.();
    }
  }, [selectedControlItemId, showBag]);

  const resumePointerLock = useCallback(() => {
    const canvas = canvasRef.current;

    if (
      canvas &&
      !showBagRef.current &&
      !selectedControlItemIdRef.current &&
      document.pointerLockElement !== canvas
    ) {
      canvas.requestPointerLock?.();
    }
  }, []);

  const closeBagAndResume = useCallback(() => {
    showBagRef.current = false;
    setShowBag(false);
    resumePointerLock();
  }, [resumePointerLock]);

  const closeControlPanelAndResume = useCallback(() => {
    selectedControlItemIdRef.current = null;
    setSelectedControlItemId(null);
    resumePointerLock();
  }, [resumePointerLock]);

  const updateRoomItems = useCallback((items: PlacedItem[]) => {
    onRoomChange({
      ...room,
      items,
      updatedAt: new Date().toISOString()
    });
  }, [onRoomChange, room]);

  const placeSelectedItem = useCallback(() => {
    if (!pointerLockedRef.current || !selectedDefinition || !placementPreviewRef.current?.placeable) {
      return;
    }

    const newItem = createPlacedItem(
      selectedDefinition,
      placementPreviewRef.current.position,
      placementPreviewRef.current.rotationY
    );

    updateRoomItems([...room.items, newItem]);
  }, [room.items, selectedDefinition, updateRoomItems]);

  const removeItem = useCallback((itemId: string | null) => {
    if (!itemId) {
      return;
    }

    updateRoomItems(room.items.filter((item) => item.id !== itemId));

    if (selectedControlItemIdRef.current === itemId) {
      setSelectedControlItemId(null);
    }
  }, [room.items, updateRoomItems]);

  const updateItem = useCallback((itemId: string, patch: Partial<PlacedItem>) => {
    updateRoomItems(room.items.map((item) => {
      if (item.id !== itemId) {
        return item;
      }

      return {
        ...item,
        ...patch,
        updatedAt: new Date().toISOString()
      };
    }));
  }, [room.items, updateRoomItems]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();

        if (selectedControlItemIdRef.current) {
          selectedControlItemIdRef.current = null;
          setSelectedControlItemId(null);
          resumePointerLockOnEscapeReleaseRef.current = true;
          return;
        }

        if (showBagRef.current) {
          showBagRef.current = false;
          setShowBag(false);
          resumePointerLockOnEscapeReleaseRef.current = true;
          return;
        }

        if (pointerLockedRef.current) {
          document.exitPointerLock?.();
          return;
        }

        onExit();
        return;
      }

      if (isTypingTarget(event.target)) {
        return;
      }

      if (showBagRef.current || selectedControlItemIdRef.current) {
        return;
      }

      const slot = numberKeyToSlot(event.key);

      if (slot !== null) {
        event.preventDefault();
        setSelectedSlot((currentSlot) => currentSlot === slot ? null : slot);
        return;
      }

      if (event.key.toLowerCase() === "b") {
        event.preventDefault();
        setBagSlot(selectedSlotRef.current ?? 0);
        setShowBag(true);
        return;
      }

      if (event.key.toLowerCase() === "q") {
        event.preventDefault();
        placeSelectedItem();
        return;
      }

      if (event.key.toLowerCase() === "e" && pointerLockedRef.current) {
        event.preventDefault();
        removeItem(hoveredItemId);
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (
        event.key === "Escape" &&
        resumePointerLockOnEscapeReleaseRef.current
      ) {
        event.preventDefault();
        resumePointerLockOnEscapeReleaseRef.current = false;
        resumePointerLock();
      }
    }

    function handleMouseDown(event: MouseEvent) {
      if (event.button === 2 && pointerLockedRef.current) {
        setIsRightMouseDown(true);
      }
    }

    function handleMouseUp(event: MouseEvent) {
      if (event.button === 2) {
        setIsRightMouseDown(false);
      }
    }

    function preventContextMenu(event: MouseEvent) {
      event.preventDefault();
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("contextmenu", preventContextMenu);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("contextmenu", preventContextMenu);
    };
  }, [hoveredItemId, onExit, placeSelectedItem, removeItem, resumePointerLock]);

  useEffect(() => {
    let frameId = 0;

    function rotatePreview() {
      if (isRightMouseDown && selectedDefinition && selectedDefinition.mount !== "wall") {
        setPreviewRotation((currentRotation) => currentRotation + 0.03);
      }

      frameId = requestAnimationFrame(rotatePreview);
    }

    frameId = requestAnimationFrame(rotatePreview);

    return () => cancelAnimationFrame(frameId);
  }, [isRightMouseDown, selectedDefinition]);

  function handleCanvasPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || !pointerLockedRef.current || !hoveredItemId) {
      return;
    }

    setSelectedControlItemId(hoveredItemId);
  }

  return (
    <main className={styles.explorerShell}>
      <Canvas
        className={styles.roomCanvas}
        camera={{ position: [0, 1.8, room.length / 2 - 2], fov: 70 }}
        onPointerDown={handleCanvasPointerDown}
        onCreated={({ gl }) => {
          canvasRef.current = gl.domElement;
          gl.domElement.requestPointerLock?.();
        }}
        shadows="percentage"
      >
        <color attach="background" args={["#e0f2fe"]} />
        <hemisphereLight args={["#e0f2fe", "#5b3a20", 0.7]} />
        <ambientLight intensity={0.35} />
        <directionalLight
          position={[4, 8, 4]}
          intensity={1.05}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <RoomScene
          room={room}
          selectedDefinition={selectedDefinition}
          previewRotation={previewRotation}
          onHoverItem={setHoveredItemId}
          onPlacementPreview={setPlacementPreview}
        />
        <PlayerController room={room} controlsEnabled={controlsEnabled} />
      </Canvas>

      <ExplorerHud
        room={room}
        kpi={kpi}
        hotbar={hotbar}
        selectedSlot={selectedSlot}
        selectedDefinition={selectedDefinition}
        placementPreview={placementPreview}
        pointerLocked={pointerLocked}
        environment={environment}
        onExit={onExit}
      />

      {showBag && (
        <BagOverlay
          hotbar={hotbar}
          selectedSlot={bagSlot}
          onSelectSlot={setBagSlot}
          onAssignItem={(slot, itemTypeId) => {
            setHotbar((currentHotbar) => currentHotbar.map((value, index) => index === slot ? itemTypeId : value));
            setSelectedSlot(slot);
          }}
          onClose={closeBagAndResume}
        />
      )}

      {selectedControlItem && (
        <DeviceControlPanel
          item={selectedControlItem}
          onClose={closeControlPanelAndResume}
          onUpdate={(patch) => updateItem(selectedControlItem.id, patch)}
          onRemove={() => removeItem(selectedControlItem.id)}
        />
      )}
    </main>
  );
}
