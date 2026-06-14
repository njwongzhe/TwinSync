import { NextResponse } from "next/server";

type Category = "device" | "furniture" | "structure";
type Mount = "floor" | "wall" | "ceiling";
type Shape = "box" | "cylinder" | "sphere";

type MeshDefinition = {
  shape: Shape;
  args: number[];
  position: number[];
  rotation?: number[];
  color: string;
};

type GeneratedAsset = {
  id: string;
  label: string;
  category: Category;
  mount: Mount;
  width: number;
  length: number;
  height: number;
  color: string;
  isDevice: boolean;
  defaultPowerWatt?: number;
  description: string;
  icon: string;
  meshes: MeshDefinition[];
};

type AssetArchetype =
  | "table"
  | "chair"
  | "sofa"
  | "cabinet"
  | "shelf"
  | "bed"
  | "screen"
  | "computer"
  | "printer"
  | "sensor"
  | "air-conditioner"
  | "light"
  | "fan"
  | "door"
  | "window"
  | "whiteboard"
  | "generic";

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

const ARCHETYPE_KEYWORDS: Array<[AssetArchetype, string[]]> = [
  ["air-conditioner", ["air conditioner", "air conditional", "aircond", "ac", "climate", "hvac"]],
  ["whiteboard", ["whiteboard", "blackboard", "board"]],
  ["computer", ["computer", "desktop", "pc", "monitor", "workstation"]],
  ["printer", ["printer", "copier", "scanner"]],
  ["sensor", ["sensor", "thermostat", "camera", "detector", "router", "speaker"]],
  ["screen", ["screen", "display", "tv", "television", "projector"]],
  ["chair", ["chair", "stool", "seat"]],
  ["sofa", ["sofa", "couch", "lounge"]],
  ["table", ["table", "desk", "bench"]],
  ["cabinet", ["cabinet", "locker", "wardrobe", "drawer", "cupboard"]],
  ["shelf", ["shelf", "rack", "bookcase"]],
  ["bed", ["bed", "mattress"]],
  ["light", ["light", "lamp", "led"]],
  ["fan", ["fan"]],
  ["door", ["door", "gate"]],
  ["window", ["window"]],
];

const ARCHETYPE_META: Record<AssetArchetype, { category: Category; mount: Mount; icon: string; power?: number }> = {
  table: { category: "furniture", mount: "floor", icon: "🪑" },
  chair: { category: "furniture", mount: "floor", icon: "🪑" },
  sofa: { category: "furniture", mount: "floor", icon: "🛋️" },
  cabinet: { category: "furniture", mount: "floor", icon: "🗄️" },
  shelf: { category: "furniture", mount: "floor", icon: "📚" },
  bed: { category: "furniture", mount: "floor", icon: "🛏️" },
  screen: { category: "device", mount: "wall", icon: "🖥️", power: 90 },
  computer: { category: "device", mount: "floor", icon: "🖥️", power: 160 },
  printer: { category: "device", mount: "floor", icon: "🖨️", power: 90 },
  sensor: { category: "device", mount: "wall", icon: "🌡️", power: 8 },
  "air-conditioner": { category: "device", mount: "wall", icon: "❄️", power: 950 },
  light: { category: "device", mount: "ceiling", icon: "💡", power: 36 },
  fan: { category: "device", mount: "ceiling", icon: "🌀", power: 70 },
  door: { category: "structure", mount: "wall", icon: "🚪" },
  window: { category: "structure", mount: "wall", icon: "🪟" },
  whiteboard: { category: "structure", mount: "wall", icon: "⬜" },
  generic: { category: "furniture", mount: "floor", icon: "📦" },
};

