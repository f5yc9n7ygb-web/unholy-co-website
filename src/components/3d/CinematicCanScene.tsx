"use client"

import { useRef, useMemo, useEffect, useState } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useGLTF, useTexture, Environment } from "@react-three/drei"
import * as THREE from "three"

/* ─── Shared lerp helper ─── */
// Clamp delta to prevent huge jumps after tab-switch or long frames (especially Android)
const clampDelta = (delta: number) => Math.min(delta, 0.1)
const damp = (current: number, target: number, speed: number, delta: number) =>
  THREE.MathUtils.lerp(current, target, 1 - Math.exp(-speed * delta))

/* ─── Keyframes: each "act" of the camera choreography ─── */
type Keyframe = {
  progress: number // 0–1 scroll position
  camera: [number, number, number]
  lookAt: [number, number, number]
  canRotY: number // can Y rotation in radians
  canRotZ: number // tilt/lean angle
  canX: number // can X world-space offset
  canY: number // can Y world-space offset (vertical)
  canScale: number // scale multiplier
}

/* The GLTF model's visual front (BLOODTHIRST label) */
const FRONT = Math.PI - 1.1

/*
 * CINEMATIC CHOREOGRAPHY — DESKTOP
 *
 * Rotation is CONTINUOUS in one direction (decreasing Y) —
 * the can completes a full 360° over the scroll journey.
 *
 * Visual angle reference:
 *   FRONT          → BLOODTHIRST label (skull + drip)
 *   FRONT - π/2    → Left side
 *   FRONT - π      → Back (DAMNATION FACTS)
 *   FRONT - 3π/2   → Right side
 *   FRONT - 2π     → BLOODTHIRST label again (full revolution)
 */
