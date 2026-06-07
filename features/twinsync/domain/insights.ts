import {
  calculateRoomKpi,
  DigitalTwinRoom,
  getItemDefinition
} from "@/features/rooms";
import { LiveTelemetrySnapshot } from "./telemetry";

export type AlertKind = "realtime" | "predictive";
export type AlertSeverity = "critical" | "warning" | "info";
export type AlertCategory =
  | "device"
  | "energy"
  | "temperature"
  | "humidity"
  | "sensor"
  | "efficiency";

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
  observedValue?: string;
  detectedAt: string;
};

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
        alerts.push({
          id: `realtime-${room.id}-${item.id}-${index}`,
          kind: "realtime",
          severity: item.status === "fault" ? "critical" : "warning",
          category: "device",
          roomId: room.id,
          roomName: room.name,
          itemName: item.name,
          title: item.status === "fault" ? `${item.name} requires attention` : `${item.name} reported an alert`,
          description,
          recommendation: item.status === "fault"
            ? "Inspect the device, isolate it if necessary, and return it to a safe operating state."
            : "Review the device panel and verify its latest operating status.",
          detectedAt
        });
      });

      if (definition?.isDevice && item.status === "on" && item.powerWatt >= 900) {
        const projectedKwh = (item.powerWatt * 8 / 1000).toFixed(1);

        alerts.push({
          id: `predictive-load-${room.id}-${item.id}`,
          kind: "predictive",
          severity: "warning",
          category: "energy",
          roomId: room.id,
          roomName: room.name,
          itemName: item.name,
          title: "High-load operation forecast",
          description: `${item.name} is drawing ${item.powerWatt} W. At this rate, an eight-hour session would consume about ${projectedKwh} kWh.`,
          recommendation: "Review the operating schedule and temperature or workload settings to reduce unnecessary runtime.",
          observedValue: `${item.powerWatt} W`,
          detectedAt
        });
      }
    });

    if (roomTelemetry) {
      if (roomTelemetry.temperatureC >= 28.5) {
        alerts.push({
          id: `temperature-critical-${room.id}`,
          kind: "realtime",
          severity: "critical",
          category: "temperature",
          roomId: room.id,
          roomName: room.name,
          title: "Room temperature exceeds comfort limit",
          description: `${room.name} reached ${roomTelemetry.temperatureC.toFixed(1)} °C while the sensor trend is ${roomTelemetry.temperatureTrend}.`,
          recommendation: "Inspect cooling equipment, reduce heat-generating loads, and verify airflow immediately.",
          observedValue: `${roomTelemetry.temperatureC.toFixed(1)} °C`,
          detectedAt
        });
      } else if (roomTelemetry.temperatureC > 25.5) {
        alerts.push({
          id: `temperature-warning-${room.id}`,
          kind: "realtime",
          severity: "warning",
          category: "temperature",
          roomId: room.id,
          roomName: room.name,
          title: "Room temperature is trending warm",
          description: `${room.name} is at ${roomTelemetry.temperatureC.toFixed(1)} °C with ${roomTelemetry.occupancyPercent}% simulated occupancy.`,
          recommendation: "Check the cooling schedule and confirm that vents are unobstructed.",
          observedValue: `${roomTelemetry.temperatureC.toFixed(1)} °C`,
          detectedAt
        });
      } else if (roomTelemetry.temperatureC < 19.5) {
        alerts.push({
          id: `temperature-low-${room.id}`,
          kind: "realtime",
          severity: "info",
          category: "temperature",
          roomId: room.id,
          roomName: room.name,
          title: "Room temperature is below the preferred range",
          description: `${room.name} is currently ${roomTelemetry.temperatureC.toFixed(1)} °C.`,
          recommendation: "Review the cooling setpoint to avoid unnecessary energy use.",
          observedValue: `${roomTelemetry.temperatureC.toFixed(1)} °C`,
          detectedAt
        });
      }

      if (roomTelemetry.humidityPercent >= 65) {
        alerts.push({
          id: `humidity-high-${room.id}`,
          kind: "realtime",
          severity: roomTelemetry.humidityPercent >= 72 ? "critical" : "warning",
          category: "humidity",
          roomId: room.id,
          roomName: room.name,
          title: "Humidity is above the preferred range",
          description: `${room.name} humidity is ${roomTelemetry.humidityPercent}%, which may affect comfort and equipment.`,
          recommendation: "Increase ventilation or dehumidification and inspect the room for moisture sources.",
          observedValue: `${roomTelemetry.humidityPercent}% RH`,
          detectedAt
        });
      }

      if (roomTelemetry.powerDeltaPercent >= 20) {
        alerts.push({
          id: `energy-spike-${room.id}`,
          kind: "realtime",
          severity: roomTelemetry.powerDeltaPercent >= 45 ? "critical" : "warning",
          category: "energy",
          roomId: room.id,
          roomName: room.name,
          title: "Sudden consumption increase detected",
          description: `${room.name} load increased by ${roomTelemetry.powerDeltaPercent}% to ${roomTelemetry.livePowerWatt} W during the latest sensor cycle.`,
          recommendation: "Compare active equipment against the room schedule and inspect unexpected high-load devices.",
          observedValue: `+${roomTelemetry.powerDeltaPercent}%`,
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
          description: `The latest ${room.name} sensor cycle reported intermittent data quality.`,
          recommendation: "Inspect sensor connectivity and compare the reading with a secondary device.",
          observedValue: "Degraded",
          detectedAt
        });
      }

      if (
        roomTelemetry.temperatureTrend === "rising" &&
        roomTelemetry.temperatureC >= 24.5
      ) {
        const projectedTemperature = roomTelemetry.temperatureC + 1.4;

        alerts.push({
          id: `temperature-forecast-${room.id}`,
          kind: "predictive",
          severity: projectedTemperature >= 28.5 ? "warning" : "info",
          category: "temperature",
          roomId: room.id,
          roomName: room.name,
          title: "Temperature rise forecast",
          description: `${room.name} may reach ${projectedTemperature.toFixed(1)} °C within the next simulated operating period if the current trend continues.`,
          recommendation: "Pre-cool the room or reduce non-essential heat-generating equipment before the next peak.",
          observedValue: `${projectedTemperature.toFixed(1)} °C forecast`,
          detectedAt
        });
      }
    }

    if (kpi.efficiencyScore < 65 && kpi.totalDevices > 0) {
      alerts.push({
        id: `predictive-efficiency-${room.id}`,
        kind: "predictive",
        severity: kpi.efficiencyScore < 40 ? "critical" : "warning",
        category: "efficiency",
        roomId: room.id,
        roomName: room.name,
        title: "Room efficiency may decline",
        description: `${room.name} currently has an efficiency score of ${kpi.efficiencyScore}%, based on active devices, faults, and alerts.`,
        recommendation: "Resolve faulted devices first, then switch off active devices that are not required.",
        observedValue: `${kpi.efficiencyScore}%`,
        detectedAt
      });
    }
  });

  const severityWeight: Record<AlertSeverity, number> = {
    critical: 3,
    warning: 2,
    info: 1
  };

  return alerts.sort((left, right) => (
    severityWeight[right.severity] - severityWeight[left.severity] ||
    Number(left.kind === "predictive") - Number(right.kind === "predictive")
  ));
}