const DEFAULT_DIMENSIONS: Record<AssetArchetype, { width: number; length: number; height: number; color: string }> = {
  table: { width: 1.8, length: 1, height: 0.85, color: "#a16207" },
  chair: { width: 0.85, length: 0.85, height: 1.25, color: "#1f2937" },
  sofa: { width: 2.2, length: 0.9, height: 0.85, color: "#475569" },
  cabinet: { width: 1.2, length: 0.45, height: 1.8, color: "#92400e" },
  shelf: { width: 1.4, length: 0.4, height: 1.8, color: "#854d0e" },
  bed: { width: 2.1, length: 1.4, height: 0.55, color: "#94a3b8" },
  screen: { width: 1.5, length: 0.16, height: 0.9, color: "#111827" },
  computer: { width: 1, length: 0.7, height: 0.85, color: "#0f172a" },
  printer: { width: 0.9, length: 0.75, height: 0.65, color: "#64748b" },
  sensor: { width: 0.42, length: 0.12, height: 0.42, color: "#e2e8f0" },
  "air-conditioner": { width: 1.8, length: 0.32, height: 0.5, color: "#f8fafc" },
  light: { width: 0.8, length: 0.8, height: 0.18, color: "#fef08a" },
  fan: { width: 1.8, length: 1.8, height: 0.35, color: "#94a3b8" },
  door: { width: 1.1, length: 0.18, height: 2.1, color: "#7c2d12" },
  window: { width: 1.6, length: 0.14, height: 1.2, color: "#93c5fd" },
  whiteboard: { width: 2.4, length: 0.14, height: 1.2, color: "#f8fafc" },
  generic: { width: 1, length: 1, height: 1, color: "#64748b" },
};

function buildPrompt(userPrompt: string) {
  return `You are a senior industrial designer and low-poly 3D artist creating a polished, realistic digital-twin asset for a React Three Fiber room editor.

User request: ${JSON.stringify(userPrompt)}

Return exactly one JSON object and no markdown. The asset must be immediately recognizable, visually complete from every angle, correctly proportioned, and built only from box, cylinder, and sphere primitives.

Design process:
1. Identify the nearest supported archetype and its real-world construction.
2. Build the primary silhouette and load-bearing structure.
3. Add the functional parts a real object needs.
4. Add secondary details that communicate scale and purpose.
5. Apply a coherent, colourful material palette with realistic contrast.

Coordinate system and geometry rules:
- x = width, y = height, z = length. The asset is centered at [0, 0, 0].
- box args must be [width, height, length].
- cylinder args must be [radiusTop, radiusBottom, height, radialSegments].
- sphere args must be [radius, widthSegments, heightSegments].
- Every mesh must fit inside the asset width, length, and height.
- The lowest visible point must be at y = -height / 2. Floor objects must visibly stand on the floor.
- Use 12 to 18 purposeful meshes. Never return a single block or an unfinished shell.
- Make connected parts touch correctly. Do not create floating, intersecting, paper-thin, or unsupported parts.
- Preserve sensible symmetry and alignment where the real object would be symmetrical.
- Use realistic dimensions in meters and realistic relative thicknesses.
- Include all important archetype-specific parts. Examples:
  - chair: seat, backrest, support structure, legs or pedestal, and optional arms;
  - table: top, supports or legs, braces, and edge detail;
  - computer: monitor frame and screen, stand, base, system unit, controls, and indicator;
  - air-conditioner: casing, intake, outlet, vent slats, display, and status indicator;
  - printer: body, paper tray, output slot, scanner or lid, control panel, and indicator;
  - cabinet or shelf: frame, shelves or doors, handles, base, and visible depth;
  - light or fan: mount, stem or housing, shade or blades, hub, and operating detail.
- Use 4 to 7 coordinated hex colours: a main material, a lighter face, a darker trim/shadow, one functional material, and one or two restrained accent colours.
- Avoid making every mesh the same colour. Use colour to separate functional parts.
- Prefer believable material colours such as painted metal, wood, polymer, glass, fabric, and indicator lights. Avoid excessive neon unless requested.
- Small detail meshes must remain visible at normal preview distance.
- Do not invent unsupported geometry or texture fields.

Choose the nearest archetype from: table, chair, sofa, cabinet, shelf, bed, screen, computer, printer, sensor, air-conditioner, light, fan, door, window, whiteboard, generic.

Required JSON fields:
id, label, category, mount, width, length, height, color, isDevice, defaultPowerWatt, description, icon (MUST be a single unicode emoji character symbol, e.g. '🛋️', do NOT output words like 'sofa'), archetype, meshes.`;
}

function detectArchetype(text: string): AssetArchetype {
  const normalized = text.toLowerCase();
  for (const [archetype, keywords] of ARCHETYPE_KEYWORDS) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      return archetype;
    }
  }
  return "generic";
}

function titleCase(text: string) {
  return text
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function makeId(text: string, fallback: AssetArchetype) {
  const clean = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 42)
    .replace(/^-|-$/g, "");
  return clean || fallback;
}

function clamp(value: unknown, min: number, max: number, fallback: number) {
  const numberValue = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.min(max, Math.max(min, numberValue));
}