const desktopKeyframes: Keyframe[] = [
  // ═══ ACT 0: MYSTERY CLOSE-UP → REVEAL ═══
  { progress: 0.0,  camera: [0.3, 0.6, 2.0],   lookAt: [0, 0.2, 0],   canRotY: FRONT,         canRotZ: 0,      canX: 0,    canY: 0,    canScale: 1.0  },
  { progress: 0.04, camera: [0.2, 0.5, 2.6],   lookAt: [0, 0.15, 0],  canRotY: FRONT - 0.05,  canRotZ: 0,      canX: 0,    canY: 0,    canScale: 1.0  },
  { progress: 0.10, camera: [0, 0.3, 4.5],     lookAt: [0, 0, 0],     canRotY: FRONT - 0.15,  canRotZ: 0,      canX: 0,    canY: 0,    canScale: 1.0  },
  { progress: 0.14, camera: [0, 0.2, 5.2],     lookAt: [0, 0, 0],     canRotY: FRONT - 0.3,   canRotZ: 0,      canX: 0,    canY: 0,    canScale: 1.0  },

  // ═══ ACT 1: THE ELIXIR — can slides RIGHT, leans, text LEFT ═══
  { progress: 0.18, camera: [0, 0.15, 4.8],    lookAt: [0.5, 0, 0],   canRotY: FRONT - 0.7,   canRotZ: -0.08,  canX: 1.6,  canY: 0,    canScale: 1.0  },
  { progress: 0.22, camera: [0, 0.1, 4.6],     lookAt: [0.6, 0, 0],   canRotY: FRONT - 0.8,   canRotZ: -0.1,   canX: 1.8,  canY: 0,    canScale: 1.0  },
  { progress: 0.30, camera: [0, 0.08, 4.5],    lookAt: [0.5, 0, 0],   canRotY: FRONT - 1.0,   canRotZ: -0.08,  canX: 1.6,  canY: 0,    canScale: 1.0  },

  // ═══ ACT 1.5: DRIFT INTO DARKNESS ═══
  { progress: 0.35, camera: [0, 0.5, 7.0],     lookAt: [0, -0.3, 0],  canRotY: FRONT - 1.4,   canRotZ: 0,      canX: 0,    canY: -0.4, canScale: 0.85 },

  // ═══ ACT 2: THE SOURCE — can emerges LEFT, tilts opposite, text RIGHT ═══
  { progress: 0.39, camera: [0, 0.3, 5.0],     lookAt: [-0.5, 0, 0],  canRotY: FRONT - 2.0,   canRotZ: 0.08,   canX: -1.6, canY: 0,    canScale: 1.0  },
  { progress: 0.42, camera: [0, 0.25, 4.5],    lookAt: [-0.6, 0, 0],  canRotY: FRONT - 2.2,   canRotZ: 0.1,    canX: -1.8, canY: 0,    canScale: 1.0  },
  { progress: 0.49, camera: [0, 0.2, 4.3],     lookAt: [-0.5, 0, 0],  canRotY: FRONT - 2.5,   canRotZ: 0.08,   canX: -1.6, canY: 0,    canScale: 1.0  },

  // ═══ ACT 3: THE PROFILE — CAMERA ORBITS around the can ═══
  { progress: 0.53, camera: [-1.5, 1.8, 3.5],  lookAt: [0, 0, 0],     canRotY: FRONT - 3.0,   canRotZ: 0,      canX: 0,    canY: 0,    canScale: 1.0  },
  { progress: 0.57, camera: [0, 2.2, 3.0],     lookAt: [0, 0, 0],     canRotY: FRONT - 3.5,   canRotZ: 0,      canX: 0,    canY: 0,    canScale: 1.0  },
  { progress: 0.62, camera: [1.2, 1.5, 3.8],   lookAt: [0, 0, 0],     canRotY: FRONT - 4.2,   canRotZ: 0,      canX: 0,    canY: 0,    canScale: 1.0  },

  // ═══ ACT 4: THE STAND — can slides RIGHT, text LEFT ═══
  { progress: 0.66, camera: [0, 0.3, 4.5],     lookAt: [0.5, 0, 0],   canRotY: FRONT - 4.8,   canRotZ: -0.06,  canX: 1.5,  canY: 0,    canScale: 1.0  },
  { progress: 0.70, camera: [0, 0.25, 4.3],    lookAt: [0.6, 0, 0],   canRotY: FRONT - 5.1,   canRotZ: -0.08,  canX: 1.8,  canY: 0,    canScale: 1.0  },
  { progress: 0.76, camera: [0, 0.2, 4.2],     lookAt: [0.4, 0, 0],   canRotY: FRONT - 5.5,   canRotZ: -0.05,  canX: 1.6,  canY: 0,    canScale: 1.0  },

  // ═══ ACT 5: CTA — SCALE PUNCH, front-facing hero moment ═══
  { progress: 0.82, camera: [0, 0.15, 3.8],    lookAt: [0, 0, 0],     canRotY: FRONT - Math.PI * 2 + 0.25, canRotZ: 0, canX: -1.0, canY: 0,    canScale: 1.05 },
  { progress: 0.92, camera: [0, 0.08, 3.2],    lookAt: [0, 0, 0],     canRotY: FRONT - Math.PI * 2 + 0.25, canRotZ: 0, canX: -1.0, canY: 0,    canScale: 1.12 },
  { progress: 1.0,  camera: [0, 0.05, 3.0],    lookAt: [0, 0, 0],     canRotY: FRONT - Math.PI * 2 + 0.25, canRotZ: 0, canX: -1.0, canY: 0,    canScale: 1.15 },
]

/*
 * MOBILE CHOREOGRAPHY
 *
 * Full-screen canvas (same as desktop) — text overlaid at bottom via z-index.
 * No canX offsets (portrait is too narrow for side slides).
 * Can centered with slight upward push (canY 0.15) so lower portion falls in
 * the text zone which has a dark gradient scrim.
 * Tighter FOV (32) for a more cinematic telephoto look.
 * Camera pulled to Z 4.7–5.2 — close enough that the can reads large.
 */
