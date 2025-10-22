"use client"

import { useState, useEffect, useRef } from "react"
import {
  Download,
  Palette,
  Box,
  Sparkles,
  Layers,
  RotateCw,
  Save,
  Trash2,
  Sun,
  Wand2,
  Send,
  Settings,
} from "lucide-react"
import * as THREE from "three"

class AIAssetParser {
  static parse(prompt) {
    const lowerPrompt = prompt.toLowerCase()
    return {
      shape: this.detectShape(lowerPrompt),
      color: this.detectColor(lowerPrompt),
      material: this.detectMaterial(lowerPrompt),
      metalness: this.detectMetalness(lowerPrompt),
      roughness: this.detectRoughness(lowerPrompt),
      opacity: this.detectOpacity(lowerPrompt),
      wireframe: this.detectWireframe(lowerPrompt),
      smooth: !lowerPrompt.includes("flat"),
      glow: lowerPrompt.includes("glow"),
      reflection: 1,
      clearcoat: 0.5,
      subdivisions: 2,
    }
  }

  static detectShape(prompt) {
    // Sphere synonyms
    if (prompt.match(/\b(sphere|ball|orb|globe)\b/)) return "sphere"

    // Cube synonyms
    if (prompt.match(/\b(cube|box|block|square)\b/)) return "cube"

    // Cylinder synonyms
    if (prompt.match(/\b(cylinder|tube|pipe|column)\b/)) return "cylinder"

    // Torus synonyms (including donut!)
    if (prompt.match(/\b(torus|donut|doughnut|ring)\b/) && !prompt.includes("knot")) return "torus"

    // Cone synonyms
    if (prompt.match(/\b(cone|pyramid|spike)\b/)) return "cone"

    // Torus knot synonyms
    if (prompt.match(/\b(knot|twisted|pretzel)\b/)) return "torusKnot"

    // Default to sphere
    return "sphere"
  }

  static detectColor(prompt) {
    const colors = {
      red: "#ff0000",
      blue: "#0000ff",
      green: "#00ff00",
      yellow: "#ffff00",
      orange: "#ff8800",
      purple: "#8800ff",
      pink: "#ff69b4",
      cyan: "#00ffff",
      gold: "#ffd700",
      silver: "#c0c0c0",
      white: "#ffffff",
      black: "#000000",
      gray: "#808080",
      grey: "#808080",
      brown: "#8b4513",
      magenta: "#ff00ff",
      lime: "#00ff00",
      navy: "#000080",
      teal: "#008080",
      violet: "#ee82ee",
      indigo: "#4b0082",
    }

    // Check for each color name in the prompt
    for (const [name, hex] of Object.entries(colors)) {
      if (prompt.includes(name)) return hex
    }

    // Default to blue
    return "#4a9eff"
  }

  static detectMaterial(p) {
    if (p.match(/\b(physical|realistic)\b/)) return "physical"
    if (p.match(/\b(phong|basic)\b/)) return "phong"
    return "standard"
  }

  static detectMetalness(p) {
    if (p.match(/\b(metal|metallic|chrome|steel|iron|aluminum)\b/)) return 0.9
    if (p.match(/\b(plastic|rubber)\b/)) return 0.1
    return 0.5
  }

  static detectRoughness(p) {
    if (p.match(/\b(glossy|shiny|polished|smooth|reflective)\b/)) return 0.1
    if (p.match(/\b(rough|matte|dull|flat)\b/)) return 0.8
    return 0.2
  }

  static detectOpacity(p) {
    if (p.match(/\b(transparent|translucent|see-through|glass)\b/)) return 0.5
    if (p.match(/\b(clear)\b/)) return 0.3
    return 1.0
  }

  static detectWireframe(p) {
    return p.match(/\b(wireframe|wire|outline|skeleton)\b/) !== null
  }
}