function round(value: number) {
  return Number(value.toFixed(3));
}

function cleanColor(value: unknown, fallback: string) {
  return typeof value === "string" && HEX_COLOR.test(value) ? value.toLowerCase() : fallback;
}

function cleanVector(value: unknown, fallback: number[], min: number[], max: number[]) {
  const source = Array.isArray(value) ? value : [];
  return [0, 1, 2].map((index) => round(clamp(source[index], min[index], max[index], fallback[index] ?? 0)));
}

function cleanRotation(value: unknown) {
  const source = Array.isArray(value) ? value : [];
  return [0, 1, 2].map((index) => round(clamp(source[index], -Math.PI * 2, Math.PI * 2, 0)));
}

function normalizeMeshArgs(shape: Shape, args: unknown, fallbackSize: [number, number, number]) {
  const source = Array.isArray(args) ? args : [];
  if (shape === "cylinder") {
    const radiusTop = clamp(source[0], 0.015, 2, Math.min(fallbackSize[0], fallbackSize[2]) / 2);
    const radiusBottom = clamp(source[1], 0.015, 2, radiusTop);
    const height = clamp(source[2], 0.02, 4, fallbackSize[1]);
    const segments = Math.round(clamp(source[3], 8, 48, 20));
    return [round(radiusTop), round(radiusBottom), round(height), segments];
  }
  if (shape === "sphere") {
    const radius = clamp(source[0], 0.015, 2, Math.min(fallbackSize[0], fallbackSize[1], fallbackSize[2]) / 2);
    const widthSegments = Math.round(clamp(source[1], 8, 48, 20));
    const heightSegments = Math.round(clamp(source[2], 6, 32, 16));
    return [round(radius), widthSegments, heightSegments];
  }
  return [
    round(clamp(source[0], 0.02, 5, fallbackSize[0])),
    round(clamp(source[1], 0.02, 4, fallbackSize[1])),
    round(clamp(source[2], 0.02, 5, fallbackSize[2])),
  ];
}

function meshBounds(mesh: MeshDefinition) {
  if (mesh.shape === "sphere") {
    const radius = mesh.args[0] ?? 0;
    return { halfX: radius, halfY: radius, halfZ: radius };
  }
  if (mesh.shape === "cylinder") {
    const radius = Math.max(mesh.args[0] ?? 0, mesh.args[1] ?? 0);
    return { halfX: radius, halfY: (mesh.args[2] ?? 0) / 2, halfZ: radius };
  }
  return {
    halfX: (mesh.args[0] ?? 0) / 2,
    halfY: (mesh.args[1] ?? 0) / 2,
    halfZ: (mesh.args[2] ?? 0) / 2,
  };
}

function normalizeMesh(mesh: unknown, asset: Pick<GeneratedAsset, "width" | "length" | "height" | "color">): MeshDefinition | null {
  if (!mesh || typeof mesh !== "object") return null;
  const source = mesh as Partial<MeshDefinition>;
  const shape: Shape = source.shape === "cylinder" || source.shape === "sphere" ? source.shape : "box";
  const args = normalizeMeshArgs(shape, source.args, [asset.width * 0.5, asset.height * 0.5, asset.length * 0.5]);
  const bounds = meshBounds({ shape, args, position: [0, 0, 0], color: asset.color });
  const position = cleanVector(
    source.position,
    [0, 0, 0],
    [-asset.width / 2 + bounds.halfX, -asset.height / 2 + bounds.halfY, -asset.length / 2 + bounds.halfZ],
    [asset.width / 2 - bounds.halfX, asset.height / 2 - bounds.halfY, asset.length / 2 - bounds.halfZ],
  );
  return {
    shape,
    args,
    position,
    rotation: cleanRotation(source.rotation),
    color: cleanColor(source.color, asset.color),
  };
}

function bottomY(mesh: MeshDefinition) {
  return mesh.position[1] - meshBounds(mesh).halfY;
}

function groundMeshes(meshes: MeshDefinition[], height: number) {
  if (!meshes.length) return meshes;
  const currentBottom = Math.min(...meshes.map(bottomY));
  const offset = -height / 2 - currentBottom;
  if (Math.abs(offset) < 0.001) return meshes;
  return meshes.map((mesh) => ({
    ...mesh,
    position: [mesh.position[0], round(mesh.position[1] + offset), mesh.position[2]],
  }));
}

