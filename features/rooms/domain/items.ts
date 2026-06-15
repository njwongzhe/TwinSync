import { ItemDefinition } from "./types";

export const GRID_SIZE = 0.2;
export const MAJOR_GRID_EVERY = 5;

export const ITEM_DEFINITIONS: ItemDefinition[] = [
  {
    id: "desk-desktop",
    label: "Desk with Desktop",
    category: "device",
    mount: "floor",
    width: 2,
    length: 1,
    height: 1.35,
    color: "#8b5a2b",
    isDevice: true,
    canHoldItems: true,
    defaultPowerWatt: 180,
    description: "A working desk with a desktop computer. Useful for computer lab layouts."
  },
  {
    id: "wall-ac",
    label: "Wall Air Conditional",
    category: "device",
    mount: "wall",
    width: 2,
    length: 0.35,
    height: 0.6,
    color: "#dbeafe",
    isDevice: true,
    defaultPowerWatt: 950,
    description: "Wall mounted cooling device for rooms and labs."
  },
  {
    id: "ceiling-ac",
    label: "Ceiling Air Conditional",
    category: "device",
    mount: "ceiling",
    width: 2,
    length: 2,
    height: 0.35,
    color: "#bfdbfe",
    isDevice: true,
    defaultPowerWatt: 1200,
    description: "Ceiling mounted cooling device for larger rooms."
  },
  {
    id: "projector",
    label: "Projector",
    category: "device",
    mount: "ceiling",
    width: 1,
    length: 1,
    height: 0.45,
    color: "#334155",
    isDevice: true,
    defaultPowerWatt: 300,
    description: "Projection device for classroom, lab, or meeting room."
  },
  {
    id: "ceiling-light",
    label: "Ceiling Light LED",
    category: "device",
    mount: "ceiling",
    width: 1,
    length: 1,
    height: 0.15,
    color: "#fef08a",
    isDevice: true,
    defaultPowerWatt: 36,
    description: "LED ceiling light with on/off monitoring."
  },
  {
    id: "printer",
    label: "Printer",
    category: "device",
    mount: "floor",
    width: 1,
    length: 1,
    height: 0.75,
    color: "#64748b",
    isDevice: true,
    defaultPowerWatt: 90,
    description: "Printer device that can be monitored and controlled."
  },
  {
    id: "desktop",
    label: "Desktop",
    category: "device",
    mount: "floor",
    width: 1,
    length: 1,
    height: 0.7,
    color: "#0f172a",
    isDevice: true,
    defaultPowerWatt: 160,
    description: "Standalone desktop computer. It can also be placed on a table in this demo."
  },
  {
    id: "ceiling-fan",
    label: "Ceiling Fan",
    category: "device",
    mount: "ceiling",
    width: 2,
    length: 2,
    height: 0.55,
    color: "#94a3b8",
    isDevice: true,
    defaultPowerWatt: 70,
    description: "Ceiling fan for air circulation."
  },
  {
    id: "small-table",
    label: "Small Table",
    category: "furniture",
    mount: "floor",
    width: 2,
    length: 2,
    height: 0.85,
    color: "#a16207",
    isDevice: false,
    canHoldItems: true,
    description: "A small table that can hold small items on top."
  },
  {
    id: "long-table",
    label: "Long Table",
    category: "furniture",
    mount: "floor",
    width: 4,
    length: 1.5,
    height: 0.85,
    color: "#92400e",
    isDevice: false,
    canHoldItems: true,
    description: "A long table suitable for office and study room layouts."
  },
  {
    id: "whiteboard",
    label: "Whiteboard",
    category: "structure",
    mount: "wall",
    width: 3,
    length: 0.2,
    height: 1.6,
    color: "#f8fafc",
    isDevice: false,
    description: "A whiteboard for presentation or teaching spaces."
  },
  {
    id: "window",
    label: "Window",
    category: "structure",
    mount: "wall",
    width: 2,
    length: 0.18,
    height: 1.5,
    color: "#93c5fd",
    isDevice: false,
    description: "A room window."
  },
  {
    id: "door",
    label: "Door",
    category: "structure",
    mount: "wall",
    width: 1.2,
    length: 0.25,
    height: 2.2,
    color: "#7c2d12",
    isDevice: false,
    description: "A room door."
  },
  {
    id: "office-chair",
    label: "Office Chair",
    category: "furniture",
    mount: "floor",
    width: 1,
    length: 1,
    height: 1.6,
    color: "#1f2937",
    isDevice: false,
    description: "A wheeled office chair for workspaces, labs, and study rooms."
  }
];

export const DEFAULT_HOTBAR_ITEM_IDS = [
  "desk-desktop",
  "small-table",
  "long-table",
  "desktop",
  "printer",
  "ceiling-light",
  "projector",
  "wall-ac",
  "whiteboard",
  "door"
];

export function getItemDefinition(itemTypeId: string): ItemDefinition | undefined {
  const base = ITEM_DEFINITIONS.find((item) => item.id === itemTypeId);
  if (base) return base;

  if (typeof window !== "undefined") {
    try {
      const stored = window.localStorage.getItem("twinsync-custom-models");
      if (stored) {
        const customItems: ItemDefinition[] = JSON.parse(stored);
        return customItems.find((item) => item.id === itemTypeId);
      }
    } catch {
      // ignore
    }
  }
  return undefined;
}

export function getItemIconPath(itemTypeId: string) {
  const iconId = {
    "wall-ac": "wall-aircond",
    "ceiling-ac": "ceiling-aircond"
  }[itemTypeId] ?? itemTypeId;

  if (itemTypeId.startsWith("custom-")) {
    const def = getItemDefinition(itemTypeId);
    if (def) {
      if (def.category === "device") return "/item-icons/desktop.svg";
      if (def.category === "furniture") return "/item-icons/small-table.svg";
      return "/item-icons/whiteboard.svg";
    }
  }

  return `/item-icons/${iconId}.svg`;
}
