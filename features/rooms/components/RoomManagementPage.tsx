"use client";

import { ChangeEvent, Dispatch, SetStateAction, useMemo, useRef, useState } from "react";
import styles from "../rooms.module.css";
import { DigitalTwinRoom, RoomEnvironmentReading } from "../domain/types";
import { calculateRoomKpi } from "../domain/kpi";
import { createRoom } from "../domain/layouts";
import {
  exportRoomsToJsonFile,
  importRoomsFromJsonFile
} from "../domain/storage";
import CreateRoomModal from "./CreateRoomModal";
import ExplorerView from "./ExplorerView";
import PanelView from "./PanelView";
import RoomCards from "./RoomCards";

type ViewMode = "cards" | "explore" | "panel";

type RoomManagementPageProps = {
  rooms: DigitalTwinRoom[];
  environmentReadings: RoomEnvironmentReading[];
  setRooms: Dispatch<SetStateAction<DigitalTwinRoom[]>>;
};

export default function RoomManagementPage({
  rooms,
  environmentReadings,
  setRooms
}: RoomManagementPageProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState("Demo data is saved in browser localStorage.");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedRoom = useMemo(() => {
    return rooms.find((room) => room.id === selectedRoomId) ?? rooms[0] ?? null;
  }, [rooms, selectedRoomId]);
  const selectedEnvironment = selectedRoom
    ? environmentReadings.find((reading) => reading.roomId === selectedRoom.id)
    : undefined;

  const summary = useMemo(() => {
    const totalRooms = rooms.length;
    const totalDevices = rooms.reduce((total, room) => total + calculateRoomKpi(room).totalDevices, 0);
    const activeDevices = rooms.reduce((total, room) => total + calculateRoomKpi(room).activeDevices, 0);
    const totalAlerts = rooms.reduce((total, room) => total + calculateRoomKpi(room).totalAlerts, 0);
    const estimatedPowerWatt = rooms.reduce((total, room) => total + calculateRoomKpi(room).estimatedPowerWatt, 0);

    return {
      totalRooms,
      totalDevices,
      activeDevices,
      totalAlerts,
      estimatedPowerWatt
    };
  }, [rooms]);

  function updateRoom(updatedRoom: DigitalTwinRoom) {
    setRooms((currentRooms) => {
      return currentRooms.map((room) => {
        if (room.id !== updatedRoom.id) {
          return room;
        }

        return {
          ...updatedRoom,
          updatedAt: new Date().toISOString()
        };
      });
    });
  }

  function deleteRoom(roomId: string) {
    setRooms((currentRooms) => currentRooms.filter((room) => room.id !== roomId));

    if (selectedRoomId === roomId) {
      setSelectedRoomId(null);
      setViewMode("cards");
    }
  }

  function handleCreateRoom(params: Parameters<typeof createRoom>[0]) {
    const newRoom = createRoom(params);
    setRooms((currentRooms) => [...currentRooms, newRoom]);
    setSelectedRoomId(newRoom.id);
    setShowCreateModal(false);
    setToast(`${newRoom.name} has been created.`);
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const importedRooms = await importRoomsFromJsonFile(file);
      setRooms(importedRooms);
      setSelectedRoomId(importedRooms[0]?.id ?? null);
      setToast("Rooms imported successfully from JSON file.");
    } catch {
      setToast("Unable to import the selected file. Please select a valid TwinSync room JSON file.");
    } finally {
      event.target.value = "";
    }
  }

  if (viewMode === "explore" && selectedRoom) {
    return (
      <ExplorerView
        room={selectedRoom}
        environment={selectedEnvironment}
        onRoomChange={updateRoom}
        onExit={() => setViewMode("cards")}
      />
    );
  }

  if (viewMode === "panel" && selectedRoom) {
    return (
      <PanelView
        room={selectedRoom}
        environment={selectedEnvironment}
        onBack={() => setViewMode("cards")}
        onExplore={() => setViewMode("explore")}
        onRoomChange={updateRoom}
      />
    );
  }

  return (
    <main className={styles.pageShell}>
      <section className={styles.heroSection}>
        <div>
          <p className={styles.eyebrow}>TwinSync / DIGITEX Demo</p>
          <h1 className={styles.pageTitle}>Room Monitoring, Control and 3D Management</h1>
          <p className={styles.pageSubtitle}>
            Manage rooms, inspect KPIs, explore room layouts in 3D, place devices with grid snapping,
            and control electronic devices using a front-end only digital twin demo.
          </p>
        </div>

        <div className={styles.heroActions}>
          <button className={styles.primaryButton} onClick={() => setShowCreateModal(true)}>
            + Create Room
          </button>
          <button className={styles.secondaryButton} onClick={() => exportRoomsToJsonFile(rooms)}>
            Export JSON
          </button>
          <button className={styles.secondaryButton} onClick={() => fileInputRef.current?.click()}>
            Import JSON
          </button>
          <input
            ref={fileInputRef}
            className={styles.hiddenInput}
            type="file"
            accept="application/json"
            onChange={handleImport}
          />
        </div>
      </section>

      <section className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span>Total Rooms</span>
          <strong>{summary.totalRooms}</strong>
        </div>
        <div className={styles.summaryCard}>
          <span>Active Devices</span>
          <strong>{summary.activeDevices}/{summary.totalDevices}</strong>
        </div>
        <div className={styles.summaryCard}>
          <span>Total Alerts</span>
          <strong>{summary.totalAlerts}</strong>
        </div>
        <div className={styles.summaryCard}>
          <span>Current Load</span>
          <strong>{summary.estimatedPowerWatt} W</strong>
        </div>
      </section>

      <div className={styles.toast}>{toast}</div>

      <RoomCards
        rooms={rooms}
        environmentReadings={environmentReadings}
        selectedRoomId={selectedRoom?.id ?? null}
        onSelectRoom={(roomId) => setSelectedRoomId(roomId)}
        onExplore={(roomId) => {
          setSelectedRoomId(roomId);
          setViewMode("explore");
        }}
        onPanel={(roomId) => {
          setSelectedRoomId(roomId);
          setViewMode("panel");
        }}
        onDelete={deleteRoom}
      />

      {showCreateModal && (
        <CreateRoomModal
          rooms={rooms}
          onCreate={handleCreateRoom}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </main>
  );
}