class AssetBuilderEngine {
  constructor(container) {
    this.container = container
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000)
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
    this.currentMesh = null
    this.lights = []
    this.autoRotate = true
    this.animationFrame = null
    this.init()
  }

  init() {
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.renderer.setClearColor(0x000000, 0)
    this.container.appendChild(this.renderer.domElement)
    this.camera.position.set(0, 0, 5)
    this.camera.lookAt(0, 0, 0)
    this.setupLighting()
    this.setupControls()
    const grid = new THREE.GridHelper(10, 10, 0x444444, 0x222222)
    grid.position.y = -2
    this.scene.add(grid)
    this.animate()
  }

  setupLighting() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.5)
    this.scene.add(ambient)
    this.lights.push({ type: "ambient", light: ambient })
    const main = new THREE.DirectionalLight(0xffffff, 0.8)
    main.position.set(5, 5, 5)
    this.scene.add(main)
    this.lights.push({ type: "directional", light: main })
  }

  setupControls() {
    let isDragging = false
    let prevPos = { x: 0, y: 0 }

    this.renderer.domElement.addEventListener("mousedown", (e) => {
      isDragging = true
      this.autoRotate = false
      prevPos = { x: e.clientX, y: e.clientY }
    })

    this.renderer.domElement.addEventListener("mousemove", (e) => {
      if (isDragging && this.currentMesh) {
        const dx = e.clientX - prevPos.x
        const dy = e.clientY - prevPos.y
        this.currentMesh.rotation.y += dx * 0.01
        this.currentMesh.rotation.x += dy * 0.01
        prevPos = { x: e.clientX, y: e.clientY }
      }
    })

    this.renderer.domElement.addEventListener("mouseup", () => {
      isDragging = false
    })
  }

  createAsset(cfg) {
    if (this.currentMesh) {
      this.scene.remove(this.currentMesh)
      if (this.currentMesh.geometry) this.currentMesh.geometry.dispose()
      if (this.currentMesh.material) this.currentMesh.material.dispose()
    }

    let geo
    switch (cfg.shape) {
      case "sphere":
        geo = new THREE.SphereGeometry(1, 64, 64)
        break
      case "cube":
        geo = new THREE.BoxGeometry(1.5, 1.5, 1.5)
        break
      case "cylinder":
        geo = new THREE.CylinderGeometry(0.8, 0.8, 2, 64)
        break
      case "torus":
        geo = new THREE.TorusGeometry(1, 0.4, 32, 100)
        break
      case "cone":
        geo = new THREE.ConeGeometry(1, 2, 64)
        break
      case "torusKnot":
        geo = new THREE.TorusKnotGeometry(0.8, 0.3, 100, 16)
        break
      default:
        geo = new THREE.BoxGeometry(1.5, 1.5, 1.5)
    }

    const matCfg = {
      color: new THREE.Color(cfg.color),
      metalness: cfg.metalness,
      roughness: cfg.roughness,
      wireframe: cfg.wireframe,
      transparent: cfg.opacity < 1,
      opacity: cfg.opacity,
    }

    let mat
    if (cfg.material === "physical") {
      mat = new THREE.MeshPhysicalMaterial({ ...matCfg, clearcoat: cfg.clearcoat })
    } else if (cfg.material === "phong") {
      mat = new THREE.MeshPhongMaterial({ color: matCfg.color, wireframe: matCfg.wireframe })
    } else {
      mat = new THREE.MeshStandardMaterial(matCfg)
    }

    this.currentMesh = new THREE.Mesh(geo, mat)
    this.scene.add(this.currentMesh)

    if (cfg.glow) {
      const glowGeo = geo.clone()
      const glowMat = new THREE.MeshBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide,
      })
      const glow = new THREE.Mesh(glowGeo, glowMat)
      glow.scale.multiplyScalar(1.1)
      this.currentMesh.add(glow)
    }
  }

  animate() {
    this.animationFrame = requestAnimationFrame(() => this.animate())
    if (this.currentMesh && this.autoRotate) {
      this.currentMesh.rotation.y += 0.005
    }
    this.renderer.render(this.scene, this.camera)
  }

  updateLighting(cfg) {
    this.lights.forEach(({ light, type }) => {
      if (type === "ambient") light.intensity = cfg.ambient
      if (type === "directional") light.intensity = cfg.directional
    })
  }

  exportAsSVG(size) {
    // Create a simple SVG representation of the 3D object
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    svg.setAttribute("width", size.toString())
    svg.setAttribute("height", size.toString())
    svg.setAttribute("viewBox", `0 0 ${size} ${size}`)

    if (this.currentMesh) {
      const color = this.currentMesh.material.color.getStyle()
      const cx = size / 2
      const cy = size / 2
      const r = size / 3

      // Create a simple circle representation
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle")
      circle.setAttribute("cx", cx.toString())
      circle.setAttribute("cy", cy.toString())
      circle.setAttribute("r", r.toString())
      circle.setAttribute("fill", color)
      circle.setAttribute("opacity", this.currentMesh.material.opacity.toString())

      svg.appendChild(circle)
    }

    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(svg)
    const blob = new Blob([svgString], { type: "image/svg+xml" })
    return URL.createObjectURL(blob)
  }

  exportAsset(fmt, size) {
    if (fmt === "svg") {
      return this.exportAsSVG(size)
    }

    const orig = { w: this.renderer.domElement.width, h: this.renderer.domElement.height }
    this.renderer.setSize(size, size)
    this.renderer.render(this.scene, this.camera)
    const url = this.renderer.domElement.toDataURL(`image/${fmt}`)
    this.renderer.setSize(orig.w, orig.h)
    return url
  }

  setAutoRotate(v) {
    this.autoRotate = v
  }

  dispose() {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame)
    if (this.currentMesh) this.scene.remove(this.currentMesh)
    this.renderer.dispose()
  }

  handleResize() {
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
  }
}