const mobileKeyframes: Keyframe[] = [
  // ═══ ACT 0: MYSTERY CLOSE-UP → REVEAL ═══
  { progress: 0.0,  camera: [0.2, 0.4, 2.2],   lookAt: [0, 0.1, 0],   canRotY: FRONT,         canRotZ: 0,      canX: 0,  canY: 0.15, canScale: 1.0  },
  { progress: 0.04, camera: [0.1, 0.3, 3.0],   lookAt: [0, 0.1, 0],   canRotY: FRONT - 0.05,  canRotZ: 0,      canX: 0,  canY: 0.15, canScale: 1.0  },
  { progress: 0.10, camera: [0, 0.2, 4.6],     lookAt: [0, 0.05, 0],  canRotY: FRONT - 0.15,  canRotZ: 0,      canX: 0,  canY: 0.15, canScale: 1.0  },
  { progress: 0.14, camera: [0, 0.15, 5.0],    lookAt: [0, 0.05, 0],  canRotY: FRONT - 0.3,   canRotZ: 0,      canX: 0,  canY: 0.15, canScale: 1.0  },

  // ═══ ACT 1: THE ELIXIR — centered, slight lean ═══
  { progress: 0.18, camera: [0, 0.15, 4.8],    lookAt: [0, 0.05, 0],  canRotY: FRONT - 0.7,   canRotZ: -0.06,  canX: 0,  canY: 0.15, canScale: 1.0  },
  { progress: 0.22, camera: [0, 0.12, 4.6],    lookAt: [0, 0.05, 0],  canRotY: FRONT - 0.8,   canRotZ: -0.08,  canX: 0,  canY: 0.15, canScale: 1.0  },
  { progress: 0.30, camera: [0, 0.1, 4.5],     lookAt: [0, 0.05, 0],  canRotY: FRONT - 1.0,   canRotZ: -0.06,  canX: 0,  canY: 0.15, canScale: 1.0  },

  // ═══ ACT 1.5: DRIFT INTO DARKNESS ═══
  { progress: 0.35, camera: [0, 0.4, 6.0],     lookAt: [0, -0.1, 0],  canRotY: FRONT - 1.4,   canRotZ: 0,      canX: 0,  canY: -0.2, canScale: 0.8  },

  // ═══ ACT 2: THE SOURCE — centered, tilts opposite ═══
  { progress: 0.39, camera: [0, 0.15, 4.8],    lookAt: [0, 0.05, 0],  canRotY: FRONT - 2.0,   canRotZ: 0.06,   canX: 0,  canY: 0.15, canScale: 1.0  },
  { progress: 0.42, camera: [0, 0.12, 4.6],    lookAt: [0, 0.05, 0],  canRotY: FRONT - 2.2,   canRotZ: 0.08,   canX: 0,  canY: 0.15, canScale: 1.0  },
  { progress: 0.49, camera: [0, 0.1, 4.5],     lookAt: [0, 0.05, 0],  canRotY: FRONT - 2.5,   canRotZ: 0.06,   canX: 0,  canY: 0.15, canScale: 1.0  },

  // ═══ ACT 3: THE PROFILE — dramatic overhead orbit ═══
  { progress: 0.53, camera: [-0.6, 2.2, 3.8],  lookAt: [0, 0, 0],     canRotY: FRONT - 3.0,   canRotZ: 0,      canX: 0,  canY: 0.15, canScale: 1.0  },
  { progress: 0.57, camera: [0, 2.8, 3.2],     lookAt: [0, 0, 0],     canRotY: FRONT - 3.5,   canRotZ: 0,      canX: 0,  canY: 0.15, canScale: 1.0  },
  { progress: 0.62, camera: [0.6, 1.8, 4.2],   lookAt: [0, 0, 0],     canRotY: FRONT - 4.2,   canRotZ: 0,      canX: 0,  canY: 0.15, canScale: 1.0  },

  // ═══ ACT 4: THE STAND — centered, gentle lean ═══
  { progress: 0.66, camera: [0, 0.15, 4.8],    lookAt: [0, 0.05, 0],  canRotY: FRONT - 4.8,   canRotZ: -0.05,  canX: 0,  canY: 0.15, canScale: 1.0  },
  { progress: 0.70, camera: [0, 0.12, 4.6],    lookAt: [0, 0.05, 0],  canRotY: FRONT - 5.1,   canRotZ: -0.06,  canX: 0,  canY: 0.15, canScale: 1.0  },
  { progress: 0.76, camera: [0, 0.1, 4.5],     lookAt: [0, 0.05, 0],  canRotY: FRONT - 5.5,   canRotZ: -0.04,  canX: 0,  canY: 0.15, canScale: 1.0  },

  // ═══ ACT 5: CTA — scale punch, front-facing hero ═══
  { progress: 0.82, camera: [0, 0.1, 4.0],     lookAt: [0, 0.05, 0],  canRotY: FRONT - Math.PI * 2 + 0.25, canRotZ: 0, canX: 0,  canY: 0.15, canScale: 1.05 },
  { progress: 0.92, camera: [0, 0.05, 3.3],    lookAt: [0, 0.05, 0],  canRotY: FRONT - Math.PI * 2 + 0.25, canRotZ: 0, canX: 0,  canY: 0.15, canScale: 1.12 },
  { progress: 1.0,  camera: [0, 0.02, 3.0],    lookAt: [0, 0.05, 0],  canRotY: FRONT - Math.PI * 2 + 0.25, canRotZ: 0, canX: 0,  canY: 0.15, canScale: 1.18 },
]