function box(args: [number, number, number], position: [number, number, number], color: string, rotation?: [number, number, number]): MeshDefinition {
  return { shape: "box", args: args.map(round), position: position.map(round), rotation, color };
}

function cyl(args: [number, number, number, number], position: [number, number, number], color: string, rotation?: [number, number, number]): MeshDefinition {
  return { shape: "cylinder", args: [round(args[0]), round(args[1]), round(args[2]), args[3]], position: position.map(round), rotation, color };
}

function sphere(args: [number, number, number], position: [number, number, number], color: string): MeshDefinition {
  return { shape: "sphere", args: [round(args[0]), args[1], args[2]], position: position.map(round), color };
}

function templateMeshes(archetype: AssetArchetype, width: number, length: number, height: number, color: string): MeshDefinition[] {
  const dark = "#1f2937";
  const trim = "#64748b";
  const light = "#e2e8f0";
  const accent = "#38bdf8";
  const wood = color;
  const x = width / 2;
  const z = length / 2;
  const y = height / 2;

  switch (archetype) {
    case "chair":
      return [
        box([width * 0.68, height * 0.12, length * 0.62], [0, -y + height * 0.45, 0.05 * length], color),
        box([width * 0.7, height * 0.52, length * 0.1], [0, y - height * 0.28, -z + length * 0.12], dark, [0.14, 0, 0]),
        cyl([0.04, 0.04, height * 0.42, 18], [0, -y + height * 0.21, 0], trim),
        cyl([0.14, 0.14, 0.05, 22], [0, -y + 0.025, 0], trim),
        box([width * 0.36, 0.04, 0.055], [x * 0.28, -y + 0.06, 0], trim),
        box([width * 0.36, 0.04, 0.055], [-x * 0.28, -y + 0.06, 0], trim),
        box([0.055, 0.04, length * 0.36], [0, -y + 0.06, z * 0.28], trim),
        box([0.055, 0.04, length * 0.36], [0, -y + 0.06, -z * 0.28], trim),
        box([0.06, height * 0.3, 0.06], [-x * 0.5, -y + height * 0.42, 0.02], trim),
        box([0.06, height * 0.3, 0.06], [x * 0.5, -y + height * 0.42, 0.02], trim),
      ];
    case "table":
      return [
        box([width * 0.92, height * 0.12, length * 0.9], [0, y - height * 0.16, 0], wood),
        box([width * 0.84, height * 0.04, length * 0.82], [0, y - height * 0.08, 0], "#c08435"),
        ...[-1, 1].flatMap((sx) =>
          [-1, 1].map((sz) => box([0.09, height * 0.72, 0.09], [sx * x * 0.72, -y + height * 0.36, sz * z * 0.68], "#78350f")),
        ),
        box([width * 0.74, 0.06, 0.06], [0, -y + height * 0.45, -z * 0.68], "#854d0e"),
        box([width * 0.74, 0.06, 0.06], [0, -y + height * 0.45, z * 0.68], "#854d0e"),
      ];
    case "sofa":
      return [
        box([width * 0.9, height * 0.28, length * 0.66], [0, -y + height * 0.28, z * 0.08], color),
        box([width * 0.92, height * 0.55, length * 0.14], [0, -y + height * 0.55, -z * 0.58], dark),
        box([width * 0.12, height * 0.38, length * 0.7], [-x * 0.48, -y + height * 0.4, z * 0.04], dark),
        box([width * 0.12, height * 0.38, length * 0.7], [x * 0.48, -y + height * 0.4, z * 0.04], dark),
        box([width * 0.27, height * 0.08, length * 0.48], [-x * 0.28, -y + height * 0.46, z * 0.1], "#94a3b8"),
        box([width * 0.27, height * 0.08, length * 0.48], [x * 0.28, -y + height * 0.46, z * 0.1], "#94a3b8"),
        ...[-0.34, 0.34].flatMap((sx) => [-0.24, 0.34].map((sz) => box([0.08, 0.12, 0.08], [sx * width, -y + 0.06, sz * length], dark))),
      ];
    case "cabinet":
    case "shelf":
      return [
        box([width, height, length * 0.12], [0, 0, -z + length * 0.06], "#78350f"),
        box([0.08, height, length], [-x + 0.04, 0, 0], color),
        box([0.08, height, length], [x - 0.04, 0, 0], color),
        box([width, 0.08, length], [0, -y + 0.04, 0], color),
        box([width, 0.08, length], [0, y - 0.04, 0], color),
        box([width * 0.86, 0.055, length * 0.84], [0, -height * 0.22, 0.02], "#a16207"),
        box([width * 0.86, 0.055, length * 0.84], [0, height * 0.08, 0.02], "#a16207"),
        box([width * 0.86, 0.055, length * 0.84], [0, height * 0.36, 0.02], "#a16207"),
        ...(archetype === "cabinet"
          ? [
              box([width * 0.42, height * 0.78, 0.05], [-width * 0.22, 0, z - 0.03], "#92400e"),
              box([width * 0.42, height * 0.78, 0.05], [width * 0.22, 0, z - 0.03], "#92400e"),
              sphere([0.035, 16, 12], [-width * 0.06, 0, z], "#facc15"),
              sphere([0.035, 16, 12], [width * 0.06, 0, z], "#facc15"),
            ]
          : []),
      ];
    case "bed":
      return [
        box([width, height * 0.16, length], [0, -y + height * 0.18, 0], "#78350f"),
        box([width * 0.92, height * 0.18, length * 0.86], [0, -y + height * 0.34, 0], "#e2e8f0"),
        box([width * 0.88, height * 0.12, length * 0.42], [0, -y + height * 0.47, z * 0.18], color),
        box([width, height * 0.62, length * 0.08], [0, -y + height * 0.48, -z + length * 0.04], "#92400e"),
        box([width * 0.36, height * 0.09, length * 0.22], [-x * 0.24, -y + height * 0.54, -z * 0.55], "#f8fafc"),
        box([width * 0.36, height * 0.09, length * 0.22], [x * 0.24, -y + height * 0.54, -z * 0.55], "#f8fafc"),
      ];
    case "computer":
      return [
        box([width * 0.74, height * 0.45, length * 0.08], [0, y - height * 0.32, -z * 0.15], dark),
        box([width * 0.64, height * 0.34, length * 0.025], [0, y - height * 0.32, -z * 0.095], accent),
        box([width * 0.12, height * 0.28, length * 0.08], [0, -y + height * 0.42, -z * 0.15], trim),
        box([width * 0.42, height * 0.06, length * 0.32], [0, -y + height * 0.29, -z * 0.08], trim),
        box([width * 0.26, height * 0.58, length * 0.38], [x * 0.32, -y + height * 0.37, z * 0.18], "#111827"),
        box([width * 0.2, height * 0.08, length * 0.025], [x * 0.32, -y + height * 0.53, z * 0.38], accent),
        box([width * 0.52, height * 0.04, length * 0.22], [-x * 0.18, -y + 0.02, z * 0.28], dark),
        sphere([0.035, 16, 12], [x * 0.32, -y + height * 0.65, z * 0.38], "#22c55e"),
      ];
    case "printer":
      return [
        box([width * 0.9, height * 0.42, length * 0.78], [0, -y + height * 0.32, 0], trim),
        box([width * 0.82, height * 0.2, length * 0.62], [0, -y + height * 0.62, -z * 0.05], light),
        box([width * 0.58, height * 0.035, length * 0.1], [0, -y + height * 0.78, z * 0.34], dark),
        box([width * 0.64, height * 0.04, length * 0.4], [0, -y + height * 0.14, z * 0.22], "#f8fafc"),
        box([width * 0.24, height * 0.08, length * 0.035], [x * 0.28, -y + height * 0.56, z * 0.34], "#0f172a"),
        sphere([0.03, 16, 12], [x * 0.42, -y + height * 0.58, z * 0.34], "#22c55e"),
      ];
    case "air-conditioner":
      return [
        box([width * 0.96, height * 0.78, length * 0.76], [0, 0, 0], light),
        box([width * 0.88, height * 0.26, length * 0.08], [0, -height * 0.08, z * 0.39], "#cbd5e1"),
        box([width * 0.82, height * 0.08, length * 0.08], [0, -height * 0.3, z * 0.42], "#bae6fd", [0.14, 0, 0]),
        ...[-0.33, -0.12, 0.09, 0.3].map((sx) => box([width * 0.12, height * 0.035, length * 0.04], [sx * width, -height * 0.3, z * 0.47], trim)),
        box([width * 0.18, height * 0.12, length * 0.035], [x * 0.34, height * 0.12, z * 0.45], accent),
        sphere([0.025, 16, 12], [x * 0.46, height * 0.14, z * 0.46], "#22c55e"),
      ];
    case "sensor":
      return [
        box([width * 0.82, height * 0.82, length * 0.56], [0, 0, 0], light),
        box([width * 0.62, height * 0.32, length * 0.04], [0, height * 0.12, z * 0.31], "#0f172a"),
        sphere([Math.min(width, height) * 0.12, 20, 14], [0, -height * 0.18, z * 0.34], accent),
        sphere([Math.min(width, height) * 0.045, 16, 12], [width * 0.24, height * 0.28, z * 0.33], "#22c55e"),
        box([width * 0.18, height * 0.035, length * 0.025], [-width * 0.18, -height * 0.3, z * 0.34], trim),
        box([width * 0.18, height * 0.035, length * 0.025], [width * 0.18, -height * 0.3, z * 0.34], trim),
      ];
    case "screen":
    case "whiteboard":
    case "window":
      return [
        box([width, height, length * 0.24], [0, 0, 0], archetype === "screen" ? dark : archetype === "window" ? "#93c5fd" : "#f8fafc"),
        box([width * 0.9, height * 0.82, length * 0.06], [0, 0, z * 0.16], archetype === "screen" ? accent : archetype === "window" ? "#bfdbfe" : "#ffffff"),
        box([width, height * 0.06, length * 0.34], [0, y - height * 0.03, 0], trim),
        box([width, height * 0.06, length * 0.34], [0, -y + height * 0.03, 0], trim),
        box([width * 0.045, height, length * 0.34], [-x + width * 0.023, 0, 0], trim),
        box([width * 0.045, height, length * 0.34], [x - width * 0.023, 0, 0], trim),
        ...(archetype === "window"
          ? [
              box([width * 0.035, height * 0.92, length * 0.36], [0, 0, z * 0.04], "#f8fafc"),
              box([width * 0.92, height * 0.035, length * 0.36], [0, 0, z * 0.04], "#f8fafc"),
            ]
          : archetype === "whiteboard"
            ? [box([width * 0.32, height * 0.04, length * 0.16], [-x * 0.28, -y * 0.82, z * 0.2], "#ef4444"), box([width * 0.28, height * 0.04, length * 0.16], [x * 0.14, -y * 0.82, z * 0.2], "#1d4ed8")]
            : []),
      ];
    case "light":
      return [
        cyl([width * 0.34, width * 0.34, height * 0.26, 32], [0, y - height * 0.13, 0], light),
        cyl([width * 0.4, width * 0.32, height * 0.46, 32], [0, 0, 0], "#fef08a"),
        sphere([Math.min(width, length) * 0.18, 24, 16], [0, -y + height * 0.25, 0], "#fff7ad"),
        sphere([Math.min(width, length) * 0.045, 16, 12], [width * 0.16, -height * 0.02, length * 0.16], "#facc15"),
      ];
    case "fan":
      return [
        cyl([0.06, 0.06, height * 0.72, 20], [0, y - height * 0.36, 0], trim),
        cyl([0.16, 0.16, 0.08, 28], [0, -height * 0.12, 0], dark),
        box([width * 0.44, 0.045, length * 0.08], [width * 0.27, -height * 0.12, 0], color),
        box([width * 0.44, 0.045, length * 0.08], [-width * 0.27, -height * 0.12, 0], color),
        box([width * 0.08, 0.045, length * 0.44], [0, -height * 0.12, length * 0.27], color),
        box([width * 0.08, 0.045, length * 0.44], [0, -height * 0.12, -length * 0.27], color),
        sphere([0.045, 16, 12], [0, -height * 0.12, 0], accent),
      ];
    case "door":
      return [
        box([width * 0.9, height * 0.96, length * 0.42], [0, 0, 0], color),
        box([width, height, length * 0.18], [0, 0, -z * 0.3], "#431407"),
        box([width * 0.72, height * 0.04, length * 0.45], [0, height * 0.2, z * 0.22], "#92400e"),
        box([width * 0.72, height * 0.04, length * 0.45], [0, -height * 0.2, z * 0.22], "#92400e"),
        box([width * 0.04, height * 0.72, length * 0.45], [-width * 0.25, 0, z * 0.22], "#92400e"),
        box([width * 0.04, height * 0.72, length * 0.45], [width * 0.25, 0, z * 0.22], "#92400e"),
        sphere([0.045, 16, 12], [width * 0.34, 0, z * 0.34], "#facc15"),
      ];
    default:
      return [
        box([width * 0.82, height * 0.72, length * 0.82], [0, -height * 0.04, 0], color),
        box([width * 0.66, height * 0.08, length * 0.66], [0, height * 0.36, 0], "#94a3b8"),
        box([width * 0.14, height * 0.52, length * 0.14], [-x * 0.34, -y + height * 0.26, -z * 0.34], dark),
        box([width * 0.14, height * 0.52, length * 0.14], [x * 0.34, -y + height * 0.26, -z * 0.34], dark),
        box([width * 0.14, height * 0.52, length * 0.14], [-x * 0.34, -y + height * 0.26, z * 0.34], dark),
        box([width * 0.14, height * 0.52, length * 0.14], [x * 0.34, -y + height * 0.26, z * 0.34], dark),
        sphere([Math.min(width, height, length) * 0.08, 16, 12], [x * 0.28, height * 0.22, z * 0.32], accent),
      ];
  }
}

