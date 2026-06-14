export type RoomLayoutType = "empty" | "computer-lab" | "study-room" | "office";

export type ItemCategory = "furniture" | "device" | "structure";

export type ItemMountType = "floor" | "wall" | "ceiling";

export type DeviceStatus = "on" | "off" | "fault";

export type Vector3Data = {
  x: number;
  y: number;
  z: number;
};

export type ItemMeshDefinition = {
  shape: "box" | "cylinder" | "sphere";
  args: number[];
  position: number[];
  rotation?: number[];
  color: string;
};

export type ItemDefinition = {
  id: string;
  label: string;
  category: ItemCategory;
  mount: ItemMountType;
  width: number;
  length: number;
  height: number;
  color: string;
  isDevice: boolean;
  canHoldItems?: boolean;
  defaultPowerWatt?: number;
  description: string;
  meshes?: ItemMeshDefinition[];
  icon?: string;
};

export type PlacedItem = {
  id: string;
  itemTypeId: string;
  name: string;
  position: Vector3Data;
  rotationY: number;
  status: DeviceStatus;
  powerWatt: number;
  alerts: string[];
  createdAt: string;
  updatedAt: string;
};

export type DigitalTwinRoom = {
  id: string;
  name: string;
  width: number;
  length: number;
  height: number;
  layoutType: RoomLayoutType;
  items: PlacedItem[];
  createdAt: string;
  updatedAt: string;
};

export type RoomKpi = {
  totalDevices: number;
  activeDevices: number;
  faultDevices: number;
  totalAlerts: number;
  estimatedPowerWatt: number;
  efficiencyScore: number;
};

export type RoomEnvironmentReading = {
  roomId: string;
  roomName: string;
  temperatureC: number;
  humidityPercent: number;
  livePowerWatt: number;
  occupancyPercent: number;
  temperatureStatus: "cool" | "comfortable" | "warm" | "hot";
  temperatureTrend: "falling" | "stable" | "rising";
  sensorStatus: "online" | "degraded";
  phase: string;
};

export type PlacementPreview = {
  position: Vector3Data;
  rotationY: number;
  placeable: boolean;
  supportItemId?: string;
};
