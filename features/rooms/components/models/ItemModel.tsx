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
import { DetailedModelProps } from "./modelTypes";

export type ItemModelProps = DetailedModelProps & {
  type: string;
};

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
      return null;
  }

  return <group ref={modelRef}>{model}</group>;
}
