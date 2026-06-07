"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { DetailedModelProps, isPowered } from "./modelTypes";

const MODEL_SCALE = 0.28;
const MODEL_Y_OFFSET = -0.04;

function createWoodTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const gradient = ctx.createLinearGradient(0, 0, 512, 0);
  gradient.addColorStop(0, "#2a2115");
  gradient.addColorStop(0.25, "#4a3822");
  gradient.addColorStop(0.5, "#221a10");
  gradient.addColorStop(0.75, "#5a4428");
  gradient.addColorStop(1, "#2b2115");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 128);

  for (let i = 0; i < 90; i++) {
    const y = Math.random() * 128;
    const alpha = 0.12 + Math.random() * 0.18;

    ctx.strokeStyle = `rgba(220, 170, 95, ${alpha})`;
    ctx.lineWidth = 0.5 + Math.random() * 1.5;

    ctx.beginPath();
    ctx.moveTo(0, y);

    for (let x = 0; x <= 512; x += 32) {
      const wave = Math.sin((x + i * 17) * 0.035) * 5;
      ctx.lineTo(x, y + wave);
    }

    ctx.stroke();
  }

  for (let i = 0; i < 350; i++) {
    ctx.fillStyle = `rgba(255, 220, 140, ${Math.random() * 0.08})`;
    ctx.fillRect(
      Math.random() * 512,
      Math.random() * 128,
      2 + Math.random() * 8,
      0.5
    );
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.6, 1);
  texture.anisotropy = 8;

  return texture;
}

function createBladeGeometry() {
  const length = 2.75;
  const rootWidth = 0.34;
  const tipWidth = 0.48;
  const roundness = 0.18;

  const shape = new THREE.Shape();

  shape.moveTo(0, -rootWidth / 2);
  shape.lineTo(length - roundness, -tipWidth / 2);

  shape.quadraticCurveTo(
    length,
    -tipWidth / 2,
    length,
    -tipWidth / 2 + roundness
  );

  shape.lineTo(length, tipWidth / 2 - roundness);

  shape.quadraticCurveTo(
    length,
    tipWidth / 2,
    length - roundness,
    tipWidth / 2
  );

  shape.lineTo(0, rootWidth / 2);

  shape.quadraticCurveTo(
    -0.1,
    rootWidth / 2,
    -0.1,
    rootWidth / 2 - 0.1
  );

  shape.lineTo(-0.1, -rootWidth / 2 + 0.1);

  shape.quadraticCurveTo(
    -0.1,
    -rootWidth / 2,
    0,
    -rootWidth / 2
  );

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.045,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.035,
    bevelSegments: 5,
  });

  geometry.rotateX(Math.PI / 2);
  geometry.translate(0.45, 0, 0);

  return geometry;
}

function Screw({
  position,
}: {
  position: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.035, 0.035, 0.012, 20]} />
      <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.35} />
    </mesh>
  );
}

function BladeConnector() {
  return (
    <group position={[0.63, -0.06, 0]}>
      <mesh>
        <boxGeometry args={[0.42, 0.08, 0.22]} />
        <meshStandardMaterial color="#111111" metalness={0.75} roughness={0.38} />
      </mesh>

      <mesh position={[0.03, -0.045, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.23, 0.035, 0.015]} />
        <meshStandardMaterial color="#050505" metalness={0.8} roughness={0.25} />
      </mesh>

      <Screw position={[-0.13, -0.047, -0.06]} />
      <Screw position={[0.13, -0.047, 0.06]} />
    </group>
  );
}

function FanBlade({
  angle,
  woodTexture,
  previewMaterial,
}: {
  angle: number;
  woodTexture: THREE.CanvasTexture | null;
  previewMaterial?: THREE.Material;
}) {
  const bladeGeometry = useMemo(() => createBladeGeometry(), []);

  return (
    <group rotation={[0, angle, 0]}>
      <group position={[0.25, -0.08, 0]} rotation={[0, 0, -0.035]}>
        <mesh geometry={bladeGeometry} castShadow receiveShadow>
          {previewMaterial ? (
            <primitive object={previewMaterial} attach="material" />
          ) : (
            <meshStandardMaterial
              map={woodTexture ?? undefined}
              color="#3b2a19"
              roughness={0.85}
              metalness={0.05}
            />
          )}
        </mesh>

        <mesh position={[1.7, 0.028, 0]} rotation={[0, 0, 0]}>
          <boxGeometry args={[1.8, 0.015, 0.015]} />
          <meshStandardMaterial color="#171717" metalness={0.45} roughness={0.42} />
        </mesh>
      </group>

      <BladeConnector />
    </group>
  );
}

