import { useEffect, useRef } from "react";
import * as THREE from "three";
import CeilingAircondModel from "./CeilingAircondModel";
import CeilingFanModel from "./CeilingFanModel";
import CeilingLightModel from "./CeilingLightModel";
import DeskWithDesktopModel from "./DeskWithDesktopModel";
import DesktopModel from "./DesktopModel";
import DoorModel from "./DoorModel";
import OfficeChairModel from "./OfficeChairModel";
import PrinterModel from "./PrinterModel";
import ProjectorModel from "./ProjectorModel";
import SmallTableModel from "./SmallTableModel";
import LongTableModel from "./LongTableModel";
import WallAircondModel from "./WallAircondModel";
import WhiteboardModel from "./WhiteboardModel";
import WindowModel from "./WindowModel";
import { DetailedModelProps, modelMaterial, StatusLight } from "./modelTypes";
import { getItemDefinition } from "../../domain/items";
import type { ItemMeshDefinition } from "../../domain/types";

export type ItemModelProps = DetailedModelProps & {
  type: string;
};

function boxArgs(args: number[]): [number, number, number] {
  return [args[0] ?? 0.1, args[1] ?? 0.1, args[2] ?? 0.1];
}

function cylinderArgs(args: number[]): [number, number, number, number] {
  return [args[0] ?? 0.05, args[1] ?? args[0] ?? 0.05, args[2] ?? 0.1, args[3] ?? 16];
}

function sphereArgs(args: number[]): [number, number, number] {
  return [args[0] ?? 0.05, args[1] ?? 16, args[2] ?? 12];
}

function renderMeshGeometry(mesh: ItemMeshDefinition) {
  if (mesh.shape === "cylinder") {
    return <cylinderGeometry args={cylinderArgs(mesh.args)} />;
  }
  if (mesh.shape === "sphere") {
    return <sphereGeometry args={sphereArgs(mesh.args)} />;
  }
  return <boxGeometry args={boxArgs(mesh.args)} />;
}

export default function ItemModel({ type, ...props }: ItemModelProps) {
  const modelRef = useRef<THREE.Group>(null);

  useEffect(() => {
    modelRef.current?.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = !props.isPreview;
        object.receiveShadow = !props.isPreview;
      }
    });
  }, [props.isPreview, type]);

  let model = null;

  switch (type) {
    case "desk-desktop":
      model = <DeskWithDesktopModel {...props} />;
      break;
    case "wall-ac":
      model = <WallAircondModel {...props} />;
      break;
    case "ceiling-ac":
      model = <CeilingAircondModel {...props} />;
      break;
    case "projector":
      model = <ProjectorModel {...props} />;
      break;
    case "ceiling-light":
      model = <CeilingLightModel {...props} />;
      break;
    case "printer":
      model = <PrinterModel {...props} />;
      break;
    case "desktop":
      model = <DesktopModel {...props} />;
      break;
    case "ceiling-fan":
      model = <CeilingFanModel {...props} />;
      break;
    case "small-table":
      model = <SmallTableModel {...props} />;
      break;
    case "long-table":
      model = <LongTableModel {...props} />;
      break;
    case "whiteboard":
      model = <WhiteboardModel {...props} />;
      break;
    case "window":
      model = <WindowModel {...props} />;
      break;
    case "door":
      model = <DoorModel {...props} />;
      break;
    case "office-chair":
      model = <OfficeChairModel {...props} />;
      break;
    default:
      break;
  }

  if (!model) {
    const definition = getItemDefinition(type);
    if (definition) {
      const w = definition.width;
      const h = definition.height;
      const l = definition.length;
      const col = definition.color || "#64748b";

      if (definition.meshes && definition.meshes.length > 0) {
        model = (
          <group>
            {definition.meshes.map((mesh, idx) => {
              const pos = mesh.position || [0, 0, 0];
              const rot = mesh.rotation || [0, 0, 0];
              const color = mesh.color || col;
              return (
                <mesh
                  key={idx}
                  position={[pos[0] ?? 0, pos[1] ?? 0, pos[2] ?? 0]}
                  rotation={[rot[0] ?? 0, rot[1] ?? 0, rot[2] ?? 0]}
                  castShadow
                  receiveShadow
                >
                  {renderMeshGeometry(mesh)}
                  <meshStandardMaterial {...modelMaterial(props, color)} />
                </mesh>
              );
            })}
            {definition.isDevice && (
              <StatusLight position={[0, h / 2 - 0.05, l / 2 - 0.05]} status={props.status} />
            )}
          </group>
        );
      } else {
        model = (
          <group>
            <mesh castShadow receiveShadow position={[0, 0, 0]}>
              <boxGeometry args={[w, h, l]} />
              <meshStandardMaterial {...modelMaterial(props, col)} />
            </mesh>
            {definition.isDevice && (
              <StatusLight position={[0, h / 2 - 0.05, l / 2 - 0.05]} status={props.status} />
            )}
          </group>
        );
      }
    } else {
      return null;
    }
  }

  return <group ref={modelRef}>{model}</group>;
}
