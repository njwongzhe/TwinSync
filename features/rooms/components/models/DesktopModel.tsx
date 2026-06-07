import { Cable, DetailedModelProps, isPowered, modelMaterial, StatusLight } from "./modelTypes";

export default function DesktopModel(props: DetailedModelProps) {
  const powered = isPowered(props.status);
  const screenColor = powered ? "#38bdf8" : "#020617";
  const screenGlow = powered ? "#38bdf8" : "#000000";

  return (
    <group>
      {/* Monitor */}
      <mesh position={[-0.18, 0.16, -0.18]}>
        <boxGeometry args={[0.62, 0.38, 0.055]} />
        <meshStandardMaterial {...modelMaterial(props, "#111827")} />
      </mesh>
      <mesh position={[-0.18, 0.16, -0.212]}>
        <boxGeometry args={[0.52, 0.29, 0.014]} />
        <meshStandardMaterial {...modelMaterial(props, screenColor, screenGlow, powered ? 0.65 : 0)} />
      </mesh>
      <mesh position={[-0.18, -0.08, -0.18]}>
        <boxGeometry args={[0.08, 0.16, 0.06]} />
        <meshStandardMaterial {...modelMaterial(props, "#1f2937")} />
      </mesh>
      <mesh position={[-0.18, -0.18, -0.18]}>
        <boxGeometry args={[0.28, 0.035, 0.18]} />
        <meshStandardMaterial {...modelMaterial(props, "#1f2937")} />
      </mesh>

      {/* CPU tower */}
      <mesh position={[0.33, -0.06, -0.08]}>
        <boxGeometry args={[0.24, 0.62, 0.36]} />
        <meshStandardMaterial {...modelMaterial(props, "#0f172a")} />
      </mesh>
      <mesh position={[0.33, -0.05, -0.265]}>
        <boxGeometry args={[0.18, 0.48, 0.018]} />
        <meshStandardMaterial {...modelMaterial(props, "#1e293b")} />
      </mesh>
      <StatusLight {...props} position={[0.26, 0.15, -0.278]} />
      {[0, 1, 2, 3, 4].map((index) => (
        <mesh key={index} position={[0.35, 0.02 - index * 0.055, -0.279]}>
          <boxGeometry args={[0.12, 0.011, 0.01]} />
          <meshStandardMaterial {...modelMaterial(props, "#64748b")} />
        </mesh>
      ))}
      <mesh position={[0.43, -0.27, -0.279]}>
        <boxGeometry args={[0.07, 0.035, 0.012]} />
        <meshStandardMaterial {...modelMaterial(props, "#334155")} />
      </mesh>

      {/* Keyboard */}
      <mesh position={[-0.18, -0.31, 0.19]} rotation={[0.08, 0, 0]}>
        <boxGeometry args={[0.58, 0.045, 0.22]} />
        <meshStandardMaterial {...modelMaterial(props, "#111827")} />
      </mesh>
      {[0, 1, 2].map((row) => (
        <group key={row} position={[-0.405, -0.276, 0.12 + row * 0.055]}>
          {Array.from({ length: 9 }).map((_, col) => (
            <mesh key={col} position={[col * 0.052, 0, 0]}>
              <boxGeometry args={[0.035, 0.012, 0.026]} />
              <meshStandardMaterial {...modelMaterial(props, "#334155")} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[-0.18, -0.271, 0.285]}>
        <boxGeometry args={[0.33, 0.012, 0.032]} />
        <meshStandardMaterial {...modelMaterial(props, "#475569")} />
      </mesh>

      {/* Mouse */}
      <mesh position={[0.23, -0.286, 0.22]} scale={[1, 0.45, 1.25]}>
        <sphereGeometry args={[0.075, 24, 16]} />
        <meshStandardMaterial {...modelMaterial(props, "#111827")} />
      </mesh>
      <mesh position={[0.23, -0.245, 0.145]}>
        <boxGeometry args={[0.018, 0.012, 0.055]} />
        <meshStandardMaterial {...modelMaterial(props, "#94a3b8")} />
      </mesh>

      {/* Cables */}
      <Cable {...props} position={[0.06, -0.18, -0.13]} rotation={[Math.PI / 2, 0, Math.PI / 2]} length={0.48} />
      <Cable {...props} position={[0.05, -0.305, 0.20]} rotation={[Math.PI / 2, 0, Math.PI / 2]} length={0.26} />
    </group>
  );
}
