import {
  calculateRoomKpi,
  DigitalTwinRoom,
  getItemDefinition,
  RoomEnvironmentReading
} from "@/features/rooms";
import {
  incidentAt,
  OPERATING_PHASES,
  LAYOUT_PROFILES
} from "./demo";

export const TELEMETRY_INTERVAL_MS = 8000;

export type RoomTelemetry = RoomEnvironmentReading & {
  powerDeltaPercent: number;
  criticalIncident: boolean;
};

export type TelemetryHistoryPoint = {
  label: string;
  totalPowerWatt: number;
  averageTemperatureC: number;
};

export type LiveTelemetrySnapshot = {
  cycle: number;
  generatedAt: string;
  phase: string;
  rooms: RoomTelemetry[];
  history: TelemetryHistoryPoint[];
  portfolio: {
    totalPowerWatt: number;
    averageTemperatureC: number;
    averageHumidityPercent: number;
    comfortableRooms: number;
    hottestRoomName: string | null;
    hottestTemperatureC: number;
    onlineSensors: number;
    totalSensors: number;
  };
};



function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function round(value: number, precision = 1) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function roomVariation(roomId: string) {
  let hash = 0;

  for (let index = 0; index < roomId.length; index += 1) {
    hash = (hash * 31 + roomId.charCodeAt(index)) % 997;
  }

  return (hash / 996 - 0.5) * 1.2;
}

function phaseAt(cycle: number, room: DigitalTwinRoom, roomIndex: number) {
  const profile = LAYOUT_PROFILES[room.layoutType];
  const phaseValue = cycle + profile.phaseOffset + roomIndex * 3;
  const phaseIndex = (
    phaseValue % OPERATING_PHASES.length +
    OPERATING_PHASES.length
  ) % OPERATING_PHASES.length;

  return {
    phase: OPERATING_PHASES[phaseIndex],
    phaseIndex
  };
}



function nominalRoomPower(room: DigitalTwinRoom) {
  return room.items.reduce((total, item) => {
    const definition = getItemDefinition(item.itemTypeId);
    return definition?.isDevice ? total + Math.max(item.powerWatt, 20) : total;
  }, 0);
}

function createRoomReading(
  room: DigitalTwinRoom,
  roomIndex: number,
  cycle: number
): RoomTelemetry {
  const profile = LAYOUT_PROFILES[room.layoutType];
  const { phase, phaseIndex } = phaseAt(cycle, room, roomIndex);
  const previousPhase = OPERATING_PHASES[
    (phaseIndex - 1 + OPERATING_PHASES.length) % OPERATING_PHASES.length
  ];
  const kpi = calculateRoomKpi(room);
  const variation = roomVariation(room.id);
  const incident = incidentAt(cycle, roomIndex);
  const previousIncident = incidentAt(cycle - 1, roomIndex);
  const poweredCooling = room.items.some((item) => (
    item.status === "on" &&
    ["wall-ac", "ceiling-ac"].includes(item.itemTypeId)
  ));
  const activeHeat = kpi.totalDevices === 0
    ? 0
    : kpi.activeDevices / kpi.totalDevices * 0.8;
  const coolingEffect = poweredCooling ? 1.4 : 0;
  const temperatureC = round(
    profile.baseTemperatureC +
    phase.temperatureDelta +
    variation +
    activeHeat -
    coolingEffect +
    incident.temperatureDelta
  );
  const humidityPercent = Math.round(clamp(
    profile.baseHumidityPercent +
    phase.humidityDelta +
    variation * 2 +
    incident.humidityDelta,
    28,
    78
  ));
  const nominalPower = Math.max(
    nominalRoomPower(room),
    room.width * room.length * 3
  );
  const controlledLoad = kpi.estimatedPowerWatt * 0.35;
  const livePowerWatt = Math.round(
    nominalPower * profile.utilization * phase.loadFactor * incident.loadFactor +
    controlledLoad +
    35 +
    Math.abs(variation) * 45
  );
  const previousPowerWatt = Math.round(
    nominalPower *
    profile.utilization *
    previousPhase.loadFactor *
    previousIncident.loadFactor +
    controlledLoad +
    35 +
    Math.abs(variation) * 45
  );
  const powerDeltaPercent = previousPowerWatt === 0
    ? 0
    : Math.round((livePowerWatt - previousPowerWatt) / previousPowerWatt * 100);
  const previousTemperature = profile.baseTemperatureC +
    previousPhase.temperatureDelta +
    variation +
    activeHeat -
    coolingEffect +
    previousIncident.temperatureDelta;
  const temperatureDifference = temperatureC - previousTemperature;
  const temperatureTrend: RoomEnvironmentReading["temperatureTrend"] = temperatureDifference > 0.35
    ? "rising"
    : temperatureDifference < -0.35
      ? "falling"
      : "stable";
  const temperatureStatus: RoomEnvironmentReading["temperatureStatus"] = temperatureC < 20
    ? "cool"
    : temperatureC <= 25.5
      ? "comfortable"
      : temperatureC < 28.5
        ? "warm"
        : "hot";
  const occupancyPercent = Math.round(clamp(
    phase.occupancyPercent + variation * 5,
    0,
    100
  ));
  const sensorStatus: RoomEnvironmentReading["sensorStatus"] = (
    (cycle + roomIndex * 5 + profile.phaseOffset) % 13 === 9
  ) ? "degraded" : "online";

  return {
    roomId: room.id,
    roomName: room.name,
    temperatureC,
    humidityPercent,
    livePowerWatt,
    powerDeltaPercent,
    criticalIncident: incident.label !== null,
    occupancyPercent,
    temperatureStatus,
    temperatureTrend,
    sensorStatus,
    phase: incident.label ?? phase.label
  };
}

