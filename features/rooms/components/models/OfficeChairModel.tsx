import { DetailedModelProps, modelMaterial } from "./modelTypes";

export default function OfficeChairModel(props: DetailedModelProps) {
  return (
    <group>
      <mesh position={[0, -0.08, 0]}>
        <boxGeometry args={[0.62, 0.16, 0.58]} />
        <meshStandardMaterial {...modelMaterial(props, "#1f2937")} />
      </mesh>
      <mesh position={[0, 0.34, -0.24]} rotation={[0.16, 0, 0]}>
        <boxGeometry args={[0.62, 0.8, 0.12]} />
        <meshStandardMaterial {...modelMaterial(props, "#111827")} />
      </mesh>
      <mesh position={[0, -0.48, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.72, 20]} />
        <meshStandardMaterial {...modelMaterial(props, "#64748b")} />
      </mesh>
      <mesh position={[0, -0.82, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.06, 24]} />
        <meshStandardMaterial {...modelMaterial(props, "#475569")} />
      </mesh>
      {[0, Math.PI * 0.4, Math.PI * 0.8, Math.PI * 1.2, Math.PI * 1.6].map((angle, index) => (
        <group key={index} rotation={[0, angle, 0]} position={[0, -0.8, 0]}>
          <mesh position={[0.28, 0, 0]}>
            <boxGeometry args={[0.48, 0.04, 0.07]} />
            <meshStandardMaterial {...modelMaterial(props, "#475569")} />
          </mesh>
          <mesh position={[0.52, -0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.045, 0.045, 0.055, 16]} />
            <meshStandardMaterial {...modelMaterial(props, "#111827")} />
          </mesh>
        </group>
      ))}
      <mesh position={[-0.41, -0.02, 0]}>
        <boxGeometry args={[0.08, 0.44, 0.08]} />
        <meshStandardMaterial {...modelMaterial(props, "#334155")} />
      </mesh>
      <mesh position={[0.41, -0.02, 0]}>
        <boxGeometry args={[0.08, 0.44, 0.08]} />
        <meshStandardMaterial {...modelMaterial(props, "#334155")} />
      </mesh>
    </group>
  );
}