function interpolateKeyframes(progress: number, keyframes: Keyframe[]) {
  const p = Math.max(0, Math.min(1, progress))

  // Find surrounding keyframes
  let a = keyframes[0]
  let b = keyframes[keyframes.length - 1]
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (p >= keyframes[i].progress && p <= keyframes[i + 1].progress) {
      a = keyframes[i]
      b = keyframes[i + 1]
      break
    }
  }

  const range = b.progress - a.progress
  const t = range === 0 ? 0 : (p - a.progress) / range
  // Smooth-step for cinematic ease
  const s = t * t * (3 - 2 * t)

  return {
    camera: a.camera.map((v, i) => v + (b.camera[i] - v) * s) as [number, number, number],
    lookAt: a.lookAt.map((v, i) => v + (b.lookAt[i] - v) * s) as [number, number, number],
    canRotY: a.canRotY + (b.canRotY - a.canRotY) * s,
    canRotZ: a.canRotZ + (b.canRotZ - a.canRotZ) * s,
    canX: a.canX + (b.canX - a.canX) * s,
    canY: a.canY + (b.canY - a.canY) * s,
    canScale: a.canScale + (b.canScale - a.canScale) * s,
  }
}

/* ─── The Can Model ─── */

function CanModel() {
  const { scene } = useGLTF("/bloodthirst.glb")
  const texture = useTexture("/bloodthirst-texture.webp")

  texture.flipY = false
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.anisotropy = 16

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (!mesh.isMesh) return
      const srcMat = mesh.material as THREE.MeshStandardMaterial
      const mat = srcMat.clone()
      mesh.material = mat
      if (mat.name === "aluminium") {
        mat.map = texture
        mat.metalness = 0.85
        mat.roughness = 0.15
        mat.envMapIntensity = 1.6
        mat.needsUpdate = true
      } else {
        // Lid / base — polished aluminum
        mat.color = new THREE.Color(0x1a1a1a)
        mat.metalness = 0.95
        mat.roughness = 0.1
        mat.envMapIntensity = 1.8
        mat.needsUpdate = true
      }
    })
    return clone
  }, [scene, texture])

  return <primitive object={clonedScene} />
}

useGLTF.preload("/bloodthirst.glb")
useTexture.preload("/bloodthirst-texture.webp")

/* ─── Camera Rig — follows keyframes + mouse parallax ─── */

function CameraRig({
  scrollProgress,
  mouseRef,
  activeKeyframes,
}: {
  scrollProgress: React.RefObject<number>
  mouseRef: React.RefObject<{ x: number; y: number }>
  activeKeyframes: Keyframe[]
}) {
  const { camera } = useThree()
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0))
  // Smoothed progress prevents the can from glitching on Android fling scrolls
  // where raw scrollYProgress can jump several keyframes in a single frame.
  const smoothedProgress = useRef(0)

  useFrame((_, rawDelta) => {
    const delta = clampDelta(rawDelta)
    const raw = scrollProgress.current ?? 0
    smoothedProgress.current = THREE.MathUtils.lerp(smoothedProgress.current, raw, 1 - Math.exp(-12 * delta))
    const p = smoothedProgress.current
    const kf = interpolateKeyframes(p, activeKeyframes)
    const mouse = mouseRef.current ?? { x: 0, y: 0 }

    // Mouse parallax offset (subtle)
    const mx = mouse.x * 0.15
    const my = mouse.y * 0.08

    // Smoothly damp camera to target (lower = more premium glide)
    camera.position.x = damp(camera.position.x, kf.camera[0] + mx, 4, delta)
    camera.position.y = damp(camera.position.y, kf.camera[1] + my, 4, delta)
    camera.position.z = damp(camera.position.z, kf.camera[2], 4, delta)

    // Smoothly damp lookAt
    currentLookAt.current.x = damp(currentLookAt.current.x, kf.lookAt[0], 4, delta)
    currentLookAt.current.y = damp(currentLookAt.current.y, kf.lookAt[1], 4, delta)
    currentLookAt.current.z = damp(currentLookAt.current.z, kf.lookAt[2], 4, delta)

    camera.lookAt(currentLookAt.current)
  })

  return null
}

/* ─── Can group — rotation, tilt, position, scale driven by scroll ─── */

