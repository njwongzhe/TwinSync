"use client";

import { useMemo, useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import styles from "../../rooms.module.css";
import { canPlaceItem, roundToGrid } from "../../domain/grid";
import { getItemDefinition, MAJOR_GRID_EVERY } from "../../domain/items";
import {
  DigitalTwinRoom,
  ItemDefinition,
  PlacedItem,
  PlacementPreview
} from "../../domain/types";
import ItemModel from "../models/ItemModel";

type PlacementSurface = "floor" | "wall" | "ceiling";
const SCREEN_CENTER = new THREE.Vector2(0, 0);

type RoomSceneProps = {
  room: DigitalTwinRoom;
  selectedDefinition: ItemDefinition | null;
  previewRotation: number;
  onHoverItem: (itemId: string | null) => void;
  onPlacementPreview: (preview: PlacementPreview | null) => void;
};

function getPlacedItemId(object: THREE.Object3D) {
  let current: THREE.Object3D | null = object;

  while (current) {
    if (typeof current.userData?.placedItemId === "string") {
      return current.userData.placedItemId;
    }

    current = current.parent;
  }

  return null;
}

function clampToRoomHeight(value: number, definition: ItemDefinition, room: DigitalTwinRoom) {
  return THREE.MathUtils.clamp(value, definition.height / 2, room.height - definition.height / 2);
}

function createSurfacePreview(
  room: DigitalTwinRoom,
  definition: ItemDefinition,
  point: THREE.Vector3,
  surface: PlacementSurface,
  previewRotation: number,
  wallAxis?: "x" | "z",
  wallSide?: number
): Omit<PlacementPreview, "placeable"> | null {
  if (definition.mount !== surface) {
    return null;
  }

  if (surface === "floor") {
    return {
      position: {
        x: roundToGrid(point.x),
        y: definition.height / 2,
        z: roundToGrid(point.z)
      },
      rotationY: previewRotation
    };
  }

  if (surface === "ceiling") {
    return {
      position: {
        x: roundToGrid(point.x),
        y: room.height - definition.height / 2,
        z: roundToGrid(point.z)
      },
      rotationY: previewRotation
    };
  }

  if (wallAxis === "x" && wallSide) {
    return {
      position: {
        x: wallSide * (room.width / 2 - definition.length / 2),
        y: clampToRoomHeight(roundToGrid(point.y), definition, room),
        z: roundToGrid(point.z)
      },
      rotationY: wallSide > 0 ? -Math.PI / 2 : Math.PI / 2
    };
  }

  if (wallAxis === "z" && wallSide) {
    return {
      position: {
        x: roundToGrid(point.x),
        y: clampToRoomHeight(roundToGrid(point.y), definition, room),
        z: wallSide * (room.length / 2 - definition.length / 2)
      },
      rotationY: wallSide > 0 ? Math.PI : 0
    };
  }

  return null;
}

export default function RoomScene({
  room,
  selectedDefinition,
  previewRotation,
  onHoverItem,
  onPlacementPreview
}: RoomSceneProps) {
  const { camera, raycaster, scene } = useThree();
  const [preview, setPreview] = useState<PlacementPreview | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const previousHoverRef = useRef<string | null>(null);
  const previousPreviewKeyRef = useRef("none");

  useFrame(() => {
    raycaster.setFromCamera(SCREEN_CENTER, camera);

    const targetHit = raycaster.intersectObjects(scene.children, true).find((hit) => (
      getPlacedItemId(hit.object) || hit.object.userData?.placementSurface
    ));
    const nextHoveredItemId = targetHit ? getPlacedItemId(targetHit.object) : null;

    if (previousHoverRef.current !== nextHoveredItemId) {
      previousHoverRef.current = nextHoveredItemId;
      setHoveredItemId(nextHoveredItemId);
      onHoverItem(nextHoveredItemId);
    }

    let nextPreview: PlacementPreview | null = null;

    if (selectedDefinition && targetHit) {
      const targetItem = nextHoveredItemId
        ? room.items.find((item) => item.id === nextHoveredItemId) ?? null
        : null;
      const targetDefinition = targetItem ? getItemDefinition(targetItem.itemTypeId) : null;

      if (
        targetItem &&
        targetDefinition?.canHoldItems &&
        selectedDefinition.mount === "floor" &&
        selectedDefinition.category === "device"
      ) {
        const position = {
          x: roundToGrid(targetItem.position.x),
          y: targetItem.position.y + targetDefinition.height / 2 + selectedDefinition.height / 2,
          z: roundToGrid(targetItem.position.z)
        };

        nextPreview = {
          position,
          rotationY: previewRotation,
          placeable: canPlaceItem(room, selectedDefinition, position, previewRotation, targetItem.id),
          supportItemId: targetItem.id
        };
      } else if (!targetItem) {
        const surfacePreview = createSurfacePreview(
          room,
          selectedDefinition,
          targetHit.point,
          targetHit.object.userData.placementSurface,
          previewRotation,
          targetHit.object.userData.wallAxis,
          targetHit.object.userData.wallSide
        );

        if (surfacePreview) {
          nextPreview = {
            ...surfacePreview,
            placeable: canPlaceItem(
              room,
              selectedDefinition,
              surfacePreview.position,
              surfacePreview.rotationY
            )
          };
        }
      }
    }

    const nextPreviewKey = nextPreview ? JSON.stringify(nextPreview) : "none";

    if (previousPreviewKeyRef.current !== nextPreviewKey) {
      previousPreviewKeyRef.current = nextPreviewKey;
      setPreview(nextPreview);
      onPlacementPreview(nextPreview);
    }
  });

  return (
    <>
      <RoomShell room={room} />
      {room.items.map((item) => (
        <PlacedItemMesh key={item.id} item={item} hovered={item.id === hoveredItemId} />
      ))}
      {selectedDefinition && preview && (
        <group
          position={[preview.position.x, preview.position.y, preview.position.z]}
          rotation={[0, preview.rotationY, 0]}
        >
          <ItemModel
            type={selectedDefinition.id}
            status="on"
            isPreview
            isPlaceable={preview.placeable}
          />
        </group>
      )}
    </>
  );
}

function RoomShell({ room }: { room: DigitalTwinRoom }) {
  const wallThickness = 0.12;
  const halfW = room.width / 2;
  const halfL = room.length / 2;

  return (
    <group>
      <mesh position={[0, -0.03, 0]} receiveShadow userData={{ placementSurface: "floor" }}>
        <boxGeometry args={[room.width, 0.06, room.length]} />
        <meshStandardMaterial color="#b7793b" roughness={0.72} />
      </mesh>

      <mesh position={[0, room.height + wallThickness / 2, 0]} receiveShadow userData={{ placementSurface: "ceiling" }}>
        <boxGeometry args={[room.width, wallThickness, room.length]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.82} />
      </mesh>

      <mesh
        position={[0, room.height / 2, -halfL - wallThickness / 2]}
        receiveShadow
        userData={{ placementSurface: "wall", wallAxis: "z", wallSide: -1 }}
      >
        <boxGeometry args={[room.width, room.height, wallThickness]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh
        position={[0, room.height / 2, halfL + wallThickness / 2]}
        receiveShadow
        userData={{ placementSurface: "wall", wallAxis: "z", wallSide: 1 }}
      >
        <boxGeometry args={[room.width, room.height, wallThickness]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh
        position={[-halfW - wallThickness / 2, room.height / 2, 0]}
        receiveShadow
        userData={{ placementSurface: "wall", wallAxis: "x", wallSide: -1 }}
      >
        <boxGeometry args={[wallThickness, room.height, room.length]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh
        position={[halfW + wallThickness / 2, room.height / 2, 0]}
        receiveShadow
        userData={{ placementSurface: "wall", wallAxis: "x", wallSide: 1 }}
      >
        <boxGeometry args={[wallThickness, room.height, room.length]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      <DashedGrid room={room} />
    </group>
  );
}

function DashedGrid({ room }: { room: DigitalTwinRoom }) {
  const linePoints = useMemo(() => {
    const points: number[] = [];
    const dash = 0.38;
    const gap = 0.22;

    function addDashedLine(start: THREE.Vector3, end: THREE.Vector3) {
      const direction = new THREE.Vector3().subVectors(end, start);
      const length = direction.length();
      direction.normalize();

      for (let distance = 0; distance < length; distance += dash + gap) {
        const segmentStart = start.clone().addScaledVector(direction, distance);
        const segmentEnd = start.clone().addScaledVector(direction, Math.min(distance + dash, length));
        points.push(segmentStart.x, segmentStart.y, segmentStart.z, segmentEnd.x, segmentEnd.y, segmentEnd.z);
      }
    }

    for (let x = -room.width / 2; x <= room.width / 2; x += 1) {
      addDashedLine(new THREE.Vector3(x, 0.02, -room.length / 2), new THREE.Vector3(x, 0.02, room.length / 2));
      addDashedLine(new THREE.Vector3(x, room.height - 0.02, -room.length / 2), new THREE.Vector3(x, room.height - 0.02, room.length / 2));
    }

    for (let z = -room.length / 2; z <= room.length / 2; z += 1) {
      addDashedLine(new THREE.Vector3(-room.width / 2, 0.025, z), new THREE.Vector3(room.width / 2, 0.025, z));
      addDashedLine(new THREE.Vector3(-room.width / 2, room.height - 0.025, z), new THREE.Vector3(room.width / 2, room.height - 0.025, z));
    }

    for (let x = -room.width / 2; x <= room.width / 2; x += MAJOR_GRID_EVERY) {
      addDashedLine(new THREE.Vector3(x, 0, -room.length / 2), new THREE.Vector3(x, room.height, -room.length / 2));
      addDashedLine(new THREE.Vector3(x, 0, room.length / 2), new THREE.Vector3(x, room.height, room.length / 2));
    }

    for (let z = -room.length / 2; z <= room.length / 2; z += MAJOR_GRID_EVERY) {
      addDashedLine(new THREE.Vector3(-room.width / 2, 0, z), new THREE.Vector3(-room.width / 2, room.height, z));
      addDashedLine(new THREE.Vector3(room.width / 2, 0, z), new THREE.Vector3(room.width / 2, room.height, z));
    }

    return new Float32Array(points);
  }, [room]);

  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[linePoints, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#334155" transparent opacity={0.32} />
    </lineSegments>
  );
}

function PlacedItemMesh({ item, hovered }: { item: PlacedItem; hovered: boolean }) {
  const definition = getItemDefinition(item.itemTypeId);

  if (!definition) {
    return null;
  }

  return (
    <group
      position={[item.position.x, item.position.y, item.position.z]}
      rotation={[0, item.rotationY, 0]}
      userData={{ placedItemId: item.id }}
    >
      <ItemModel type={item.itemTypeId} status={item.status} isSelected={hovered} />

      <Html
        distanceFactor={12}
        position={[0, definition.height / 2 + 0.25, 0]}
        center
        zIndexRange={[5, 0]}
      >
        <div className={styles.itemLabel}>{item.name}</div>
      </Html>
    </group>
  );
}
