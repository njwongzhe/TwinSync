"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { ITEM_DEFINITIONS, getItemIconPath } from "../../rooms/domain/items";
import ItemModel from "../../rooms/components/models/ItemModel";
import styles from "../../rooms/rooms.module.css";
import { DeviceStatus, ItemDefinition } from "../../rooms/domain/types";

function loadCustomModels() {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem("twinsync-custom-models");
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Failed to generate asset. Configure at least one server key from GEMINI_API_KEY_1 through GEMINI_API_KEY_20.";
}

// Pedestal helper component to show under/behind/above models
function PreviewHelper({ mountType, height, length }: { mountType: string; height: number; length: number }) {
  const floorY = -height / 2;
  const ceilingY = height / 2;
  const wallZ = -length / 2;

  return (
    <group>
      {/* Floor Grid for floor mount items */}
      {mountType === "floor" && (
        <mesh position={[0, floorY - 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[5, 5]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
      )}

      {/* Ceiling Plane for ceiling mount items */}
      {mountType === "ceiling" && (
        <mesh position={[0, ceilingY + 0.02, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[5, 5]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>
      )}

      {/* Wall Plane for wall mount items */}
      {mountType === "wall" && (
        <mesh position={[0, 0, wallZ - 0.02]} receiveShadow>
          <boxGeometry args={[5, 3, 0.04]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>
      )}

      {/* Grid helper on the floor for coordinate reference */}
      <gridHelper args={[8, 8, "#38bdf8", "#334155"]} position={[0, floorY, 0]} />
    </group>
  );
}

export default function ModelsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "device" | "furniture" | "structure" | "ai-generated">("all");
  const [selectedModelId, setSelectedModelId] = useState("desk-desktop");
  const [autoRotate, setAutoRotate] = useState(true);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>("on");

  // AI Generator States
  const [showAiModal, setShowAiModal] = useState(false);
  const [promptInput, setPromptInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [customModels, setCustomModels] = useState<ItemDefinition[]>(loadCustomModels);
  const [editingModelName, setEditingModelName] = useState(false);
  const [modelNameDraft, setModelNameDraft] = useState("");

  // Combine base definitions with custom generated models
  const allModels = useMemo(() => {
    return [...ITEM_DEFINITIONS, ...customModels];
  }, [customModels]);

  // Filter models based on search query and category tab
  const filteredModels = useMemo(() => {
    return allModels.filter((item) => {
      const matchesSearch =
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" ||
        (selectedCategory === "ai-generated" ? item.id.startsWith("custom-") : item.category === selectedCategory);
      return matchesSearch && matchesCategory;
    });
  }, [allModels, searchQuery, selectedCategory]);

  // Find currently selected model item definition
  const selectedModel = useMemo(() => {
    return allModels.find((item) => item.id === selectedModelId) ?? allModels[0];
  }, [allModels, selectedModelId]);

  const categoryBadgeClass = (category: string) => {
    if (category === "device") return styles.badgeDevice;
    if (category === "furniture") return styles.badgeFurniture;
    return styles.badgeStructure;
  };

  const getMountLabel = (mount: string) => {
    switch (mount) {
      case "floor":
        return "Floor Mounted";
      case "wall":
        return "Wall Mounted";
      case "ceiling":
        return "Ceiling Mounted";
      default:
        return mount;
    }
  };

  async function handleGenerateAsset() {
    if (!promptInput.trim()) {
      setErrorMsg("Please enter a description of the asset.");
      return;
    }

    setGenerating(true);
    setErrorMsg("");

    try {
      const response = await fetch("/api/generate-model", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: promptInput }),
      });

      if (!response.ok) {
        const errorData: { error?: string } = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server Error: ${response.statusText} (${response.status})`);
      }

      const generatedAsset: ItemDefinition = await response.json();
      
      // Ensure ID is unique
      const cleanId = `custom-${generatedAsset.id.replace(/^custom-/, "")}-${Date.now()}`;
      const finalAsset: ItemDefinition = {
        ...generatedAsset,
        id: cleanId,
        defaultPowerWatt: generatedAsset.isDevice ? (generatedAsset.defaultPowerWatt || 50) : undefined
      };

      // Add to custom models list and store in local storage
      const newCustomModels = [...customModels, finalAsset];
      setCustomModels(newCustomModels);
      window.localStorage.setItem("twinsync-custom-models", JSON.stringify(newCustomModels));

      // Close modal and select the generated asset
      setShowAiModal(false);
      setPromptInput("");
      setSelectedModelId(cleanId);
      setEditingModelName(false);
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  }

  function handleDeleteCustomModel(id: string) {
    const nextModels = customModels.filter((model) => model.id !== id);
    setCustomModels(nextModels);
    window.localStorage.setItem("twinsync-custom-models", JSON.stringify(nextModels));
    setEditingModelName(false);
    if (selectedModelId === id) {
      setSelectedModelId("desk-desktop");
    }
  }

  function startModelNameEdit() {
    if (!selectedModel.id.startsWith("custom-")) {
      return;
    }

    setModelNameDraft(selectedModel.label);
    setEditingModelName(true);
  }

  function saveModelName() {
    const nextName = modelNameDraft.trim().replace(/\s+/g, " ").slice(0, 48);

    if (!nextName) {
      setModelNameDraft(selectedModel.label);
      setEditingModelName(false);
      return;
    }

    const nextModels = customModels.map((model) => (
      model.id === selectedModel.id
        ? { ...model, label: nextName }
        : model
    ));

    setCustomModels(nextModels);
    window.localStorage.setItem(
      "twinsync-custom-models",
      JSON.stringify(nextModels)
    );
    setEditingModelName(false);
  }

  function cancelModelNameEdit() {
    setModelNameDraft(selectedModel.label);
    setEditingModelName(false);
  }

  return (
    <main className={styles.pageShell}>
      <section className={styles.heroSection}>
        <div>
          <p className={styles.eyebrow}>TwinSync / ASSETS</p>
          <h1 className={styles.pageTitle}>3D Asset Registry</h1>
          <p className={styles.pageSubtitle}>
            Explore and preview the digital twin library of 3D models available for placement in your rooms.
            Select any asset to inspect dimensions, device telemetry support, and view in real-time 3D.
          </p>
        </div>
      </section>

      <div className={styles.modelsContainer}>
        {/* Left Side: Sidebar Filters and List */}
        <div className={styles.modelsSidebar}>
          <div className={styles.searchBarWrapper}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search 3D models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            className={styles.primaryButton}
            onClick={() => setShowAiModal(true)}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontWeight: "750" }}
          >
            ✨ AI Asset Architect
          </button>

          <div className={styles.filterTabs}>
            <button
              className={`${styles.filterTabButton} ${selectedCategory === "all" ? styles.activeFilterTabButton : ""}`}
              onClick={() => setSelectedCategory("all")}
            >
              All Assets ({allModels.length})
            </button>
            <button
              className={`${styles.filterTabButton} ${selectedCategory === "device" ? styles.activeFilterTabButton : ""}`}
              onClick={() => setSelectedCategory("device")}
            >
              Devices
            </button>
            <button
              className={`${styles.filterTabButton} ${selectedCategory === "furniture" ? styles.activeFilterTabButton : ""}`}
              onClick={() => setSelectedCategory("furniture")}
            >
              Furniture
            </button>
            <button
              className={`${styles.filterTabButton} ${selectedCategory === "structure" ? styles.activeFilterTabButton : ""}`}
              onClick={() => setSelectedCategory("structure")}
            >
              Structure
            </button>
            <button
              className={`${styles.filterTabButton} ${selectedCategory === "ai-generated" ? styles.activeFilterTabButton : ""}`}
              onClick={() => setSelectedCategory("ai-generated")}
              style={{
                borderColor: selectedCategory === "ai-generated" ? "rgba(173, 198, 255, 0.4)" : "rgba(147, 51, 234, 0.3)",
                background: selectedCategory === "ai-generated" ? undefined : "rgba(147, 51, 234, 0.08)",
                color: selectedCategory === "ai-generated" ? undefined : "#c084fc",
              }}
            >
              ✨ AI-Generated ({customModels.length})
            </button>
          </div>

          <div className={styles.modelList}>
            {filteredModels.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No models match your search criteria.</p>
              </div>
            ) : (
              filteredModels.map((item) => (
                <div
                  key={item.id}
                  className={`${styles.modelCardItem} ${selectedModelId === item.id ? styles.selectedModelCardItem : ""}`}
                  onClick={() => {
                    setEditingModelName(false);
                    setSelectedModelId(item.id);
                    // Reset status to "on" if category changes
                    if (item.isDevice) {
                      setDeviceStatus("on");
                    }
                  }}
                >
                  <div className={styles.modelCardIconContainer}>
                    {item.icon ? (
                      <span style={{ fontSize: "1.8rem", lineHeight: 1 }}>{item.icon}</span>
                    ) : (
                      <Image
                        src={getItemIconPath(item.id)}
                        alt={item.label}
                        width={30}
                        height={30}
                        className={styles.modelCardIcon}
                        priority
                      />
                    )}
                  </div>
                  <div className={styles.modelCardMeta}>
                    <div className={styles.modelCardHeader}>
                      <span className={styles.modelCardTitle}>{item.label}</span>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <span className={`${styles.categoryBadge} ${categoryBadgeClass(item.category)}`}>
                          {item.category}
                        </span>
                        {item.id.startsWith("custom-") && (
                          <button
                            title="Delete custom model"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCustomModel(item.id);
                            }}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "var(--muted)",
                              cursor: "pointer",
                              fontSize: "0.85rem",
                              padding: "2px 4px"
                            }}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                    <p className={styles.modelCardDesc} title={item.description}>
                      {item.description.length > 60
                        ? `${item.description.slice(0, 60)}...`
                        : item.description}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: 3D Preview Panel */}
        <div className={styles.previewPanelCard}>
          <div className={styles.previewPanelHeader}>
            <div>
              {editingModelName ? (
                <input
                  className={styles.modelNameEditInput}
                  aria-label="AI-generated model name"
                  value={modelNameDraft}
                  maxLength={48}
                  autoFocus
                  onChange={(event) => setModelNameDraft(event.target.value)}
                  onBlur={saveModelName}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      event.currentTarget.blur();
                    } else if (event.key === "Escape") {
                      event.preventDefault();
                      cancelModelNameEdit();
                    }
                  }}
                />
              ) : selectedModel.id.startsWith("custom-") ? (
                <button
                  type="button"
                  className={styles.editableModelTitle}
                  onClick={startModelNameEdit}
                  title="Click to rename this AI-generated model"
                >
                  <span className={styles.previewTitle}>{selectedModel.label}</span>
                  <span className={styles.modelNameEditHint}>Rename</span>
                </button>
              ) : (
                <h2 className={styles.previewTitle}>{selectedModel.label}</h2>
              )}
              <span className={`${styles.categoryBadge} ${categoryBadgeClass(selectedModel.category)}`} style={{ marginTop: "6px" }}>
                {selectedModel.category}
              </span>
              <p className={styles.previewDesc}>{selectedModel.description}</p>
            </div>
          </div>

          {/* Interactive 3D Canvas Box */}
          <div className={styles.canvasContainer}>
            <Canvas shadows camera={{ position: [0, 1.2, 3.2], fov: 48 }}>
              <color attach="background" args={["#0b0f19"]} />
              <ambientLight intensity={0.5} />
              <hemisphereLight args={["#38bdf8", "#1e293b", 0.6]} />
              <directionalLight
                position={[5, 8, 5]}
                intensity={1.2}
                castShadow
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
              />
              <directionalLight position={[-5, 5, -5]} intensity={0.4} />
              <pointLight position={[0, 3, 0]} intensity={0.8} />

              <group>
                <ItemModel
                  type={selectedModel.id}
                  status={selectedModel.isDevice ? deviceStatus : "on"}
                  isSelected={false}
                  isPreview={false}
                />
              </group>

              <PreviewHelper
                mountType={selectedModel.mount}
                height={selectedModel.height}
                length={selectedModel.length}
              />

              <OrbitControls
                autoRotate={autoRotate}
                autoRotateSpeed={1.8}
                enableZoom={true}
                enablePan={true}
                minDistance={1.2}
                maxDistance={8}
              />
            </Canvas>

            {/* Overlays inside the 3D Viewer */}
            <div className={styles.canvasOverlayControls}>
              <span className={styles.canvasOverlayLabel}>
                Orbit & Scroll to Inspect
              </span>
              <button
                type="button"
                className={styles.canvasControlBtn}
                onClick={() => setAutoRotate(!autoRotate)}
              >
                <span style={{ color: autoRotate ? "#4ade80" : "#64748b", marginRight: "6px" }}>●</span>
                Auto Rotate: {autoRotate ? "On" : "Off"}
              </button>
            </div>
          </div>

          {/* Asset Metadata Grid */}
          <div className={styles.previewGridDetails}>
            <div className={styles.previewDetailItem}>
              <label>Dimensions (W × L × H)</label>
              <span>
                {selectedModel.width}m × {selectedModel.length}m × {selectedModel.height}m
              </span>
            </div>
            <div className={styles.previewDetailItem}>
              <label>Mounting Placement</label>
              <span>{getMountLabel(selectedModel.mount)}</span>
            </div>
            <div className={styles.previewDetailItem}>
              <label>Device Type</label>
              <span>{selectedModel.isDevice ? "Smart Device" : "Passive Asset"}</span>
            </div>
            <div className={styles.previewDetailItem}>
              <label>Default Power Draw</label>
              <span>{selectedModel.isDevice ? `${selectedModel.defaultPowerWatt} W` : "Passive (0 W)"}</span>
            </div>
          </div>

          {/* Interactive controls for Smart Devices */}
          <div className={styles.deviceInteractiveControls}>
            <span className={styles.deviceInteractiveTitle}>
              Simulate Telemetry State {!selectedModel.isDevice && "(Smart Devices Only)"}
            </span>
            <div className={styles.deviceInteractiveGroup}>
              <button
                className={`${styles.statusToggleBtn} ${selectedModel.isDevice && deviceStatus === "on" ? styles.statusToggleBtnActiveOn : ""}`}
                onClick={() => setDeviceStatus("on")}
                disabled={!selectedModel.isDevice}
              >
                On
              </button>
              <button
                className={`${styles.statusToggleBtn} ${selectedModel.isDevice && deviceStatus === "off" ? styles.statusToggleBtnActiveOff : ""}`}
                onClick={() => setDeviceStatus("off")}
                disabled={!selectedModel.isDevice}
              >
                Off
              </button>
              <button
                className={`${styles.statusToggleBtn} ${selectedModel.isDevice && deviceStatus === "fault" ? styles.statusToggleBtnActiveFault : ""}`}
                onClick={() => setDeviceStatus("fault")}
                disabled={!selectedModel.isDevice}
              >
                Fault
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Generator Modal */}
      {showAiModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard} style={{ maxWidth: "520px" }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.previewTitle}>AI Asset Architect</h2>
              <button
                className={styles.iconButton}
                onClick={() => setShowAiModal(false)}
                aria-label="Close modal"
                style={{
                  background: "transparent",
                  color: "var(--text)",
                  border: "none",
                  fontSize: "1.8rem",
                  cursor: "pointer"
                }}
              >
                ×
              </button>
            </div>
            
            <p className={styles.previewDesc} style={{ marginBottom: "16px" }}>
              Provide a text prompt to design a custom 3D asset. Gemini will generate its layout category, mounting parameters, size boundaries, colors, and descriptions.
            </p>

            {/* API key is configured on the server via .env */}

            <div className={styles.fieldLabel} style={{ marginTop: "16px" }}>
              <span>Asset Prompt Description</span>
              <textarea
                className={styles.searchInput}
                rows={3}
                placeholder="e.g. A modern round wooden dining table, A futuristic wall-mounted climate sensor"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                style={{ resize: "vertical", width: "100%", fontFamily: "inherit" }}
              />
            </div>

            {errorMsg && (
              <div className={styles.alertBox} style={{ marginTop: "14px", padding: "10px 14px", fontSize: "0.85rem" }}>
                {errorMsg}
              </div>
            )}

            <div className={styles.modalActions} style={{ marginTop: "24px" }}>
              <button className={styles.secondaryButtonSmall} onClick={() => setShowAiModal(false)} disabled={generating}>
                Cancel
              </button>
              <button className={styles.primaryButtonSmall} onClick={handleGenerateAsset} disabled={generating}>
                {generating ? "Generating..." : "✨ Design Asset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
