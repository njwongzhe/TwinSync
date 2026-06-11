import {
  calculateRoomKpi,
  DigitalTwinRoom,
  getItemDefinition
} from "@/features/rooms";
import { LiveTelemetrySnapshot } from "./telemetry";

export type AlertKind = "realtime" | "predictive";
export type AlertSeverity = "good" | "caution" | "warning" | "critical";
export type AlertCategory =
  | "device"
  | "energy"
  | "temperature"
  | "humidity"
  | "sensor"
  | "efficiency";

export type AlertMetric = {
  label: string;
  value: string;
  normalValue: string;
  deviationPercent: number;
};

export type TwinSyncAlert = {
  id: string;
  kind: AlertKind;
  severity: AlertSeverity;
  category: AlertCategory;
  roomId: string;
  roomName: string;
  itemName?: string;
  title: string;
  description: string;
  recommendation: string;
  metrics: AlertMetric[];
  detectedAt: string;
};

const NORMAL_TEMPERATURE_C = 23;
const NORMAL_HUMIDITY_PERCENT = 50;

export function calculatePortfolioSummary(rooms: DigitalTwinRoom[]) {
  const roomKpis = rooms.map((room) => calculateRoomKpi(room));
  const totalDevices = roomKpis.reduce((total, kpi) => total + kpi.totalDevices, 0);
  const activeDevices = roomKpis.reduce((total, kpi) => total + kpi.activeDevices, 0);
  const faultDevices = roomKpis.reduce((total, kpi) => total + kpi.faultDevices, 0);
  const efficiencyScore = rooms.length === 0
    ? 0
    : Math.round(roomKpis.reduce((total, kpi) => total + kpi.efficiencyScore, 0) / rooms.length);

  return {
    totalRooms: rooms.length,
    totalDevices,
    activeDevices,
    faultDevices,
    efficiencyScore
  };
}

function deviationPercent(value: number, normalValue: number) {
  if (normalValue === 0) {
    return 0;
  }

  return Math.round((value - normalValue) / normalValue * 100);
}

function metric(
  label: string,
  value: number,
  unit: string,
  normalValue: number,
  normalLabel?: string
): AlertMetric {
  return {
    label,
    value: `${value}${unit}`,
    normalValue: normalLabel ?? `${normalValue}${unit}`,
    deviationPercent: deviationPercent(value, normalValue)
  };
}

function temperatureSeverity(
  temperatureC: number,
  criticalIncident = false
): AlertSeverity {
  if (
    criticalIncident &&
    (temperatureC >= 30 || temperatureC <= 16.5)
  ) return "critical";
  if (temperatureC >= 27 || temperatureC < 19) return "warning";
  if (temperatureC > 25.5 || temperatureC < 20) return "caution";
  return "good";
}

function humiditySeverity(
  humidityPercent: number,
  criticalIncident = false
): AlertSeverity {
  if (
    criticalIncident &&
    (humidityPercent >= 74 || humidityPercent <= 25)
  ) return "critical";
  if (humidityPercent >= 66 || humidityPercent < 32) return "warning";
  if (humidityPercent > 60 || humidityPercent < 40) return "caution";
  return "good";
}

function powerSeverity(
  powerDeltaPercent: number,
  criticalIncident = false
): AlertSeverity {
  if (criticalIncident && powerDeltaPercent >= 70) return "critical";
  if (Math.abs(powerDeltaPercent) >= 30) return "warning";
  if (Math.abs(powerDeltaPercent) >= 12) return "caution";
  return "good";
}

