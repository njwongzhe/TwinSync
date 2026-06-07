import { DigitalTwinRoom, RoomLayoutType } from "./types";
import { createPlacedItem } from "./grid";
import { getItemDefinition } from "./items";

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function place(
  itemTypeId: string,
  x: number,
  y: number,
  z: number,
  rotationY = 0
) {
  const definition = getItemDefinition(itemTypeId);

  if (!definition) {
    throw new Error(`Missing item definition: ${itemTypeId}`);
  }

  return createPlacedItem(definition, { x, y, z }, rotationY);
}

export function createRoom(params: {
  name: string;
  width: number;
  length: number;
  height: number;
  layoutType: RoomLayoutType;
  cloneFrom?: DigitalTwinRoom | null;
}): DigitalTwinRoom {
  const now = new Date().toISOString();

  if (params.cloneFrom) {
    return {
      ...params.cloneFrom,
      id: createId("room"),
      name: params.name,
      width: params.width,
      length: params.length,
      height: params.height,
      layoutType: params.cloneFrom.layoutType,
      items: params.cloneFrom.items.map((item) => ({
        ...item,
        id: createId("item"),
        position: {
          ...item.position,
          y: getItemDefinition(item.itemTypeId)?.mount === "ceiling"
            ? params.height - (getItemDefinition(item.itemTypeId)?.height ?? 0) / 2
            : item.position.y
        },
        createdAt: now,
        updatedAt: now
      })),
      createdAt: now,
      updatedAt: now
    };
  }

  const room: DigitalTwinRoom = {
    id: createId("room"),
    name: params.name,
    width: params.width,
    length: params.length,
    height: params.height,
    layoutType: params.layoutType,
    items: [],
    createdAt: now,
    updatedAt: now
  };

  room.items = createDefaultItems(
    params.layoutType,
    params.height,
    params.width,
    params.length
  );

  return room;
}

