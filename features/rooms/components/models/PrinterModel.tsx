import { DetailedModelProps, isPowered, modelMaterial, StatusLight } from "./modelTypes";

export default function PrinterModel(props: DetailedModelProps) {
  const powered = isPowered(props.status);

  return (
    <group>
      {/* Main printer body */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[0.78, 0.36, 0.62]} />
        <meshStandardMaterial {...modelMaterial(props, "#475569")} />
      </mesh>
      <mesh position={[0, 0.17, -0.02]}>
        <boxGeometry args={[0.72, 0.16, 0.55]} />
        <meshStandardMaterial {...modelMaterial(props, "#cbd5e1")} />
      </mesh>
      <mesh position={[0, 0.28, -0.04]}>
        <boxGeometry args={[0.66, 0.045, 0.48]} />
        <meshStandardMaterial {...modelMaterial(props, "#0f172a")} />
      </mesh>

      {/* Paper input and output trays */}
      <mesh position={[0, -0.03, 0.42]} rotation={[-0.25, 0, 0]}>
        <boxGeometry args={[0.64, 0.045, 0.36]} />
        <meshStandardMaterial {...modelMaterial(props, "#94a3b8")} />
      </mesh>
      <mesh position={[0, 0.08, 0.36]}>
        <boxGeometry args={[0.58, 0.025, 0.26]} />
        <meshStandardMaterial {...modelMaterial(props, "#f8fafc")} />
      </mesh>
      {[0, 1, 2].map((index) => (
        <mesh key={index} position={[0, 0.105 + index * 0.012, 0.39 + index * 0.005]}>
          <boxGeometry args={[0.54, 0.006, 0.22]} />
          <meshStandardMaterial {...modelMaterial(props, "#ffffff")} />
        </mesh>
      ))}
      <mesh position={[0, -0.13, 0.34]}>
        <boxGeometry args={[0.6, 0.045, 0.08]} />
        <meshStandardMaterial {...modelMaterial(props, "#1e293b")} />
      </mesh>

      {/* Control panel */}
      <mesh position={[0.28, 0.22, 0.22]} rotation={[-0.25, 0, 0]}>
        <boxGeometry args={[0.22, 0.04, 0.12]} />
        <meshStandardMaterial {...modelMaterial(props, "#111827")} />
      </mesh>
      <mesh position={[0.235, 0.24, 0.18]} rotation={[-0.25, 0, 0]}>
        <boxGeometry args={[0.085, 0.012, 0.045]} />
        <meshStandardMaterial {...modelMaterial(props, powered ? "#38bdf8" : "#0f172a", powered ? "#38bdf8" : "#000000", powered ? 0.55 : 0)} />
      </mesh>
      <StatusLight {...props} position={[0.36, 0.245, 0.18]} radius={0.025} />
      {[0, 1, 2].map((index) => (
        <mesh key={index} position={[0.305 + index * 0.035, 0.248, 0.245]} rotation={[-0.25, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.008, 16]} />
          <meshStandardMaterial {...modelMaterial(props, "#e2e8f0")} />
        </mesh>
      ))}
    </group>
  );
}