export function buildTwinSyncAlerts(
  rooms: DigitalTwinRoom[],
  telemetry?: LiveTelemetrySnapshot
): TwinSyncAlert[] {
  const alerts: TwinSyncAlert[] = [];
  const detectedAt = telemetry?.generatedAt ?? new Date().toISOString();

  rooms.forEach((room) => {
    const kpi = calculateRoomKpi(room);
    const roomTelemetry = telemetry?.rooms.find(
      (reading) => reading.roomId === room.id
    );

    room.items.forEach((item) => {
      const definition = getItemDefinition(item.itemTypeId);

      item.alerts.forEach((description, index) => {
        const isFault = item.status === "fault";

        alerts.push({
          id: `realtime-${room.id}-${item.id}-${index}`,
          kind: "realtime",
          severity: isFault ? "warning" : "caution",
          category: "device",
          roomId: room.id,
          roomName: room.name,
          itemName: item.name,
          title: isFault
            ? `${item.name} requires inspection`
            : `${item.name} reported an operating notice`,
          description,
          recommendation: isFault
            ? "Isolate the device if operation is unsafe, inspect its connection and controls, then confirm a stable test cycle before returning it to service."
            : "Review the device panel and confirm that its current state matches the room schedule.",
          metrics: [{
            label: "Device availability",
            value: isFault ? "0%" : "75%",
            normalValue: "100% available",
            deviationPercent: isFault ? -100 : -25
          }],
          detectedAt
        });
      });

      if (definition?.isDevice && item.status === "on") {
        const normalPower = Math.max(definition.defaultPowerWatt ?? item.powerWatt, 1);
        const loadDifference = deviationPercent(item.powerWatt, normalPower);

        if (loadDifference >= 20) {
          const projectedKwh = item.powerWatt * 8 / 1000;

          alerts.push({
            id: `predictive-load-${room.id}-${item.id}`,
            kind: "predictive",
            severity: loadDifference >= 60 ? "warning" : "caution",
            category: "energy",
            roomId: room.id,
            roomName: room.name,
            itemName: item.name,
            title: "Sustained device load forecast",
            description: `${item.name} is operating above its typical load. An eight-hour session at the current rate would use about ${projectedKwh.toFixed(1)} kWh.`,
            recommendation: "Confirm the workload and schedule. Reduce runtime or power settings when the device is not needed.",
            metrics: [
              metric("Current load", item.powerWatt, " W", normalPower),
              metric("8-hour forecast", Number(projectedKwh.toFixed(1)), " kWh", Number((normalPower * 8 / 1000).toFixed(1)))
            ],
            detectedAt
          });
        }
      }
    });

    if (roomTelemetry) {
      const temperatureLevel = temperatureSeverity(
        roomTelemetry.temperatureC,
        roomTelemetry.criticalIncident
      );
      const humidityLevel = humiditySeverity(
        roomTelemetry.humidityPercent,
        roomTelemetry.criticalIncident
      );
      const powerLevel = powerSeverity(
        roomTelemetry.powerDeltaPercent,
        roomTelemetry.criticalIncident
      );

      if (temperatureLevel !== "good") {
        const isHigh = roomTelemetry.temperatureC > NORMAL_TEMPERATURE_C;

        alerts.push({
          id: `temperature-${room.id}`,
          kind: "realtime",
          severity: temperatureLevel,
          category: "temperature",
          roomId: room.id,
          roomName: room.name,
          title: isHigh ? "Room temperature is above target" : "Room temperature is below target",
          description: `${room.name} is ${roomTelemetry.temperatureC.toFixed(1)} °C and the current trend is ${roomTelemetry.temperatureTrend}. Occupancy is ${roomTelemetry.occupancyPercent}%.`,
          recommendation: isHigh
            ? "Check cooling operation and airflow, reduce unnecessary heat-generating loads, and monitor the next sensor cycle."
            : "Review the cooling setpoint and schedule to avoid discomfort and unnecessary energy use.",
          metrics: [
            metric("Room temperature", roomTelemetry.temperatureC, " °C", NORMAL_TEMPERATURE_C, "20-25.5 °C"),
            metric("Occupancy", roomTelemetry.occupancyPercent, "%", 60, "Typical 60%")
          ],
          detectedAt
        });
      }

      if (humidityLevel !== "good") {
        const isHigh = roomTelemetry.humidityPercent > NORMAL_HUMIDITY_PERCENT;

        alerts.push({
          id: `humidity-${room.id}`,
          kind: "realtime",
          severity: humidityLevel,
          category: "humidity",
          roomId: room.id,
          roomName: room.name,
          title: isHigh ? "Room humidity is above target" : "Room humidity is below target",
          description: `${room.name} humidity is ${roomTelemetry.humidityPercent}% RH. Sustained readings outside the normal range can affect comfort and equipment reliability.`,
          recommendation: isHigh
            ? "Increase ventilation or dehumidification and inspect the room for moisture sources."
            : "Review ventilation and humidification settings, then verify the reading with the next sensor cycle.",
          metrics: [
            metric("Room humidity", roomTelemetry.humidityPercent, "% RH", NORMAL_HUMIDITY_PERCENT, "40-60% RH"),
            metric("Room temperature", roomTelemetry.temperatureC, " °C", NORMAL_TEMPERATURE_C, "20-25.5 °C")
          ],
          detectedAt
        });
      }

      if (powerLevel !== "good") {
        const isIncrease = roomTelemetry.powerDeltaPercent > 0;

        alerts.push({
          id: `energy-change-${room.id}`,
          kind: "realtime",
          severity: powerLevel,
          category: "energy",
          roomId: room.id,
          roomName: room.name,
          title: isIncrease
            ? "Rapid power consumption increase"
            : "Unexpected power consumption decrease",
          description: `${room.name} load ${isIncrease ? "increased" : "decreased"} by ${Math.abs(roomTelemetry.powerDeltaPercent)}% during the latest sensor cycle.`,
          recommendation: isIncrease
            ? "Compare active equipment with the room schedule and inspect unexpected high-load devices."
            : "Confirm that scheduled devices are still online and check for a supply or connectivity interruption.",
          metrics: [
            {
              label: "Power change",
              value: `${roomTelemetry.powerDeltaPercent > 0 ? "+" : ""}${roomTelemetry.powerDeltaPercent}%`,
              normalValue: "Within ±12%",
              deviationPercent: roomTelemetry.powerDeltaPercent
            },
            metric("Live room load", roomTelemetry.livePowerWatt, " W", Math.max(kpi.estimatedPowerWatt, 1))
          ],
          detectedAt
        });
      }

      if (roomTelemetry.sensorStatus === "degraded") {
        alerts.push({
          id: `sensor-health-${room.id}`,
          kind: "realtime",
          severity: "warning",
          category: "sensor",
          roomId: room.id,
          roomName: room.name,
          title: "Environmental sensor signal degraded",
          description: `The latest ${room.name} sensor cycle reported intermittent data quality, so environmental readings may be less reliable.`,
          recommendation: "Inspect sensor power and connectivity, then compare the reading with a secondary measuring device.",
          metrics: [{
            label: "Signal reliability",
            value: "65%",
            normalValue: "100% online",
            deviationPercent: -35
          }],
          detectedAt
        });
      }

      if (
        roomTelemetry.temperatureTrend === "rising" &&
        roomTelemetry.temperatureC >= 24.5
      ) {
        const projectedTemperature = Number(
          (roomTelemetry.temperatureC + 1.4).toFixed(1)
        );
        const forecastSeverity = temperatureSeverity(
          projectedTemperature,
          roomTelemetry.criticalIncident
        );

        alerts.push({
          id: `temperature-forecast-${room.id}`,
          kind: "predictive",
          severity: forecastSeverity === "good" ? "caution" : forecastSeverity,
          category: "temperature",
          roomId: room.id,
          roomName: room.name,
          title: "Temperature rise forecast",
          description: `${room.name} may reach ${projectedTemperature.toFixed(1)} °C in the next simulated operating period if the current trend continues.`,
          recommendation: "Pre-cool the room or reduce non-essential heat-generating equipment before the next peak period.",
          metrics: [
            metric("Forecast temperature", projectedTemperature, " °C", NORMAL_TEMPERATURE_C, "20-25.5 °C"),
            metric("Current temperature", roomTelemetry.temperatureC, " °C", NORMAL_TEMPERATURE_C, "20-25.5 °C")
          ],
          detectedAt
        });
      }

      if (
        temperatureLevel === "good" &&
        humidityLevel === "good" &&
        powerLevel === "good" &&
        roomTelemetry.sensorStatus === "online"
      ) {
        alerts.push({
          id: `room-health-${room.id}`,
          kind: "realtime",
          severity: "good",
          category: "efficiency",
          roomId: room.id,
          roomName: room.name,
          title: "Room conditions are operating normally",
          description: `${room.name} environmental readings and power variation are within their expected operating ranges.`,
          recommendation: "No immediate action is required. Continue routine monitoring.",
          metrics: [
            metric("Room temperature", roomTelemetry.temperatureC, " °C", NORMAL_TEMPERATURE_C, "20-25.5 °C"),
            metric("Room humidity", roomTelemetry.humidityPercent, "% RH", NORMAL_HUMIDITY_PERCENT, "40-60% RH"),
            {
              label: "Power change",
              value: `${roomTelemetry.powerDeltaPercent > 0 ? "+" : ""}${roomTelemetry.powerDeltaPercent}%`,
              normalValue: "Within ±12%",
              deviationPercent: roomTelemetry.powerDeltaPercent
            }
          ],
          detectedAt
        });
      }
    }

    if (kpi.totalDevices > 0 && kpi.efficiencyScore < 80) {
      const severity: AlertSeverity = kpi.efficiencyScore < 50
        ? "warning"
        : kpi.efficiencyScore < 68
          ? "caution"
          : "good";

      alerts.push({
        id: `predictive-efficiency-${room.id}`,
        kind: "predictive",
        severity,
        category: "efficiency",
        roomId: room.id,
        roomName: room.name,
        title: severity === "good"
          ? "Room efficiency remains healthy"
          : "Room efficiency may decline",
        description: `${room.name} has an efficiency score of ${kpi.efficiencyScore}%, based on active devices, faults, and device notices.`,
        recommendation: severity === "good"
          ? "Maintain the current operating schedule and continue monitoring."
          : "Resolve faulted devices first, then switch off active devices that are not required.",
        metrics: [
          metric("Efficiency score", kpi.efficiencyScore, "%", 85, "Target 85%"),
          {
            label: "Faulted devices",
            value: `${kpi.faultDevices}`,
            normalValue: "Normal 0",
            deviationPercent: kpi.faultDevices === 0
              ? 0
              : kpi.faultDevices * 100
          }
        ],
        detectedAt
      });
    }
  });

  const severityWeight: Record<AlertSeverity, number> = {
    critical: 4,
    warning: 3,
    caution: 2,
    good: 1
  };

  return alerts.sort((left, right) => (
    severityWeight[right.severity] - severityWeight[left.severity] ||
    Number(left.kind === "predictive") - Number(right.kind === "predictive")
  ));
}
