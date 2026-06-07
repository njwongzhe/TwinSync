import { DetailedModelProps, modelMaterial } from "./modelTypes";

export default function WindowModel(props: DetailedModelProps) {
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.85, 1.35, 0.045]} />
        <meshStandardMaterial {...modelMaterial(props, "#93c5fd")} transparent opacity={props.isPreview ? 0.46 : 0.42} />
      </mesh>
      <mesh position={[0, 0.69, 0.035]}>
        <boxGeometry args={[2.0, 0.08, 0.08]} />
        <meshStandardMaterial {...modelMaterial(props, "#f8fafc")} />
      </mesh>
      <mesh position={[0, -0.69, 0.035]}>
        <boxGeometry args={[2.0, 0.08, 0.08]} />
        <meshStandardMaterial {...modelMaterial(props, "#f8fafc")} />
      </mesh>
      <mesh position={[-0.96, 0, 0.035]}>
        <boxGeometry args={[0.08, 1.45, 0.08]} />
        <meshStandardMaterial {...modelMaterial(props, "#f8fafc")} />
      </mesh>
      <mesh position={[0.96, 0, 0.035]}>
        <boxGeometry args={[0.08, 1.45, 0.08]} />
        <meshStandardMaterial {...modelMaterial(props, "#f8fafc")} />
      </mesh>
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[0.05, 1.32, 0.075]} />
        <meshStandardMaterial {...modelMaterial(props, "#e2e8f0")} />
      </mesh>
      <mesh position={[0, 0, 0.055]}>
        <boxGeometry args={[1.86, 0.05, 0.075]} />
        <meshStandardMaterial {...modelMaterial(props, "#e2e8f0")} />
      </mesh>
      <mesh position={[0.45, 0.25, 0.065]}>
        <boxGeometry args={[0.065, 0.22, 0.045]} />
        <meshStandardMaterial {...modelMaterial(props, "#94a3b8")} />
      </mesh>
    </group>
  );
}