function meshQualityScore(meshes: MeshDefinition[], archetype: AssetArchetype) {
  const shapes = new Set(meshes.map((mesh) => mesh.shape));
  const colors = new Set(meshes.map((mesh) => mesh.color));
  let score = meshes.length;
  score += shapes.size * 2;
  score += colors.size;

  if (["table", "chair", "sofa", "cabinet", "shelf", "bed"].includes(archetype)) {
    score += meshes.filter((mesh) => mesh.shape === "box" && mesh.args[1] <= 0.14).length;
  }
  if (["air-conditioner", "printer", "computer", "screen", "sensor", "whiteboard", "window", "door"].includes(archetype)) {
    score += meshes.filter((mesh) => mesh.position[2] > 0).length;
  }
  if (archetype === "fan") {
    score += meshes.filter((mesh) => mesh.shape === "box" && (mesh.args[0] > mesh.args[2] * 3 || mesh.args[2] > mesh.args[0] * 3)).length;
  }
  return score;
}

function normalizeAsset(raw: unknown, userPrompt: string): GeneratedAsset {
  const source = raw && typeof raw === "object" ? (raw as Partial<GeneratedAsset> & { archetype?: AssetArchetype }) : {};
  const promptArchetype = detectArchetype(userPrompt);
  const modelArchetype = source.archetype && source.archetype in ARCHETYPE_META ? source.archetype : promptArchetype;
  const archetype = modelArchetype === "generic" ? promptArchetype : modelArchetype;
  const dimensions = DEFAULT_DIMENSIONS[archetype];
  const meta = ARCHETYPE_META[archetype];

  const width = round(clamp(source.width, 0.18, 4.5, dimensions.width));
  const length = round(clamp(source.length, 0.08, 4.5, dimensions.length));
  const height = round(clamp(source.height, 0.12, 3, dimensions.height));
  const color = cleanColor(source.color, dimensions.color);
  const label = titleCase(source.label || userPrompt || archetype).slice(0, 48) || titleCase(archetype);
  const category = source.category === "device" || source.category === "furniture" || source.category === "structure" ? source.category : meta.category;
  const mount = source.mount === "floor" || source.mount === "wall" || source.mount === "ceiling" ? source.mount : meta.mount;
  const isDevice = typeof source.isDevice === "boolean" ? source.isDevice : category === "device";

  const assetCore = { width, length, height, color };
  const geminiMeshes = Array.isArray(source.meshes)
    ? source.meshes.map((mesh) => normalizeMesh(mesh, assetCore)).filter((mesh): mesh is MeshDefinition => Boolean(mesh))
    : [];
  const template = templateMeshes(archetype, width, length, height, color).map((mesh) => normalizeMesh(mesh, assetCore)).filter((mesh): mesh is MeshDefinition => Boolean(mesh));
  const geminiScore = meshQualityScore(geminiMeshes, archetype);
  const templateScore = meshQualityScore(template, archetype);
  const useTemplate = geminiMeshes.length < 10 || geminiScore < Math.max(18, templateScore * 0.78);
  const meshes = groundMeshes(useTemplate ? template : geminiMeshes.slice(0, 18), height);

  return {
    id: makeId(source.id || label, archetype),
    label,
    category,
    mount,
    width,
    length,
    height,
    color,
    isDevice,
    defaultPowerWatt: isDevice ? Math.round(clamp(source.defaultPowerWatt, 1, 2500, meta.power ?? 50)) : undefined,
    description:
      typeof source.description === "string" && source.description.trim()
        ? source.description.trim().slice(0, 180)
        : `A recognizable ${label.toLowerCase()} generated from primitive 3D parts.`,
    icon:
      typeof source.icon === "string" && source.icon.trim() && !/[a-zA-Z]/.test(source.icon)
        ? source.icon.trim().slice(0, 4)
        : meta.icon,
    meshes,
  };
}