export default function CeilingFanModel({
  isSelected = false,
  isPreview = false,
  isPlaceable = true,
  status,
}: DetailedModelProps) {
  const rotorRef = useRef<THREE.Group>(null);

  const isOn = isPowered(status);

  const woodTexture = useMemo(() => {
    if (typeof document === "undefined") return null;
    return createWoodTexture();
  }, []);

  useEffect(() => {
    return () => woodTexture?.dispose();
  }, [woodTexture]);

  const previewMaterial = useMemo(() => {
    if (!isPreview) return undefined;

    return new THREE.MeshStandardMaterial({
      color: isPlaceable ? "#22c55e" : "#ef4444",
      transparent: true,
      opacity: 0.48,
      roughness: 0.45,
      metalness: 0.05,
    });
  }, [isPreview, isPlaceable]);

  const bladeAngles = useMemo(() => {
    return Array.from({ length: 5 }, (_, index) => {
      return (index / 5) * Math.PI * 2;
    });
  }, []);

  useFrame((_, delta) => {
    if (!rotorRef.current || isPreview) return;

    if (isOn) {
      rotorRef.current.rotation.y += delta * 3.2;
    }
  });

  const blackMaterial = previewMaterial ?? undefined;

  return (
    <group
      position={[0, MODEL_Y_OFFSET, 0]}
      scale={[MODEL_SCALE, MODEL_SCALE, MODEL_SCALE]}
    >
      {/* Selection ring */}
      {isSelected && !isPreview && (
        <mesh position={[0, -0.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.85, 0.025, 12, 96]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      )}

      {/* Ceiling canopy */}
      <group position={[0, 0.95, 0]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.38, 0.46, 0.16, 64]} />
          {blackMaterial ? (
            <primitive object={blackMaterial} attach="material" />
          ) : (
            <meshStandardMaterial color="#050505" metalness={0.75} roughness={0.32} />
          )}
        </mesh>

        <mesh position={[0, -0.09, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.36, 0.06, 64]} />
          <meshStandardMaterial color="#111111" metalness={0.7} roughness={0.36} />
        </mesh>

        <Screw position={[-0.16, -0.125, 0.12]} />
        <Screw position={[0.16, -0.125, -0.12]} />
      </group>

      {/* Downrod */}
      <mesh position={[0, 0.52, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.085, 0.085, 0.78, 32]} />
        {blackMaterial ? (
          <primitive object={blackMaterial} attach="material" />
        ) : (
          <meshStandardMaterial color="#080808" metalness={0.85} roughness={0.28} />
        )}
      </mesh>

      {/* Motor housing */}
      <group position={[0, 0.02, 0]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.46, 0.5, 0.62, 64]} />
          {blackMaterial ? (
            <primitive object={blackMaterial} attach="material" />
          ) : (
            <meshStandardMaterial color="#101010" metalness={0.75} roughness={0.35} />
          )}
        </mesh>

        <mesh position={[0, 0.34, 0]} castShadow>
          <cylinderGeometry args={[0.37, 0.43, 0.12, 64]} />
          <meshStandardMaterial color="#191919" metalness={0.8} roughness={0.28} />
        </mesh>

        <mesh position={[0, -0.34, 0]} castShadow>
          <cylinderGeometry args={[0.55, 0.6, 0.16, 64]} />
          <meshStandardMaterial color="#060606" metalness={0.82} roughness={0.3} />
        </mesh>
      </group>

      {/* Rotating blade group */}
      <group ref={rotorRef} position={[0, -0.28, 0]}>
        {bladeAngles.map((angle) => (
          <FanBlade
            key={angle}
            angle={angle}
            woodTexture={woodTexture}
            previewMaterial={previewMaterial}
          />
        ))}

        {/* Lower black ring */}
        <mesh position={[0, -0.08, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.66, 0.7, 0.18, 64]} />
          {blackMaterial ? (
            <primitive object={blackMaterial} attach="material" />
          ) : (
            <meshStandardMaterial color="#080808" metalness={0.82} roughness={0.28} />
          )}
        </mesh>
      </group>

      {/* Center frosted light */}
      <group position={[0, -0.47, 0]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.52, 0.44, 0.28, 64]} />
          {previewMaterial ? (
            <primitive object={previewMaterial} attach="material" />
          ) : (
            <meshStandardMaterial
              color={isOn ? "#fffdf3" : "#c9c9c9"}
              emissive={isOn ? "#fff2b0" : "#000000"}
              emissiveIntensity={isOn ? 0.65 : 0}
              roughness={0.18}
              metalness={0.02}
              transparent
              opacity={0.92}
            />
          )}
        </mesh>

        <mesh position={[0, 0.16, 0]}>
          <torusGeometry args={[0.53, 0.035, 16, 96]} />
          <meshStandardMaterial color="#060606" metalness={0.8} roughness={0.28} />
        </mesh>

        {isOn && !isPreview && (
          <pointLight
            position={[0, -0.22, 0]}
            intensity={1.35}
            distance={6}
            decay={2}
            color="#fff3c4"
          />
        )}
      </group>

      {/* Small status indicator */}
      {!isPreview && (
        <mesh position={[0.31, -0.36, 0.43]}>
          <sphereGeometry args={[0.035, 16, 16]} />
          <meshStandardMaterial
            color={isOn ? "#22c55e" : "#991b1b"}
            emissive={isOn ? "#22c55e" : "#450a0a"}
            emissiveIntensity={isOn ? 1.6 : 0.5}
          />
        </mesh>
      )}
    </group>
  );
}
