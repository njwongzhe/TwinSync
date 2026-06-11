import {
  calculateRoomKpi,
  DigitalTwinRoom,
  getItemDefinition,
  RoomEnvironmentReading
} from "@/features/rooms";

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

type OperatingPhase = {
  label: string;
  loadFactor: number;
  temperatureDelta: number;
  humidityDelta: number;
  occupancyPercent: number;
};

const OPERATING_PHASES: OperatingPhase[] = [
  {
    label: "Early startup",
    loadFactor: 0.62,
    temperatureDelta: -0.5,
    humidityDelta: 2,
    occupancyPercent: 24
  },
  {
    label: "Arrival ramp",
    loadFactor: 0.88,
    temperatureDelta: 0.2,
    humidityDelta: 3,
    occupancyPercent: 56
  },
  {
    label: "Peak activity",
    loadFactor: 1.24,
    temperatureDelta: 1.9,
    humidityDelta: 6,
    occupancyPercent: 92
  },
  {
    label: "Cooling response",
    loadFactor: 1.15,
    temperatureDelta: 0.8,
    humidityDelta: 1,
    occupancyPercent: 84
  },
  {
    label: "Stable operation",
    loadFactor: 0.94,
    temperatureDelta: 0,
    humidityDelta: 0,
    occupancyPercent: 68
  },
  {
    label: "Low activity",
    loadFactor: 0.48,
    temperatureDelta: -0.7,
    humidityDelta: -3,
    occupancyPercent: 18
  },
  {
    label: "Thermal drift",
    loadFactor: 1.08,
    temperatureDelta: 3.5,
    humidityDelta: 9,
    occupancyPercent: 76
  },
  {
    label: "Recovery",
    loadFactor: 0.78,
    temperatureDelta: 0.6,
    humidityDelta: 2,
    occupancyPercent: 42
  }
];

const LAYOUT_PROFILES: Record<DigitalTwinRoom["layoutType"], {
  baseTemperatureC: number;
  baseHumidityPercent: number;
  utilization: number;
  phaseOffset: number;
}> = {
  empty: {
    baseTemperatureC: 22.8,
    baseHumidityPercent: 47,
    utilization: 0.12,
    phaseOffset: 0
  },
  "computer-lab": {
    baseTemperatureC: 25.1,
    baseHumidityPercent: 53,
    utilization: 0.72,
    phaseOffset: 2
  },
  "study-room": {
    baseTemperatureC: 23.6,
    baseHumidityPercent: 50,
    utilization: 0.44,
    phaseOffset: 6
  },
  office: {
    baseTemperatureC: 24.2,
    baseHumidityPercent: 48,
    utilization: 0.58,
    phaseOffset: 4
  }
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

function incidentAt(cycle: number, roomIndex: number) {
  const incidentCycle = (cycle % 36 + 36) % 36;

  if (incidentCycle === 6 && roomIndex === 0) {
    return {
      label: "Thermal and load incident",
      temperatureDelta: 5.8,
      humidityDelta: 0,
      loadFactor: 1.85
    };
  }

  if (incidentCycle === 24) {
    if (roomIndex === 0) {
      return {
        label: "Critical cooling incident",
        temperatureDelta: 6.2,
        humidityDelta: 0,
        loadFactor: 1
      };
    }

    if (roomIndex === 1) {
      return {
        label: "Critical humidity incident",
        temperatureDelta: 0,
        humidityDelta: 27,
        loadFactor: 1
      };
    }

    if (roomIndex === 2) {
      return {
        label: "Critical load incident",
        temperatureDelta: 0,
        humidityDelta: 0,
        loadFactor: 2.15
      };
    }
  }

  return {
    label: null,
    temperatureDelta: 0,
    humidityDelta: 0,
    loadFactor: 1
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