export function createLiveTelemetrySnapshot(
  rooms: DigitalTwinRoom[],
  cycle: number,
  generatedAt = new Date()
): LiveTelemetrySnapshot {
  const roomReadings = rooms.map((room, index) => (
    createRoomReading(room, index, cycle)
  ));
  const totalPowerWatt = roomReadings.reduce(
    (total, room) => total + room.livePowerWatt,
    0
  );
  const averageTemperatureC = roomReadings.length === 0
    ? 0
    : round(roomReadings.reduce(
        (total, room) => total + room.temperatureC,
        0
      ) / roomReadings.length);
  const averageHumidityPercent = roomReadings.length === 0
    ? 0
    : Math.round(roomReadings.reduce(
        (total, room) => total + room.humidityPercent,
        0
      ) / roomReadings.length);
  const hottestRoom = roomReadings.reduce<RoomTelemetry | null>(
    (hottest, room) => (
      !hottest || room.temperatureC > hottest.temperatureC ? room : hottest
    ),
    null
  );
  const history = Array.from({ length: 12 }, (_, index) => {
    const cycleOffset = cycle - (11 - index);
    const readings = rooms.map((room, roomIndex) => (
      createRoomReading(room, roomIndex, cycleOffset)
    ));
    const historyPower = readings.reduce(
      (total, room) => total + room.livePowerWatt,
      0
    );
    const historyTemperature = readings.length === 0
      ? 0
      : round(readings.reduce(
          (total, room) => total + room.temperatureC,
          0
        ) / readings.length);

    return {
      label: index === 11 ? "Now" : `-${(11 - index) * 8}s`,
      totalPowerWatt: historyPower,
      averageTemperatureC: historyTemperature
    };
  });

  return {
    cycle,
    generatedAt: generatedAt.toISOString(),
    phase: OPERATING_PHASES[
      (cycle % OPERATING_PHASES.length + OPERATING_PHASES.length) %
      OPERATING_PHASES.length
    ].label,
    rooms: roomReadings,
    history,
    portfolio: {
      totalPowerWatt,
      averageTemperatureC,
      averageHumidityPercent,
      comfortableRooms: roomReadings.filter(
        (room) => room.temperatureStatus === "comfortable"
      ).length,
      hottestRoomName: hottestRoom?.roomName ?? null,
      hottestTemperatureC: hottestRoom?.temperatureC ?? 0,
      onlineSensors: roomReadings.filter(
        (room) => room.sensorStatus === "online"
      ).length,
      totalSensors: roomReadings.length
    }
  };
}
