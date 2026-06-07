import { DetailedModelProps, isPowered, modelMaterial } from "./modelTypes";

export default function CeilingLightModel(props: DetailedModelProps) {
  const powered = isPowered(props.status);

  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.9, 0.06, 0.9]} />
        <meshStandardMaterial {...modelMaterial(props, "#e2e8f0")} />
      </mesh>
      <mesh position={[0, -0.04, 0]}>
        <boxGeometry args={[0.72, 0.025, 0.72]} />
        <meshStandardMaterial {...modelMaterial(props, powered ? "#fff7ad" : "#94a3b8", powered ? "#fef08a" : "#000000", powered ? 1.1 : 0)} />
      </mesh>
      <mesh position={[0, -0.055, 0]}>
        <boxGeometry args={[0.58, 0.008, 0.58]} />
        <meshStandardMaterial {...modelMaterial(props, powered ? "#fefce8" : "#64748b", powered ? "#fef08a" : "#000000", powered ? 0.9 : 0)} />
      </mesh>
      {powered && !props.isPreview && (
        <pointLight position={[0, -0.3, 0]} intensity={0.8} distance={6} color="#fff7ad" />
      )}
    </group>
  );
}
