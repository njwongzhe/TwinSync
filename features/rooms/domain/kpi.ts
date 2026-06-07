import { DigitalTwinRoom, RoomKpi } from "./types";
import { getItemDefinition } from "./items";

export function calculateRoomKpi(room: DigitalTwinRoom): RoomKpi {
  const deviceItems = room.items.filter((item) => getItemDefinition(item.itemTypeId)?.isDevice);
  const totalDevices = deviceItems.length;
  const activeDevices = deviceItems.filter((item) => item.status === "on").length;
  const faultDevices = deviceItems.filter((item) => item.status === "fault").length;
  const totalAlerts = room.items.reduce((total, item) => total + item.alerts.length, 0);
  const estimatedPowerWatt = deviceItems.reduce((total, item) => {
    if (item.status !== "on") {
      return total;
    }

    return total + item.powerWatt;
  }, 0);

  const activeRatio = totalDevices === 0 ? 0 : activeDevices / totalDevices;
  const alertPenalty = Math.min(40, totalAlerts * 8);
  const faultPenalty = Math.min(35, faultDevices * 12);
  const efficiencyScore = Math.max(0, Math.min(100, Math.round(activeRatio * 100 - alertPenalty - faultPenalty)));

  return {
    totalDevices,
    activeDevices,
    faultDevices,
    totalAlerts,
    estimatedPowerWatt,
    efficiencyScore
  };
}
