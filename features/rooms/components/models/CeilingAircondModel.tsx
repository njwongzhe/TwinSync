import { DetailedModelProps, isPowered, modelMaterial, StatusLight } from "./modelTypes";

export default function CeilingAircondModel(props: DetailedModelProps) {
  const powered = isPowered(props.status);

  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.8, 0.15, 1.8]} />
        <meshStandardMaterial {...modelMaterial(props, "#f8fafc")} />
      </mesh>
      <mesh position={[0, -0.085, 0]}>
        <boxGeometry args={[0.82, 0.035, 0.82]} />
        <meshStandardMaterial {...modelMaterial(props, "#cbd5e1")} />
      </mesh>
      {[
        [0, -0.09, -0.72, 1.25, 0.035, 0.12],
        [0, -0.09, 0.72, 1.25, 0.035, 0.12],
        [-0.72, -0.09, 0, 0.12, 0.035, 1.25],
        [0.72, -0.09, 0, 0.12, 0.035, 1.25]
      ].map(([x, y, z, w, h, l], index) => (
        <mesh key={index} position={[x, y, z]}>
          <boxGeometry args={[w, h, l]} />
          <meshStandardMaterial {...modelMaterial(props, powered ? "#bae6fd" : "#94a3b8")} />
        </mesh>
      ))}
      {Array.from({ length: 5 }).map((_, index) => (
        <mesh key={index} position={[-0.28 + index * 0.14, -0.11, 0]}>
          <boxGeometry args={[0.035, 0.012, 0.72]} />
          <meshStandardMaterial {...modelMaterial(props, "#64748b")} />
        </mesh>
      ))}
      <StatusLight {...props} position={[0.55, -0.12, 0.55]} radius={0.03} />
    </group>
  );
}
