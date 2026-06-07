import { DigitalTwinRoom } from "./types";
import { createInitialRooms } from "./layouts";
import { getItemDefinition } from "./items";

const STORAGE_KEY = "twinsync-digital-twin-rooms-v1";

function normalizeRoomItems(rooms: DigitalTwinRoom[]) {
  return rooms.map((room) => ({
    ...room,
    items: room.items.filter((item) => item.itemTypeId !== "storage-cabinet").map((item) => {
      const definition = getItemDefinition(item.itemTypeId);
      const status = (item.status as string) === "standby" ? "off" : item.status;

      return {
        ...item,
        status,
        position: definition?.mount === "ceiling"
          ? {
              ...item.position,
              y: room.height - definition.height / 2
            }
          : item.position
      };
    })
  }));
}

export function loadRoomsFromLocalStorage(): DigitalTwinRoom[] {
  if (typeof window === "undefined") {
    return [];
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);

  if (!rawValue) {
    const rooms = createInitialRooms();
    saveRoomsToLocalStorage(rooms);
    return rooms;
  }

  try {
    const parsed = JSON.parse(rawValue) as DigitalTwinRoom[];
    return Array.isArray(parsed) ? normalizeRoomItems(parsed) : createInitialRooms();
  } catch {
    return createInitialRooms();
  }
}

export function saveRoomsToLocalStorage(rooms: DigitalTwinRoom[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms, null, 2));
}

export function exportRoomsToJsonFile(rooms: DigitalTwinRoom[]) {
  const blob = new Blob([JSON.stringify(rooms, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `twinsync-rooms-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function importRoomsFromJsonFile(file: File): Promise<DigitalTwinRoom[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as DigitalTwinRoom[];

        if (!Array.isArray(parsed)) {
          reject(new Error("The selected JSON file does not contain a room list."));
          return;
        }

        resolve(normalizeRoomItems(parsed));
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