function CanGroup({
  scrollProgress,
  activeKeyframes,
}: {
  scrollProgress: React.RefObject<number>
  activeKeyframes: Keyframe[]
}) {
  const groupRef = useRef<THREE.Group>(null)
  const currentRotY = useRef(FRONT)
  const currentRotZ = useRef(0)
  const currentX = useRef(0)
  const currentY = useRef(0)
  const currentScale = useRef(1)
  const smoothedProgress = useRef(0)

  useFrame((_, rawDelta) => {
    if (!groupRef.current) return
    const delta = clampDelta(rawDelta)
    const raw = scrollProgress.current ?? 0
    smoothedProgress.current = THREE.MathUtils.lerp(smoothedProgress.current, raw, 1 - Math.exp(-12 * delta))
    const p = smoothedProgress.current
    const kf = interpolateKeyframes(p, activeKeyframes)

    // Rotation — slightly faster damping so it converges on target
    currentRotY.current = damp(currentRotY.current, kf.canRotY, 6, delta)
    currentRotZ.current = damp(currentRotZ.current, kf.canRotZ, 5, delta)

    // Position
    currentX.current = damp(currentX.current, kf.canX, 5, delta)
    currentY.current = damp(currentY.current, kf.canY, 5, delta)

    // Scale — slowest for cinematic weight
    currentScale.current = damp(currentScale.current, kf.canScale, 3.5, delta)

    groupRef.current.rotation.y = currentRotY.current
    groupRef.current.rotation.z = currentRotZ.current
    groupRef.current.position.x = currentX.current
    groupRef.current.position.y = -1.29 + currentY.current

    const s = currentScale.current
    groupRef.current.scale.set(s, s, s)
  })

  return (
    <group ref={groupRef} position={[0, -1.29, 0]}>
      <CanModel />
    </group>
  )
}

/* ─── Mouse-reactive key light ─── */

function ParallaxKeyLight({ mouseRef }: { mouseRef: React.RefObject<{ x: number; y: number }> }) {
  const lightRef = useRef<THREE.DirectionalLight>(null)

  useFrame((_, rawDelta) => {
    if (!lightRef.current) return
    const delta = clampDelta(rawDelta)
    const mouse = mouseRef.current ?? { x: 0, y: 0 }
    lightRef.current.position.x = damp(lightRef.current.position.x, 2 + mouse.x * 1.5, 4, delta)
    lightRef.current.position.y = damp(lightRef.current.position.y, 4 + mouse.y * 1.0, 4, delta)
  })

  return (
    <directionalLight
      ref={lightRef}
      position={[2, 4, 3]}
      intensity={4.5}
      color="#fff8f0"
    />
  )
}

/* ─── Tone mapping ─── */

function SceneTone() {
  const { gl } = useThree()
  gl.toneMapping = THREE.ACESFilmicToneMapping
  gl.toneMappingExposure = 1.2
  return null
}

/* ═══ Public Component ═══ */

export type CinematicCanSceneProps = {
  scrollProgress: React.RefObject<number>
  isMobile?: boolean
}

export function CinematicCanScene({ scrollProgress, isMobile = false }: CinematicCanSceneProps) {
  const mouseRef = useRef({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const activeKeyframes = isMobile ? mobileKeyframes : desktopKeyframes

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      // Normalize to -1..1
      mouseRef.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      }
    }
    window.addEventListener("mousemove", handleMove)
    return () => window.removeEventListener("mousemove", handleMove)
  }, [])

  return (
    <div ref={containerRef} className="h-full w-full">
      <Canvas
        camera={{ position: [0.3, 0.6, 2.0], fov: isMobile ? 32 : 35 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
        dpr={[1, 2]}
      >
        <SceneTone />
        <CameraRig scrollProgress={scrollProgress} mouseRef={mouseRef} activeKeyframes={activeKeyframes} />

        {/* Key light — follows mouse */}
        <ParallaxKeyLight mouseRef={mouseRef} />

        {/* Fill light — cool blue opposite side */}
        <directionalLight position={[-3, 1, -1]} intensity={1.5} color="#7080a0" />

        {/* Blood accent rim */}
        <pointLight position={[-1.5, 0.5, -2]} intensity={3} color="#B00020" distance={6} decay={2} />

        {/* Ambient — enough to lift shadow detail without washing out */}
        <ambientLight intensity={0.4} color="#1a1a2e" />

        {/* HDR environment for metallic reflections */}
        <Environment files="/env.hdr" background={false} />

        <CanGroup scrollProgress={scrollProgress} activeKeyframes={activeKeyframes} />
      </Canvas>
    </div>
  )
}
