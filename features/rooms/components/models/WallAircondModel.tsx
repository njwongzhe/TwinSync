import { DetailedModelProps, isPowered, modelMaterial, StatusLight } from "./modelTypes";

export default function WallAircondModel(props: DetailedModelProps) {
  const powered = isPowered(props.status);

  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.9, 0.42, 0.25]} />
        <meshStandardMaterial {...modelMaterial(props, "#f8fafc")} />
      </mesh>
      <mesh position={[0, 0.04, 0.132]}>
        <boxGeometry args={[1.74, 0.2, 0.018]} />
        <meshStandardMaterial {...modelMaterial(props, "#e2e8f0")} />
      </mesh>
      <mesh position={[0, -0.18, 0.142]} rotation={[0.16, 0, 0]}>
        <boxGeometry args={[1.72, 0.065, 0.035]} />
        <meshStandardMaterial {...modelMaterial(props, powered ? "#bae6fd" : "#94a3b8")} />
      </mesh>
      {[-0.55, -0.2, 0.15, 0.5].map((x, index) => (
        <mesh key={index} position={[x, -0.18, 0.162]}>
          <boxGeometry args={[0.22, 0.018, 0.018]} />
          <meshStandardMaterial {...modelMaterial(props, "#64748b")} />
        </mesh>
      ))}
      <mesh position={[0.66, 0.07, 0.155]}>
        <boxGeometry args={[0.28, 0.08, 0.014]} />
        <meshStandardMaterial {...modelMaterial(props, powered ? "#0ea5e9" : "#1e293b", powered ? "#0ea5e9" : "#000000", powered ? 0.55 : 0)} />
      </mesh>
      <StatusLight {...props} position={[0.86, 0.08, 0.16]} radius={0.026} />
      <mesh position={[-0.88, 0, 0.01]}>
        <boxGeometry args={[0.045, 0.32, 0.28]} />
        <meshStandardMaterial {...modelMaterial(props, "#dbeafe")} />
      </mesh>
      <mesh position={[0.88, 0, 0.01]}>
        <boxGeometry args={[0.045, 0.32, 0.28]} />
        <meshStandardMaterial {...modelMaterial(props, "#dbeafe")} />
      </mesh>
    </group>
  );
}
