import { DigitalTwinRoom, ItemDefinition, PlacedItem, Vector3Data } from "./types";
import { getItemDefinition, GRID_SIZE } from "./items";

export function roundToGrid(value: number) {
  const rounded = Math.round(value / GRID_SIZE) * GRID_SIZE;
  return Math.round(rounded * 100) / 100;
}

export function snapVectorToGrid(position: Vector3Data): Vector3Data {
  return {
    x: roundToGrid(position.x),
    y: position.y,
    z: roundToGrid(position.z)
  };
}

export function getFootprint(definition: ItemDefinition, rotationY: number) {
  const normalizedAngle = Math.abs(Math.round(rotationY / (Math.PI / 2))) % 2;

  if (normalizedAngle === 1) {
    return {
      width: definition.length,
      length: definition.width
    };
  }

  return {
    width: definition.width,
    length: definition.length
  };
}

function rangesOverlap(aMin: number, aMax: number, bMin: number, bMax: number) {
  return aMin < bMax && aMax > bMin;
}

function itemBox(item: PlacedItem, definition: ItemDefinition) {
  const footprint = getFootprint(definition, item.rotationY);

  return {
    minX: item.position.x - footprint.width / 2,
    maxX: item.position.x + footprint.width / 2,
    minY: item.position.y - definition.height / 2,
    maxY: item.position.y + definition.height / 2,
    minZ: item.position.z - footprint.length / 2,
    maxZ: item.position.z + footprint.length / 2
  };
}

export function isInsideRoom(room: DigitalTwinRoom, definition: ItemDefinition, position: Vector3Data, rotationY: number) {
  const footprint = getFootprint(definition, rotationY);
  const halfRoomWidth = room.width / 2;
  const halfRoomLength = room.length / 2;

  return (
    position.x - footprint.width / 2 >= -halfRoomWidth &&
    position.x + footprint.width / 2 <= halfRoomWidth &&
    position.z - footprint.length / 2 >= -halfRoomLength &&
    position.z + footprint.length / 2 <= halfRoomLength &&
    position.y + definition.height / 2 <= room.height + 0.01 &&
    position.y - definition.height / 2 >= -0.01
  );
}

export function canPlaceItem(
  room: DigitalTwinRoom,
  definition: ItemDefinition,
  position: Vector3Data,
  rotationY: number,
  ignoreItemId?: string
) {
  if (!isInsideRoom(room, definition, position, rotationY)) {
    return false;
  }

  const candidate: PlacedItem = {
    id: "candidate",
    itemTypeId: definition.id,
    name: definition.label,
    position,
    rotationY,
    status: "off",
    powerWatt: definition.defaultPowerWatt ?? 0,
    alerts: [],
    createdAt: "",
    updatedAt: ""
  };

  const candidateBox = itemBox(candidate, definition);

  return !room.items.some((item) => {
    if (item.id === ignoreItemId) {
      return false;
    }

    const existingDefinition = getItemDefinition(item.itemTypeId);

    if (!existingDefinition) {
      return false;
    }

    const existingBox = itemBox(item, existingDefinition);

    return (
      rangesOverlap(candidateBox.minX, candidateBox.maxX, existingBox.minX, existingBox.maxX) &&
      rangesOverlap(candidateBox.minY, candidateBox.maxY, existingBox.minY, existingBox.maxY) &&
      rangesOverlap(candidateBox.minZ, candidateBox.maxZ, existingBox.minZ, existingBox.maxZ)
    );
  });
}

export function createPlacedItem(definition: ItemDefinition, position: Vector3Data, rotationY: number): PlacedItem {
  const now = new Date().toISOString();
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${definition.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return {
    id,
    itemTypeId: definition.id,
    name: definition.label,
    position,
    rotationY,
    status: "off",
    powerWatt: definition.defaultPowerWatt ?? 0,
    alerts: [],
    createdAt: now,
    updatedAt: now
  };
}
