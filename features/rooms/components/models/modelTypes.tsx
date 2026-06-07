import { ReactNode } from "react";
import { DeviceStatus } from "../../domain/types";

export type DetailedModelProps = {
  status?: DeviceStatus;
  isSelected?: boolean;
  isPreview?: boolean;
  isPlaceable?: boolean;
};

export function isPowered(status?: DeviceStatus) {
  return status === "on";
}

export function modelMaterial(
  props: DetailedModelProps,
  color: string,
  emissive = "#000000",
  emissiveIntensity = 0
) {
  if (props.isPreview) {
    return {
      color: props.isPlaceable ? "#22c55e" : "#ef4444",
      transparent: true,
      opacity: 0.46,
      emissive: "#000000",
      emissiveIntensity: 0,
      roughness: 0.55,
      metalness: 0.05
    };
  }

  const selectedEmissive = props.isSelected && emissive === "#000000" ? "#0ea5e9" : emissive;

  return {
    color,
    emissive: selectedEmissive,
    emissiveIntensity: props.isSelected ? Math.max(emissiveIntensity, 0.22) : emissiveIntensity,
    roughness: 0.55,
    metalness: 0.05
  };
}

type StatusLightProps = DetailedModelProps & {
  position: [number, number, number];
  radius?: number;
};

export function StatusLight({ position, radius = 0.035, status, isPreview, isPlaceable }: StatusLightProps) {
  const on = isPowered(status);
  const color = status === "fault" ? "#ef4444" : on ? "#22c55e" : "#475569";

  return (
    <mesh position={position}>
      <sphereGeometry args={[radius, 16, 16]} />
      <meshStandardMaterial
        {...modelMaterial({ isPreview, isPlaceable }, color, on ? color : "#000000", on ? 0.9 : 0)}
      />
    </mesh>
  );
}

type CableProps = DetailedModelProps & {
  position: [number, number, number];
  rotation?: [number, number, number];
  length?: number;
};

export function Cable({ position, rotation = [Math.PI / 2, 0, 0], length = 0.65, ...props }: CableProps) {
  return (
    <mesh position={position} rotation={rotation}>
      <cylinderGeometry args={[0.012, 0.012, length, 12]} />
      <meshStandardMaterial {...modelMaterial(props, "#111827")} />
    </mesh>
  );
}

type LabelPlateProps = DetailedModelProps & {
  position: [number, number, number];
  children?: ReactNode;
};

export function LabelPlate({ position, children, ...props }: LabelPlateProps) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.28, 0.08, 0.018]} />
        <meshStandardMaterial {...modelMaterial(props, "#0f172a")} />
      </mesh>
      {children}
    </group>
  );
}