export default function AssetBuilder() {
  const [config, setConfig] = useState({
    shape: "sphere",
    color: "#4a9eff",
    material: "physical",
    metalness: 0.5,
    roughness: 0.2,
    opacity: 1,
    wireframe: false,
    glow: false,
    clearcoat: 0.5,
  })
  const [lighting, setLighting] = useState({ ambient: 0.5, directional: 0.8 })
  const [exportSettings, setExportSettings] = useState({ format: "png", size: 1024 })
  const [presets, setPresets] = useState([])
  const [showPresets, setShowPresets] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [aiPrompt, setAiPrompt] = useState("")
  const [showAI, setShowAI] = useState(true)
  const [history, setHistory] = useState([])
  const containerRef = useRef(null)
  const engineRef = useRef(null)

  useEffect(() => {
    if (containerRef.current && !engineRef.current) {
      engineRef.current = new AssetBuilderEngine(containerRef.current)
      engineRef.current.createAsset(config)
      const resize = () => {
        if (engineRef.current) engineRef.current.handleResize()
      }
      window.addEventListener("resize", resize)
      return () => {
        window.removeEventListener("resize", resize)
        if (engineRef.current) {
          engineRef.current.dispose()
          engineRef.current = null
        }
      }
    }
  }, [])

  useEffect(() => {
    if (engineRef.current) engineRef.current.createAsset(config)
  }, [config])
  useEffect(() => {
    if (engineRef.current) engineRef.current.updateLighting(lighting)
  }, [lighting])

  const handleAIGenerate = () => {
    if (!aiPrompt.trim()) return

    const gen = AIAssetParser.parse(aiPrompt)
    setConfig(gen)
    setHistory((prev) => [
      { id: Date.now(), prompt: aiPrompt, config: gen, time: new Date().toLocaleTimeString() },
      ...prev.slice(0, 9),
    ])
    setAiPrompt("")
  }

  const handleExport = () => {
    if (engineRef.current) {
      const url = engineRef.current.exportAsset(exportSettings.format, exportSettings.size)
      const a = document.createElement("a")
      a.download = `asset-${Date.now()}.${exportSettings.format}`
      a.href = url
      a.click()
    }
  }

  const savePreset = () => {
    const p = {
      id: Date.now(),
      name: `Preset ${presets.length + 1}`,
      config: { ...config },
      thumb: engineRef.current?.exportAsset("png", 128),
    }
    setPresets((prev) => [...prev, p])
  }

  const examples = [
    "shiny gold donut with glow",
    "transparent glass sphere",
    "rough red cube with matte finish",
    "glossy purple pyramid",
  ]

  const shapes = [
    { v: "sphere", l: "Sphere" },
    { v: "cube", l: "Cube" },
    { v: "cylinder", l: "Cylinder" },
    { v: "torus", l: "Torus" },
    { v: "cone", l: "Cone" },
    { v: "torusKnot", l: "Knot" },
  ]

  const materials = [
    { v: "standard", l: "Standard" },
    { v: "physical", l: "Physical" },
    { v: "phong", l: "Phong" },
  ]

  const renderShapeIcon = (shape) => {
    const iconStyle = {
      width: "48px",
      height: "48px",
      margin: "0 auto 8px",
    }

    switch (shape) {
      case "sphere":
        return (
          <svg style={iconStyle} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="40" fill="currentColor" opacity="0.8" />
            <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        )
      case "cube":
        return (
          <svg style={iconStyle} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M50 10 L90 30 L90 70 L50 90 L10 70 L10 30 Z"
              fill="currentColor"
              opacity="0.8"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path d="M50 10 L50 50 M50 50 L90 70 M50 50 L10 70" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
          </svg>
        )
      case "cylinder":
        return (
          <svg style={iconStyle} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse
              cx="50"
              cy="25"
              rx="30"
              ry="10"
              fill="currentColor"
              opacity="0.8"
              stroke="currentColor"
              strokeWidth="2"
            />
            <rect x="20" y="25" width="60" height="50" fill="currentColor" opacity="0.6" />
            <ellipse
              cx="50"
              cy="75"
              rx="30"
              ry="10"
              fill="currentColor"
              opacity="0.8"
              stroke="currentColor"
              strokeWidth="2"
            />
            <line x1="20" y1="25" x2="20" y2="75" stroke="currentColor" strokeWidth="2" />
            <line x1="80" y1="25" x2="80" y2="75" stroke="currentColor" strokeWidth="2" />
          </svg>
        )
      case "torus":
        return (
          <svg style={iconStyle} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="16" fill="none" opacity="0.8" />
            <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        )
      case "cone":
        return (
          <svg style={iconStyle} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 10 L85 80 L15 80 Z" fill="currentColor" opacity="0.8" stroke="currentColor" strokeWidth="2" />
            <ellipse
              cx="50"
              cy="80"
              rx="35"
              ry="8"
              fill="currentColor"
              opacity="0.6"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        )
      case "torusKnot":
        return (
          <svg style={iconStyle} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M50 20 Q70 25 75 40 Q78 50 70 60 Q60 68 50 65 Q40 62 35 50 Q32 40 40 30 Q45 22 50 20"
              stroke="currentColor"
              strokeWidth="10"
              fill="none"
              opacity="0.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M50 35 Q30 40 25 55 Q22 65 30 75 Q40 83 50 80 Q60 77 65 65 Q68 55 60 45 Q55 37 50 35"
              stroke="currentColor"
              strokeWidth="10"
              fill="none"
              opacity="0.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <ellipse cx="50" cy="50" rx="8" ry="8" fill="currentColor" opacity="0.9" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div
      style={{
        height: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        color: "white",
        display: "flex",
        flexDirection: "column",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(15, 23, 42, 0.8)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(59, 130, 246, 0.2)",
          padding: "1rem 1.5rem",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Box style={{ width: "2rem", height: "2rem", color: "#60a5fa" }} />
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: "700",
                background: "linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                letterSpacing: "-0.025em",
              }}
            >
              AI 3D Asset Builder
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              onClick={() => setShowAI(!showAI)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.625rem 1.25rem",
                borderRadius: "0.5rem",
                backgroundColor: showAI ? "#8b5cf6" : "rgba(51, 65, 85, 0.8)",
                border: showAI ? "1px solid #a78bfa" : "1px solid rgba(71, 85, 105, 0.5)",
                color: "white",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: "500",
                transition: "all 0.2s ease",
                boxShadow: showAI ? "0 0 20px rgba(139, 92, 246, 0.3)" : "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)"
                e.currentTarget.style.boxShadow = showAI
                  ? "0 0 25px rgba(139, 92, 246, 0.4)"
                  : "0 2px 8px rgba(0, 0, 0, 0.2)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = showAI ? "0 0 20px rgba(139, 92, 246, 0.3)" : "none"
              }}
            >
              <Wand2 style={{ width: "1rem", height: "1rem" }} />
              AI Panel
            </button>
            <button
              onClick={() => setShowControls(!showControls)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.625rem 1.25rem",
                borderRadius: "0.5rem",
                backgroundColor: showControls ? "#3b82f6" : "rgba(51, 65, 85, 0.8)",
                border: showControls ? "1px solid #60a5fa" : "1px solid rgba(71, 85, 105, 0.5)",
                color: "white",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: "500",
                transition: "all 0.2s ease",
                boxShadow: showControls ? "0 0 20px rgba(59, 130, 246, 0.3)" : "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)"
                e.currentTarget.style.boxShadow = showControls
                  ? "0 0 25px rgba(59, 130, 246, 0.4)"
                  : "0 2px 8px rgba(0, 0, 0, 0.2)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = showControls ? "0 0 20px rgba(59, 130, 246, 0.3)" : "none"
              }}
            >
              <Settings style={{ width: "1rem", height: "1rem" }} />
              Controls
            </button>
            <button
              onClick={() => setShowPresets(!showPresets)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.625rem 1.25rem",
                backgroundColor: showPresets ? "#8b5cf6" : "rgba(51, 65, 85, 0.8)",
                borderRadius: "0.5rem",
                border: showPresets ? "1px solid #a78bfa" : "1px solid rgba(71, 85, 105, 0.5)",
                color: "white",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: "500",
                transition: "all 0.2s ease",
                boxShadow: showPresets ? "0 0 20px rgba(139, 92, 246, 0.3)" : "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)"
                e.currentTarget.style.boxShadow = showPresets
                  ? "0 0 25px rgba(139, 92, 246, 0.4)"
                  : "0 2px 8px rgba(0, 0, 0, 0.2)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = showPresets ? "0 0 20px rgba(139, 92, 246, 0.3)" : "none"
              }}
            >
              <Layers style={{ width: "1rem", height: "1rem" }} />
              Presets
            </button>
            <button
              onClick={() => engineRef.current?.setAutoRotate(!engineRef.current.autoRotate)}
              style={{
                padding: "0.625rem",
                backgroundColor: "rgba(51, 65, 85, 0.8)",
                borderRadius: "0.5rem",
                border: "1px solid rgba(71, 85, 105, 0.5)",
                color: "white",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px) rotate(90deg)"
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.2)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) rotate(0deg)"
                e.currentTarget.style.boxShadow = "none"
              }}
            >
              <RotateCw style={{ width: "1rem", height: "1rem" }} />
            </button>
            <button
              onClick={handleExport}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.625rem 1.5rem",
                background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                borderRadius: "0.5rem",
                fontWeight: "600",
                border: "1px solid rgba(96, 165, 250, 0.3)",
                color: "white",
                cursor: "pointer",
                fontSize: "0.875rem",
                transition: "all 0.2s ease",
                boxShadow: "0 0 20px rgba(59, 130, 246, 0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)"
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(59, 130, 246, 0.5)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = "0 0 20px rgba(59, 130, 246, 0.3)"
              }}
            >
              <Download style={{ width: "1rem", height: "1rem" }} />
              Export
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {showAI && (
          <div
            style={{
              width: "24rem",
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              backdropFilter: "blur(12px)",
              borderRight: "1px solid rgba(139, 92, 246, 0.2)",
              overflowY: "auto",
              padding: "1.5rem",
            }}
          >
            <div style={{ marginBottom: "1.5rem" }}>
              <h3
                style={{
                  fontSize: "1.125rem",
                  fontWeight: "600",
                  marginBottom: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  color: "#e2e8f0",
                }}
              >
                <Wand2 style={{ width: "1.25rem", height: "1.25rem", color: "#c084fc" }} />
                AI Generator
              </h3>
              <p style={{ fontSize: "0.875rem", color: "#9ca3af", marginBottom: "1rem" }}>Describe what you want!</p>
              <div style={{ position: "relative" }}>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleAIGenerate()
                    }
                  }}
                  placeholder="E.g., 'shiny gold donut with glow'"
                  style={{
                    width: "100%",
                    backgroundColor: "rgba(17, 24, 39, 0.5)",
                    border: "1px solid rgba(168, 85, 247, 0.3)",
                    borderRadius: "0.5rem",
                    padding: "1rem",
                    paddingRight: "3rem",
                    fontSize: "0.875rem",
                    resize: "none",
                    outline: "none",
                    minHeight: "6rem",
                    color: "white",
                  }}
                />
                <button
                  onClick={handleAIGenerate}
                  disabled={!aiPrompt.trim()}
                  style={{
                    position: "absolute",
                    bottom: "0.75rem",
                    right: "0.75rem",
                    padding: "0.5rem",
                    background: "linear-gradient(to right, #9333ea, #ec4899)",
                    borderRadius: "0.5rem",
                    opacity: !aiPrompt.trim() ? 0.5 : 1,
                    border: "none",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  <Send style={{ width: "1rem", height: "1rem" }} />
                </button>
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <h4 style={{ fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.75rem", color: "#e2e8f0" }}>
                Examples
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {examples.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setAiPrompt(p)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      fontSize: "0.75rem",
                      backgroundColor: "rgba(17, 24, 39, 0.3)",
                      border: "1px solid #374151",
                      borderRadius: "0.25rem",
                      padding: "0.75rem",
                      color: "white",
                      cursor: "pointer",
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {history.length > 0 && (
              <div>
                <h4 style={{ fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.75rem", color: "#e2e8f0" }}>
                  History
                </h4>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                    maxHeight: "16rem",
                    overflowY: "auto",
                  }}
                >
                  {history.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => {
                        setConfig(h.config)
                        setAiPrompt(h.prompt)
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        backgroundColor: "rgba(17, 24, 39, 0.3)",
                        border: "1px solid #374151",
                        borderRadius: "0.25rem",
                        padding: "0.75rem",
                        color: "white",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.25rem" }}>{h.time}</div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {h.prompt}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {showControls && (
          <div
            style={{
              width: "22rem",
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              backdropFilter: "blur(12px)",
              borderRight: "1px solid rgba(59, 130, 246, 0.2)",
              overflowY: "auto",
              padding: "1.5rem",
            }}
          >
            <div style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "0.875rem", fontWeight: "600", marginBottom: "1rem", color: "#e2e8f0" }}>Shape</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
                {shapes.map((s) => (
                  <button
                    key={s.v}
                    onClick={() => setConfig((p) => ({ ...p, shape: s.v }))}
                    style={{
                      padding: "1rem 0.5rem",
                      borderRadius: "0.75rem",
                      border: config.shape === s.v ? "2px solid #3b82f6" : "1px solid rgba(71, 85, 105, 0.5)",
                      fontSize: "0.75rem",
                      fontWeight: "500",
                      backgroundColor: config.shape === s.v ? "rgba(59, 130, 246, 0.2)" : "rgba(30, 41, 59, 0.5)",
                      color: config.shape === s.v ? "#60a5fa" : "#cbd5e1",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      boxShadow: config.shape === s.v ? "0 0 20px rgba(59, 130, 246, 0.3)" : "none",
                    }}
                    onMouseEnter={(e) => {
                      if (config.shape !== s.v) {
                        e.currentTarget.style.backgroundColor = "rgba(30, 41, 59, 0.8)"
                        e.currentTarget.style.borderColor = "rgba(100, 116, 139, 0.5)"
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (config.shape !== s.v) {
                        e.currentTarget.style.backgroundColor = "rgba(30, 41, 59, 0.5)"
                        e.currentTarget.style.borderColor = "rgba(71, 85, 105, 0.5)"
                      }
                    }}
                  >
                    {renderShapeIcon(s.v)}
                    <div style={{ marginTop: "0.25rem" }}>{s.l}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "0.875rem", fontWeight: "600", marginBottom: "1rem", color: "#e2e8f0" }}>
                Material
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
                {materials.map((m) => (
                  <button
                    key={m.v}
                    onClick={() => setConfig((p) => ({ ...p, material: m.v }))}
                    style={{
                      padding: "0.75rem 0.5rem",
                      borderRadius: "0.5rem",
                      fontSize: "0.75rem",
                      fontWeight: "500",
                      backgroundColor: config.material === m.v ? "rgba(139, 92, 246, 0.2)" : "rgba(30, 41, 59, 0.5)",
                      border: config.material === m.v ? "2px solid #8b5cf6" : "1px solid rgba(71, 85, 105, 0.5)",
                      color: config.material === m.v ? "#a78bfa" : "#cbd5e1",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      boxShadow: config.material === m.v ? "0 0 20px rgba(139, 92, 246, 0.3)" : "none",
                    }}
                    onMouseEnter={(e) => {
                      if (config.material !== m.v) {
                        e.currentTarget.style.backgroundColor = "rgba(30, 41, 59, 0.8)"
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (config.material !== m.v) {
                        e.currentTarget.style.backgroundColor = "rgba(30, 41, 59, 0.5)"
                      }
                    }}
                  >
                    {m.l}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <h3
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  color: "#e2e8f0",
                }}
              >
                <Palette style={{ width: "1rem", height: "1rem" }} />
                Color
              </h3>
              <input
                type="color"
                value={config.color}
                onChange={(e) => setConfig((p) => ({ ...p, color: e.target.value }))}
                style={{
                  width: "100%",
                  height: "3rem",
                  borderRadius: "0.5rem",
                  border: "2px solid rgba(71, 85, 105, 0.5)",
                  cursor: "pointer",
                  backgroundColor: "transparent",
                }}
              />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: "0.875rem", marginBottom: "0.5rem", display: "block", color: "#cbd5e1" }}>
                  Metalness: {config.metalness.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={config.metalness}
                  onChange={(e) => setConfig((p) => ({ ...p, metalness: Number.parseFloat(e.target.value) }))}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: "0.875rem", marginBottom: "0.5rem", display: "block", color: "#cbd5e1" }}>
                  Roughness: {config.roughness.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={config.roughness}
                  onChange={(e) => setConfig((p) => ({ ...p, roughness: Number.parseFloat(e.target.value) }))}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: "0.875rem", marginBottom: "0.5rem", display: "block", color: "#cbd5e1" }}>
                  Opacity: {config.opacity.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={config.opacity}
                  onChange={(e) => setConfig((p) => ({ ...p, opacity: Number.parseFloat(e.target.value) }))}
                  style={{ width: "100%" }}
                />
              </div>
              {config.material === "physical" && (
                <div>
                  <label style={{ fontSize: "0.875rem", marginBottom: "0.5rem", display: "block", color: "#cbd5e1" }}>
                    Clearcoat: {config.clearcoat.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={config.clearcoat}
                    onChange={(e) => setConfig((p) => ({ ...p, clearcoat: Number.parseFloat(e.target.value) }))}
                    style={{ width: "100%" }}
                  />
                </div>
              )}
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <h3
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  color: "#e2e8f0",
                }}
              >
                <Sun style={{ width: "1rem", height: "1rem" }} />
                Lighting
              </h3>
              <div>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ fontSize: "0.875rem", marginBottom: "0.5rem", display: "block", color: "#cbd5e1" }}>
                    Ambient: {lighting.ambient.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={lighting.ambient}
                    onChange={(e) => setLighting((p) => ({ ...p, ambient: Number.parseFloat(e.target.value) }))}
                    style={{ width: "100%" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.875rem", marginBottom: "0.5rem", display: "block", color: "#cbd5e1" }}>
                    Directional: {lighting.directional.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={lighting.directional}
                    onChange={(e) => setLighting((p) => ({ ...p, directional: Number.parseFloat(e.target.value) }))}
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <h3
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  color: "#e2e8f0",
                }}
              >
                <Sparkles style={{ width: "1rem", height: "1rem" }} />
                Effects
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input
                    type="checkbox"
                    checked={config.wireframe}
                    onChange={(e) => setConfig((p) => ({ ...p, wireframe: e.target.checked }))}
                    style={{ width: "1rem", height: "1rem", cursor: "pointer" }}
                  />
                  <span style={{ fontSize: "0.875rem", color: "#cbd5e1" }}>Wireframe</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input
                    type="checkbox"
                    checked={config.glow}
                    onChange={(e) => setConfig((p) => ({ ...p, glow: e.target.checked }))}
                    style={{ width: "1rem", height: "1rem", cursor: "pointer" }}
                  />
                  <span style={{ fontSize: "0.875rem", color: "#cbd5e1" }}>Glow</span>
                </label>
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "0.875rem", fontWeight: "600", marginBottom: "1rem", color: "#e2e8f0" }}>
                Export Settings
              </h3>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: "0.875rem", marginBottom: "0.5rem", display: "block", color: "#cbd5e1" }}>
                  Format
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
                  {["png", "jpeg", "svg"].map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setExportSettings((p) => ({ ...p, format: fmt }))}
                      style={{
                        padding: "0.625rem",
                        borderRadius: "0.5rem",
                        fontSize: "0.75rem",
                        fontWeight: "500",
                        textTransform: "uppercase",
                        backgroundColor:
                          exportSettings.format === fmt ? "rgba(59, 130, 246, 0.2)" : "rgba(30, 41, 59, 0.5)",
                        border:
                          exportSettings.format === fmt ? "2px solid #3b82f6" : "1px solid rgba(71, 85, 105, 0.5)",
                        color: exportSettings.format === fmt ? "#60a5fa" : "#cbd5e1",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (exportSettings.format !== fmt) {
                          e.currentTarget.style.backgroundColor = "rgba(30, 41, 59, 0.8)"
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (exportSettings.format !== fmt) {
                          e.currentTarget.style.backgroundColor = "rgba(30, 41, 59, 0.5)"
                        }
                      }}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: "0.875rem", marginBottom: "0.5rem", display: "block", color: "#cbd5e1" }}>
                  Size: {exportSettings.size}px
                </label>
                <input
                  type="range"
                  min="256"
                  max="2048"
                  step="256"
                  value={exportSettings.size}
                  onChange={(e) => setExportSettings((p) => ({ ...p, size: Number.parseInt(e.target.value) }))}
                  style={{
                    width: "100%",
                    height: "6px",
                    borderRadius: "3px",
                    background: "linear-gradient(to right, #3b82f6, #8b5cf6)",
                    outline: "none",
                    cursor: "pointer",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.75rem",
                    color: "#64748b",
                    marginTop: "0.25rem",
                  }}
                >
                  <span>256px</span>
                  <span>2048px</span>
                </div>
              </div>
            </div>

            <button
              onClick={savePreset}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.875rem 1rem",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                borderRadius: "0.5rem",
                fontWeight: "600",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                color: "white",
                cursor: "pointer",
                fontSize: "0.875rem",
                transition: "all 0.2s ease",
                boxShadow: "0 0 20px rgba(16, 185, 129, 0.2)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)"
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(16, 185, 129, 0.4)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = "0 0 20px rgba(16, 185, 129, 0.2)"
              }}
            >
              <Save style={{ width: "1rem", height: "1rem" }} />
              Save Preset
            </button>
          </div>
        )}

        <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div
            ref={containerRef}
            style={{
              width: "100%",
              height: "100%",
              background: "radial-gradient(circle at center, rgba(59, 130, 246, 0.1) 0%, transparent 70%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "2rem",
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "rgba(15, 23, 42, 0.9)",
              backdropFilter: "blur(16px)",
              borderRadius: "1rem",
              padding: "1.25rem 1.75rem",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
              minWidth: "320px",
            }}
          >
            <div style={{ fontSize: "0.875rem", lineHeight: "1.6" }}>
              <div style={{ marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <Wand2 style={{ width: "1.125rem", height: "1.125rem", color: "#a78bfa" }} />
                <span style={{ color: "#e2e8f0", fontWeight: "500" }}>Use AI panel to generate assets</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <RotateCw style={{ width: "1.125rem", height: "1.125rem", color: "#60a5fa" }} />
                <span style={{ color: "#e2e8f0", fontWeight: "500" }}>Drag to rotate the 3D model</span>
              </div>
            </div>
          </div>
        </div>

        {showPresets && (
          <div
            style={{
              width: "20rem",
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              backdropFilter: "blur(4px)",
              borderLeft: "1px solid rgba(59, 130, 246, 0.3)",
              overflowY: "auto",
              padding: "1.5rem",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}
            >
              <h3 style={{ fontSize: "1.125rem", fontWeight: "600" }}>Presets</h3>
              <button
                onClick={() => setShowPresets(false)}
                style={{ color: "#9ca3af", background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
            {presets.length === 0 ? (
              <div style={{ textAlign: "center", color: "#9ca3af", padding: "3rem 0" }}>
                <Layers style={{ width: "3rem", height: "3rem", margin: "0 auto 0.75rem", opacity: 0.5 }} />
                <p>No presets saved</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {presets.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      backgroundColor: "rgba(31, 41, 55, 0.5)",
                      borderRadius: "0.5rem",
                      padding: "0.75rem",
                      border: "1px solid #374151",
                    }}
                  >
                    {p.thumb && (
                      <img
                        src={p.thumb || "/placeholder.svg"}
                        alt={p.name}
                        style={{
                          width: "100%",
                          height: "8rem",
                          objectFit: "cover",
                          borderRadius: "0.25rem",
                          marginBottom: "0.5rem",
                        }}
                      />
                    )}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.875rem", fontWeight: "500" }}>{p.name}</span>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          onClick={() => setConfig(p.config)}
                          style={{
                            fontSize: "0.75rem",
                            padding: "0.25rem 0.75rem",
                            backgroundColor: "#2563eb",
                            borderRadius: "0.25rem",
                            border: "none",
                            color: "white",
                            cursor: "pointer",
                          }}
                        >
                          Load
                        </button>
                        <button
                          onClick={() => setPresets((ps) => ps.filter((x) => x.id !== p.id))}
                          style={{
                            fontSize: "0.75rem",
                            padding: "0.25rem",
                            color: "#f87171",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          <Trash2 style={{ width: "1rem", height: "1rem" }} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