export function createDefaultItems(
  layoutType: RoomLayoutType,
  roomHeight = 4,
  roomWidth = 12,
  roomLength = 12
) {
  const halfWidth = roomWidth / 2;
  const halfLength = roomLength / 2;
  const upperWallHeight = Math.max(2.2, roomHeight - 0.7);
  const grid = (value: number) => Math.round(value);

  function definitionFor(itemTypeId: string) {
    const definition = getItemDefinition(itemTypeId);

    if (!definition) {
      throw new Error(`Missing item definition: ${itemTypeId}`);
    }

    return definition;
  }

  function floor(itemTypeId: string, x: number, z: number, rotationY = 0) {
    const definition = definitionFor(itemTypeId);
    return place(itemTypeId, grid(x), definition.height / 2, grid(z), rotationY);
  }

  function ceiling(itemTypeId: string, x: number, z: number, rotationY = 0) {
    const definition = definitionFor(itemTypeId);
    return place(
      itemTypeId,
      grid(x),
      roomHeight - definition.height / 2,
      grid(z),
      rotationY
    );
  }

  function northWall(itemTypeId: string, x: number, y: number) {
    const definition = definitionFor(itemTypeId);
    return place(
      itemTypeId,
      grid(x),
      y,
      -halfLength + definition.length / 2
    );
  }

  function southWall(itemTypeId: string, x: number, y: number) {
    const definition = definitionFor(itemTypeId);
    return place(
      itemTypeId,
      grid(x),
      y,
      halfLength - definition.length / 2,
      Math.PI
    );
  }

  function westWall(itemTypeId: string, z: number, y: number) {
    const definition = definitionFor(itemTypeId);
    return place(
      itemTypeId,
      -halfWidth + definition.length / 2,
      y,
      grid(z),
      Math.PI / 2
    );
  }

  function eastWall(itemTypeId: string, z: number, y: number) {
    const definition = definitionFor(itemTypeId);
    return place(
      itemTypeId,
      halfWidth - definition.length / 2,
      y,
      grid(z),
      -Math.PI / 2
    );
  }

  if (layoutType === "computer-lab") {
    const deskColumns = roomWidth >= 10
      ? [-halfWidth + 2, 0, halfWidth - 2]
      : [-halfWidth + 1.5, halfWidth - 1.5];
    const deskRows = roomLength >= 10 ? [-3, 0, 3] : [-2, 1];
    const workstations = deskRows.flatMap((z) => (
      deskColumns.flatMap((x) => [
        floor("desk-desktop", x, z),
        floor("office-chair", x, z + 1, Math.PI)
      ])
    ));

    return [
      ...workstations,
      ceiling("projector", 0, -halfLength / 3),
      ceiling("ceiling-light", -roomWidth / 4, -roomLength / 4),
      ceiling("ceiling-light", roomWidth / 4, -roomLength / 4),
      ceiling("ceiling-light", -roomWidth / 4, roomLength / 4),
      ceiling("ceiling-light", roomWidth / 4, roomLength / 4),
      eastWall("wall-ac", 0, upperWallHeight),
      northWall("whiteboard", 0, 1.8),
      westWall("door", halfLength - 1.5, 1.1)
    ];
  }

  if (layoutType === "study-room") {
    const sideTable = roomWidth >= 9 && roomLength >= 9
      ? [floor("small-table", halfWidth - 1.5, halfLength - 1.5)]
      : [];

    return [
      floor("long-table", 0, 0),
      floor("office-chair", -1, -1.5),
      floor("office-chair", 1, -1.5),
      floor("office-chair", -1, 1.5, Math.PI),
      floor("office-chair", 1, 1.5, Math.PI),
      ...sideTable,
      ceiling("ceiling-fan", 0, 0),
      ceiling("ceiling-light", -roomWidth / 4, -roomLength / 4),
      ceiling("ceiling-light", roomWidth / 4, -roomLength / 4),
      ceiling("ceiling-light", -roomWidth / 4, roomLength / 4),
      ceiling("ceiling-light", roomWidth / 4, roomLength / 4),
      eastWall("wall-ac", 0, upperWallHeight),
      northWall("whiteboard", 0, 1.8),
      southWall("window", -roomWidth / 4, 2),
      westWall("door", halfLength - 1.5, 1.1)
    ];
  }

  if (layoutType === "office") {
    const meetingArea = roomWidth >= 9 && roomLength >= 9
      ? [
          floor("long-table", 0, roomLength / 4),
          floor("office-chair", -1, roomLength / 4 - 2),
          floor("office-chair", 1, roomLength / 4 - 2),
          floor("office-chair", -1, roomLength / 4 + 2, Math.PI),
          floor("office-chair", 1, roomLength / 4 + 2, Math.PI)
        ]
      : [];

    return [
      floor("desk-desktop", -roomWidth / 4, -roomLength / 4),
      floor("office-chair", -roomWidth / 4, -roomLength / 4 + 1, Math.PI),
      floor("desk-desktop", roomWidth / 4, -roomLength / 4),
      floor("office-chair", roomWidth / 4, -roomLength / 4 + 1, Math.PI),
      ...meetingArea,
      floor("printer", halfWidth - 1, halfLength - 1),
      ceiling("ceiling-light", -roomWidth / 4, -roomLength / 4),
      ceiling("ceiling-light", roomWidth / 4, -roomLength / 4),
      ceiling("ceiling-light", 0, roomLength / 4),
      eastWall("wall-ac", 0, upperWallHeight),
      northWall("whiteboard", 0, 1.8),
      southWall("window", roomWidth / 4, 2),
      westWall("door", halfLength - 1.5, 1.1)
    ];
  }

  return [];
}

export function createInitialRooms(): DigitalTwinRoom[] {
  return [
    createRoom({
      name: "Computer Lab A",
      width: 12,
      length: 12,
      height: 4,
      layoutType: "computer-lab"
    }),
    createRoom({
      name: "Study Room 1",
      width: 10,
      length: 10,
      height: 4,
      layoutType: "study-room"
    })
  ];
}
