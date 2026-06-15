import { DigitalTwinRoom } from "@/features/rooms";

export type IncidentData = {
  label: string | null;
  temperatureDelta: number;
  humidityDelta: number;
  loadFactor: number;
};

export type OperatingPhase = {
  label: string;
  loadFactor: number;
  temperatureDelta: number;
  humidityDelta: number;
  occupancyPercent: number;
};

export const ALERT_CYCLES = [6, 24];

export const OPERATING_PHASES: OperatingPhase[] = [
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

export const LAYOUT_PROFILES: Record<DigitalTwinRoom["layoutType"], {
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

export const isAlertingCycle = (c: number): boolean => {
  const mod = (c % 36 + 36) % 36;
  return ALERT_CYCLES.includes(mod);
};

export const incidentAt = (cycle: number, roomIndex: number): IncidentData => {
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
};

export const getNextNormalCycle = (current: number): number => {
  let next = current + 1;
  while (isAlertingCycle(next)) {
    next++;
  }
  return next;
};

export const getRandomNormalCycle = (current: number): number => {
  const normalIndices = [
    0, 1, 2, 3, 4, 5,
    7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
    25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35
  ];
  const randomIndex = normalIndices[Math.floor(Math.random() * normalIndices.length)];
  return Math.floor(current / 36) * 36 + randomIndex;
};

export const getRandomAlertCycle = (current: number): number => {
  const randomIndex = ALERT_CYCLES[Math.floor(Math.random() * ALERT_CYCLES.length)];
  return Math.floor(current / 36) * 36 + randomIndex;
};

export const getNextAlertCycle = (current: number): number => {
  const mod = (current % 36 + 36) % 36;
  if (mod === 6) {
    return Math.floor(current / 36) * 36 + 24;
  } else if (mod < 6) {
    return Math.floor(current / 36) * 36 + 6;
  } else if (mod < 24) {
    return Math.floor(current / 36) * 36 + 24;
  } else {
    return (Math.floor(current / 36) + 1) * 36 + 6;
  }
};
