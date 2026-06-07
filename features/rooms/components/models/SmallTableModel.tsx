import { DetailedModelProps, modelMaterial } from "./modelTypes";

export default function SmallTableModel(props: DetailedModelProps) {
  return (
    <group>
      <mesh position={[0, 0.31, 0]}>
        <boxGeometry args={[1.75, 0.12, 1.75]} />
        <meshStandardMaterial {...modelMaterial(props, "#a16207")} />
      </mesh>
      <mesh position={[0, 0.39, 0]}>
        <boxGeometry args={[1.65, 0.035, 1.65]} />
        <meshStandardMaterial {...modelMaterial(props, "#c08435")} />
      </mesh>
      {[
        [-0.72, -0.08, -0.72],
        [0.72, -0.08, -0.72],
        [-0.72, -0.08, 0.72],
        [0.72, -0.08, 0.72]
      ].map(([x, y, z], index) => (
        <mesh key={index} position={[x, y, z]}>
          <boxGeometry args={[0.13, 0.76, 0.13]} />
          <meshStandardMaterial {...modelMaterial(props, "#78350f")} />
        </mesh>
      ))}
      <mesh position={[0, -0.02, -0.72]}>
        <boxGeometry args={[1.48, 0.08, 0.08]} />
        <meshStandardMaterial {...modelMaterial(props, "#854d0e")} />
      </mesh>
      <mesh position={[0, -0.02, 0.72]}>
        <boxGeometry args={[1.48, 0.08, 0.08]} />
        <meshStandardMaterial {...modelMaterial(props, "#854d0e")} />
      </mesh>
    </group>
  );
}
