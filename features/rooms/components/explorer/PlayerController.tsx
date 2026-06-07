"use client";

/* eslint-disable react-hooks/immutability -- React Three Fiber cameras are updated inside the render loop. */

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { DigitalTwinRoom } from "../../domain/types";

type PlayerControllerProps = {
  room: DigitalTwinRoom;
  controlsEnabled: boolean;
};

type PlayerState = {
  yaw: number;
  pitch: number;
  position: THREE.Vector3;
};

export default function PlayerController({ room, controlsEnabled }: PlayerControllerProps) {
  const { camera, gl } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const player = useRef<PlayerState>({
    yaw: Math.PI,
    pitch: 0,
    position: new THREE.Vector3(0, 1.8, room.length / 2 - 2)
  });

  useEffect(() => {
    const canvas = gl.domElement;

    function handleDoubleClick() {
      if (controlsEnabled && document.pointerLockElement !== canvas) {
        canvas.requestPointerLock?.();
      }
    }

    function handleMouseMove(event: MouseEvent) {
      if (!controlsEnabled || document.pointerLockElement !== canvas) {
        return;
      }

      player.current.yaw -= event.movementX * 0.002;
      player.current.pitch -= event.movementY * 0.002;
      player.current.pitch = Math.max(-1.2, Math.min(1.2, player.current.pitch));
    }

    function handleKeyDown(event: KeyboardEvent) {
      keys.current[event.key.toLowerCase()] = true;
    }

    function handleKeyUp(event: KeyboardEvent) {
      keys.current[event.key.toLowerCase()] = false;
    }

    canvas.addEventListener("dblclick", handleDoubleClick);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      canvas.removeEventListener("dblclick", handleDoubleClick);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [controlsEnabled, gl.domElement]);

  useFrame((_, delta) => {
    if (!controlsEnabled || document.pointerLockElement !== gl.domElement) {
      return;
    }

    const speed = 4 * delta;
    const forward = new THREE.Vector3(-Math.sin(player.current.yaw), 0, -Math.cos(player.current.yaw));
    const right = new THREE.Vector3(Math.cos(player.current.yaw), 0, -Math.sin(player.current.yaw));
    const movement = new THREE.Vector3();

    if (keys.current.w) movement.add(forward);
    if (keys.current.s) movement.sub(forward);
    if (keys.current.a) movement.sub(right);
    if (keys.current.d) movement.add(right);

    if (movement.lengthSq() > 0) {
      movement.normalize().multiplyScalar(speed);
      player.current.position.add(movement);
    }

    const margin = 0.6;
    player.current.position.x = THREE.MathUtils.clamp(
      player.current.position.x,
      -room.width / 2 + margin,
      room.width / 2 - margin
    );
    player.current.position.z = THREE.MathUtils.clamp(
      player.current.position.z,
      -room.length / 2 + margin,
      room.length / 2 - margin
    );

    camera.position.copy(player.current.position);
    camera.rotation.order = "YXZ";
    camera.rotation.y = player.current.yaw;
    camera.rotation.x = player.current.pitch;
  });

  return null;
}
