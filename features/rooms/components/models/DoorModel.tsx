import { DetailedModelProps, modelMaterial } from "./modelTypes";

export default function DoorModel(props: DetailedModelProps) {
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.05, 2.05, 0.11]} />
        <meshStandardMaterial {...modelMaterial(props, "#7c2d12")} />
      </mesh>
      <mesh position={[0, 0, 0.065]}>
        <boxGeometry args={[0.82, 1.72, 0.035]} />
        <meshStandardMaterial {...modelMaterial(props, "#92400e")} />
      </mesh>
      <mesh position={[0, 0.52, 0.09]}>
        <boxGeometry args={[0.68, 0.56, 0.025]} />
        <meshStandardMaterial {...modelMaterial(props, "#a16207")} />
      </mesh>
      <mesh position={[0, -0.42, 0.09]}>
        <boxGeometry args={[0.68, 0.72, 0.025]} />
        <meshStandardMaterial {...modelMaterial(props, "#a16207")} />
      </mesh>
      <mesh position={[0.37, 0.0, 0.135]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.045, 20]} />
        <meshStandardMaterial {...modelMaterial(props, "#facc15")} />
      </mesh>
      <mesh position={[0.45, 0.0, 0.13]}>
        <boxGeometry args={[0.12, 0.035, 0.035]} />
        <meshStandardMaterial {...modelMaterial(props, "#ca8a04")} />
      </mesh>
      <mesh position={[0, 1.09, 0]}>
        <boxGeometry args={[1.25, 0.1, 0.15]} />
        <meshStandardMaterial {...modelMaterial(props, "#431407")} />
      </mesh>
      <mesh position={[-0.62, 0, 0]}>
        <boxGeometry args={[0.1, 2.25, 0.15]} />
        <meshStandardMaterial {...modelMaterial(props, "#431407")} />
      </mesh>
      <mesh position={[0.62, 0, 0]}>
        <boxGeometry args={[0.1, 2.25, 0.15]} />
        <meshStandardMaterial {...modelMaterial(props, "#431407")} />
      </mesh>
    </group>
  );
}
