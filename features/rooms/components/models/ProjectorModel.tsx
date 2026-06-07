import { DetailedModelProps, isPowered, modelMaterial, StatusLight } from "./modelTypes";

export default function ProjectorModel(props: DetailedModelProps) {
  const powered = isPowered(props.status);

  return (
    <group>
      {/* Ceiling mount */}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.32, 20]} />
        <meshStandardMaterial {...modelMaterial(props, "#475569")} />
      </mesh>
      <mesh position={[0, 0.39, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.035, 24]} />
        <meshStandardMaterial {...modelMaterial(props, "#64748b")} />
      </mesh>

      {/* Projector body */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[0.82, 0.26, 0.62]} />
        <meshStandardMaterial {...modelMaterial(props, "#e2e8f0")} />
      </mesh>
      <mesh position={[0, -0.02, -0.325]}>
        <boxGeometry args={[0.76, 0.16, 0.035]} />
        <meshStandardMaterial {...modelMaterial(props, "#cbd5e1")} />
      </mesh>
      <mesh position={[-0.2, -0.02, -0.36]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.105, 0.105, 0.055, 32]} />
        <meshStandardMaterial {...modelMaterial(props, "#020617", powered ? "#60a5fa" : "#000000", powered ? 0.35 : 0)} />
      </mesh>
      <mesh position={[-0.2, -0.02, -0.392]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.064, 0.064, 0.015, 32]} />
        <meshStandardMaterial {...modelMaterial(props, powered ? "#93c5fd" : "#111827", powered ? "#60a5fa" : "#000000", powered ? 0.75 : 0)} />
      </mesh>

      {/* Side vents */}
      {Array.from({ length: 6 }).map((_, index) => (
        <mesh key={index} position={[0.43, -0.07 + index * 0.035, 0.06]}>
          <boxGeometry args={[0.012, 0.012, 0.28]} />
          <meshStandardMaterial {...modelMaterial(props, "#334155")} />
        </mesh>
      ))}
      <StatusLight {...props} position={[0.24, 0.05, -0.35]} radius={0.026} />

      {/* Light beam when powered */}
      {powered && !props.isPreview && (
        <mesh position={[-0.2, -0.02, -0.85]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.36, 1.0, 32, 1, true]} />
          <meshBasicMaterial color="#bfdbfe" transparent opacity={0.18} />
        </mesh>
      )}
    </group>
  );
}
