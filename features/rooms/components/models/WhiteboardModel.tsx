import { DetailedModelProps, modelMaterial } from "./modelTypes";

export default function WhiteboardModel(props: DetailedModelProps) {
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2.85, 1.42, 0.045]} />
        <meshStandardMaterial {...modelMaterial(props, "#f8fafc")} />
      </mesh>
      <mesh position={[0, 0.74, 0.03]}>
        <boxGeometry args={[3.0, 0.05, 0.08]} />
        <meshStandardMaterial {...modelMaterial(props, "#94a3b8")} />
      </mesh>
      <mesh position={[0, -0.74, 0.03]}>
        <boxGeometry args={[3.0, 0.05, 0.08]} />
        <meshStandardMaterial {...modelMaterial(props, "#94a3b8")} />
      </mesh>
      <mesh position={[-1.48, 0, 0.03]}>
        <boxGeometry args={[0.05, 1.5, 0.08]} />
        <meshStandardMaterial {...modelMaterial(props, "#94a3b8")} />
      </mesh>
      <mesh position={[1.48, 0, 0.03]}>
        <boxGeometry args={[0.05, 1.5, 0.08]} />
        <meshStandardMaterial {...modelMaterial(props, "#94a3b8")} />
      </mesh>
      <mesh position={[0, -0.82, 0.09]}>
        <boxGeometry args={[2.4, 0.06, 0.12]} />
        <meshStandardMaterial {...modelMaterial(props, "#64748b")} />
      </mesh>
      {[-0.45, -0.25, -0.05].map((x, index) => (
        <mesh key={index} position={[x, -0.78, 0.17]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.018, 0.018, 0.22, 12]} />
          <meshStandardMaterial {...modelMaterial(props, index === 0 ? "#ef4444" : index === 1 ? "#1d4ed8" : "#111827")} />
        </mesh>
      ))}
      <mesh position={[0.42, -0.77, 0.16]}>
        <boxGeometry args={[0.26, 0.06, 0.08]} />
        <meshStandardMaterial {...modelMaterial(props, "#334155")} />
      </mesh>
    </group>
  );
}
