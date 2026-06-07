import DesktopModel from "./DesktopModel";
import { DetailedModelProps, modelMaterial } from "./modelTypes";

export default function DeskWithDesktopModel(props: DetailedModelProps) {
  return (
    <group>
      {/* Wooden office desk */}
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[1.9, 0.12, 0.88]} />
        <meshStandardMaterial {...modelMaterial(props, "#9a6a3a")} />
      </mesh>
      <mesh position={[0, 0.16, -0.45]}>
        <boxGeometry args={[1.95, 0.08, 0.08]} />
        <meshStandardMaterial {...modelMaterial(props, "#6b3f1d")} />
      </mesh>
      {[
        [-0.78, -0.34, -0.32],
        [0.78, -0.34, -0.32],
        [-0.78, -0.34, 0.32],
        [0.78, -0.34, 0.32]
      ].map(([x, y, z], index) => (
        <mesh key={index} position={[x, y, z]}>
          <boxGeometry args={[0.11, 0.76, 0.11]} />
          <meshStandardMaterial {...modelMaterial(props, "#7c4a21")} />
        </mesh>
      ))}

      {/* Cable tray under table */}
      <mesh position={[0.18, -0.18, -0.42]}>
        <boxGeometry args={[1.15, 0.06, 0.08]} />
        <meshStandardMaterial {...modelMaterial(props, "#1f2937")} />
      </mesh>

      {/* Detailed desktop placed on table surface */}
      <group position={[0, 0.48, 0.02]} scale={[0.95, 0.95, 0.95]}>
        <DesktopModel {...props} />
      </group>
    </group>
  );
}
