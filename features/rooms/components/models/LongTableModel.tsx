import { DetailedModelProps, modelMaterial } from "./modelTypes";

export default function LongTableModel(props: DetailedModelProps) {
  return (
    <group>
      <mesh position={[0, 0.31, 0]}>
        <boxGeometry args={[3.75, 0.12, 1.25]} />
        <meshStandardMaterial {...modelMaterial(props, "#92400e")} />
      </mesh>
      <mesh position={[0, 0.39, 0]}>
        <boxGeometry args={[3.6, 0.035, 1.1]} />
        <meshStandardMaterial {...modelMaterial(props, "#b45309")} />
      </mesh>
      {[
        [-1.55, -0.08, -0.48],
        [0, -0.08, -0.48],
        [1.55, -0.08, -0.48],
        [-1.55, -0.08, 0.48],
        [0, -0.08, 0.48],
        [1.55, -0.08, 0.48]
      ].map(([x, y, z], index) => (
        <mesh key={index} position={[x, y, z]}>
          <boxGeometry args={[0.12, 0.76, 0.12]} />
          <meshStandardMaterial {...modelMaterial(props, "#78350f")} />
        </mesh>
      ))}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[3.25, 0.07, 0.09]} />
        <meshStandardMaterial {...modelMaterial(props, "#78350f")} />
      </mesh>
    </group>
  );
}