function parseGeminiText(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Gemini returned non-JSON content");
    return JSON.parse(match[0]);
  }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Failed to generate asset";
}

function getGeminiApiKeys() {
  const numberedKeys = Array.from({ length: 20 }, (_, index) => (
    process.env[`GEMINI_API_KEY_${index + 1}`]?.trim()
  ));
  const legacyKey = process.env.GEMINI_API_KEY?.trim();

  return Array.from(new Set(
    [...numberedKeys, legacyKey].filter((key): key is string => Boolean(key))
  ));
}

function buildGeminiRequestBody(prompt: string) {
  return {
    contents: [
      {
        parts: [
          {
            text: buildPrompt(prompt),
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.28,
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          label: { type: "STRING" },
          category: { type: "STRING", enum: ["device", "furniture", "structure"] },
          mount: { type: "STRING", enum: ["floor", "wall", "ceiling"] },
          width: { type: "NUMBER" },
          length: { type: "NUMBER" },
          height: { type: "NUMBER" },
          color: { type: "STRING" },
          isDevice: { type: "BOOLEAN" },
          defaultPowerWatt: { type: "NUMBER" },
          description: { type: "STRING" },
          icon: { type: "STRING" },
          archetype: {
            type: "STRING",
            enum: [
              "table",
              "chair",
              "sofa",
              "cabinet",
              "shelf",
              "bed",
              "screen",
              "computer",
              "printer",
              "sensor",
              "air-conditioner",
              "light",
              "fan",
              "door",
              "window",
              "whiteboard",
              "generic",
            ],
          },
          meshes: {
            type: "ARRAY",
            minItems: 12,
            maxItems: 18,
            items: {
              type: "OBJECT",
              properties: {
                shape: { type: "STRING", enum: ["box", "cylinder", "sphere"] },
                args: {
                  type: "ARRAY",
                  items: { type: "NUMBER" },
                },
                position: {
                  type: "ARRAY",
                  items: { type: "NUMBER" },
                },
                rotation: {
                  type: "ARRAY",
                  items: { type: "NUMBER" },
                },
                color: { type: "STRING" },
              },
              required: ["shape", "args", "position", "color"],
            },
          },
        },
        required: [
          "id",
          "label",
          "category",
          "mount",
          "width",
          "length",
          "height",
          "color",
          "isDevice",
          "description",
          "icon",
          "archetype",
          "meshes",
        ],
      },
    },
  };
}

async function generateWithGemini(
  apiKey: string,
  prompt: string
): Promise<GeneratedAsset> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildGeminiRequestBody(prompt)),
      signal: AbortSignal.timeout(45_000),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini request failed with HTTP ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text || typeof text !== "string") {
    throw new Error("Gemini returned an empty model response");
  }

  return normalizeAsset(parseGeminiText(text), prompt);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const apiKeys = getGeminiApiKeys();
    if (apiKeys.length === 0) {
      return NextResponse.json(
        {
          error:
            "No Gemini API key is configured. Add at least one key from GEMINI_API_KEY_1 through GEMINI_API_KEY_20 to the server .env file."
        },
        { status: 500 },
      );
    }

    const failures: string[] = [];

    for (const [index, apiKey] of apiKeys.entries()) {
      try {
        const asset = await generateWithGemini(apiKey, prompt);
        return NextResponse.json(asset);
      } catch (error) {
        const reason = errorMessage(error);
        failures.push(`Key ${index + 1}: ${reason}`);
        console.warn(`Gemini model generation attempt ${index + 1} failed: ${reason}`);
      }
    }

    console.error("All Gemini API keys failed:", failures);
    return NextResponse.json(
      {
        error:
          `Unable to generate the 3D model after trying all ${apiKeys.length} configured Gemini API ${apiKeys.length === 1 ? "key" : "keys"}. Check key validity, quota, billing, and network access.`
      },
      { status: 502 },
    );
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
