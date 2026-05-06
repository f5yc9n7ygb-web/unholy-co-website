"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Environment, useGLTF, useTexture } from "@react-three/drei"
import * as THREE from "three"

const clampDelta = (delta: number) => Math.min(delta, 0.1)
const damp = (current: number, target: number, speed: number, delta: number) =>
  THREE.MathUtils.lerp(current, target, 1 - Math.exp(-speed * delta))

const FRONT = Math.PI - 1.1

type Keyframe = {
  progress: number
  camera: [number, number, number]
  lookAt: [number, number, number]
  canRotY: number
  canRotZ: number
  canX: number
  canY: number
  canScale: number
  fov: number
}

/**
 * 5-PHASE RITUAL CHOREOGRAPHY
 *
 *  0.00 – 0.15  ARRIVAL   museum-case stillness, tagline letter cascade
 *  0.15 – 0.40  DESCENT   camera orbits & dollies for face-by-face inspection
 *  0.40 – 0.55  PROOF     can drifts upper-left, slow rotation
 *  0.55 – 0.75  OFFER     re-centers, label squares to user, tightens to hero
 *  0.75 – 1.00  CLOSE     cinematic spin & slight retreat as page seals
 */
const desktopKeyframes: Keyframe[] = [
  { progress: 0.00, camera: [0.1, 0.18, 4.6], lookAt: [0, 0.05, 0],   canRotY: FRONT,         canRotZ: 0,     canX: 0,    canY: 0,    canScale: 1.0,  fov: 32 },
  { progress: 0.10, camera: [0.0, 0.16, 4.4], lookAt: [0, 0.05, 0],   canRotY: FRONT - 0.35,  canRotZ: 0,     canX: 0,    canY: 0,    canScale: 1.02, fov: 32 },
  { progress: 0.15, camera: [0.0, 0.14, 4.2], lookAt: [0, 0.0, 0],    canRotY: FRONT - 0.55,  canRotZ: 0,     canX: 0,    canY: 0,    canScale: 1.04, fov: 32 },

  { progress: 0.20, camera: [1.4, 0.25, 3.4], lookAt: [0, 0.05, 0],   canRotY: FRONT - 1.0,   canRotZ: -0.06, canX: 0,    canY: 0,    canScale: 1.05, fov: 30 },
  { progress: 0.26, camera: [2.0, 0.30, 2.6], lookAt: [0, 0.05, 0],   canRotY: FRONT - 1.6,   canRotZ: -0.05, canX: 0,    canY: 0,    canScale: 1.06, fov: 28 },
  { progress: 0.32, camera: [-0.2, 0.50, 3.0], lookAt: [0, 0.05, 0],  canRotY: FRONT - 2.4,   canRotZ: 0,     canX: 0,    canY: 0,    canScale: 1.06, fov: 30 },
  { progress: 0.40, camera: [-2.0, 0.35, 3.2], lookAt: [0, 0.05, 0],  canRotY: FRONT - 3.1,   canRotZ: 0.05,  canX: 0,    canY: 0,    canScale: 1.04, fov: 32 },

  { progress: 0.46, camera: [-0.6, 0.55, 5.0], lookAt: [-0.4, 0.2, 0], canRotY: FRONT - 3.9,  canRotZ: 0,     canX: -1.1, canY: 0.4,  canScale: 0.92, fov: 34 },
  { progress: 0.55, camera: [-0.8, 0.55, 5.4], lookAt: [-0.6, 0.2, 0], canRotY: FRONT - 4.5,  canRotZ: 0,     canX: -1.3, canY: 0.4,  canScale: 0.92, fov: 34 },

  { progress: 0.62, camera: [0.0, 0.20, 4.4], lookAt: [0, 0.05, 0],   canRotY: FRONT - 5.4,   canRotZ: 0,     canX: 0,    canY: 0,    canScale: 1.0,  fov: 32 },
  { progress: 0.70, camera: [0.0, 0.10, 3.8], lookAt: [0, 0.05, 0],   canRotY: FRONT - 6.05,  canRotZ: 0,     canX: 0,    canY: 0,    canScale: 1.06, fov: 30 },
  { progress: 0.75, camera: [0.0, 0.05, 3.4], lookAt: [0, 0.05, 0],   canRotY: FRONT - 2 * Math.PI, canRotZ: 0, canX: 0,  canY: 0,    canScale: 1.10, fov: 28 },

  { progress: 0.85, camera: [0.0, 0.02, 3.6], lookAt: [0, 0.05, 0],   canRotY: FRONT - 2 * Math.PI, canRotZ: 0, canX: 0,  canY: 0,    canScale: 1.08, fov: 30 },
  { progress: 1.00, camera: [0.0, 0.00, 4.2], lookAt: [0, 0.0, 0],    canRotY: FRONT - 2 * Math.PI - 0.4, canRotZ: 0, canX: 0, canY: 0.05, canScale: 1.0, fov: 32 },
]

const mobileKeyframes: Keyframe[] = [
  { progress: 0.00, camera: [0.0, 0.20, 5.0], lookAt: [0, 0.0, 0],   canRotY: FRONT,        canRotZ: 0, canX: 0, canY: 0,    canScale: 1.0, fov: 36 },
  { progress: 0.20, camera: [0.0, 0.20, 5.0], lookAt: [0, 0.0, 0],   canRotY: FRONT - 1.2,  canRotZ: 0, canX: 0, canY: 0,    canScale: 1.0, fov: 36 },
  { progress: 0.45, camera: [0.0, 0.20, 5.4], lookAt: [0, 0.0, 0],   canRotY: FRONT - 3.0,  canRotZ: 0, canX: 0, canY: 0.1,  canScale: 0.95, fov: 36 },
  { progress: 0.65, camera: [0.0, 0.10, 4.6], lookAt: [0, 0.0, 0],   canRotY: FRONT - 5.2,  canRotZ: 0, canX: 0, canY: 0,    canScale: 1.04, fov: 34 },
  { progress: 0.78, camera: [0.0, 0.05, 4.0], lookAt: [0, 0.0, 0],   canRotY: FRONT - 2 * Math.PI, canRotZ: 0, canX: 0, canY: 0, canScale: 1.10, fov: 32 },
  { progress: 1.00, camera: [0.0, 0.00, 4.6], lookAt: [0, 0.0, 0],   canRotY: FRONT - 2 * Math.PI - 0.4, canRotZ: 0, canX: 0, canY: 0.05, canScale: 1.0, fov: 34 },
]

function interp(p: number, kfs: Keyframe[]) {
  const x = Math.max(0, Math.min(1, p))
  let a = kfs[0]
  let b = kfs[kfs.length - 1]
  for (let i = 0; i < kfs.length - 1; i++) {
    if (x >= kfs[i].progress && x <= kfs[i + 1].progress) {
      a = kfs[i]
      b = kfs[i + 1]
      break
    }
  }
  const range = b.progress - a.progress
  const t = range === 0 ? 0 : (x - a.progress) / range
  const s = t * t * (3 - 2 * t)
  return {
    camera: a.camera.map((v, i) => v + (b.camera[i] - v) * s) as [number, number, number],
    lookAt: a.lookAt.map((v, i) => v + (b.lookAt[i] - v) * s) as [number, number, number],
    canRotY: a.canRotY + (b.canRotY - a.canRotY) * s,
    canRotZ: a.canRotZ + (b.canRotZ - a.canRotZ) * s,
    canX: a.canX + (b.canX - a.canX) * s,
    canY: a.canY + (b.canY - a.canY) * s,
    canScale: a.canScale + (b.canScale - a.canScale) * s,
    fov: a.fov + (b.fov - a.fov) * s,
  }
}

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t))

/* ─── Shared finale ref ─── */
type FinaleState = {
  /** seconds since seal began; -1 means not sealed */
  t: number
}

/* ─── Can model — iridescent label via MeshPhysicalMaterial ─── */

type MaterialBag = {
  list: THREE.Material[]
}

function CanModel({
  premium,
  materialBag,
}: {
  premium: boolean
  materialBag: React.MutableRefObject<MaterialBag>
}) {
  const { scene } = useGLTF("/bloodthirst.glb")
  const texture = useTexture("/bloodthirst-texture.webp")

  texture.flipY = false
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.anisotropy = 16

  const cloned = useMemo(() => {
    const clone = scene.clone(true)
    const collected: THREE.Material[] = []
    clone.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (!mesh.isMesh) return

      if ((mesh.material as THREE.Material)?.name === "aluminium") {
        if (premium) {
          const mat = new THREE.MeshPhysicalMaterial({
            name: "aluminium",
            map: texture,
            metalness: 0.85,
            roughness: 0.22,
            clearcoat: 1.0,
            clearcoatRoughness: 0.18,
            iridescence: 0.45,
            iridescenceIOR: 1.6,
            iridescenceThicknessRange: [120, 720],
            envMapIntensity: 1.6,
            transparent: true,
            opacity: 1,
          })
          mesh.material = mat
          collected.push(mat)
        } else {
          const mat = (mesh.material as THREE.MeshStandardMaterial).clone()
          mat.map = texture
          mat.metalness = 0.85
          mat.roughness = 0.22
          mat.envMapIntensity = 1.4
          mat.transparent = true
          mat.opacity = 1
          mat.needsUpdate = true
          mesh.material = mat
          collected.push(mat)
        }
      } else {
        const src = (mesh.material as THREE.MeshStandardMaterial).clone()
        src.color = new THREE.Color(0x121212)
        src.metalness = 0.95
        src.roughness = 0.12
        src.envMapIntensity = 1.8
        src.transparent = true
        src.opacity = 1
        src.needsUpdate = true
        mesh.material = src
        collected.push(src)
      }
    })
    materialBag.current = { list: collected }
    return clone
  }, [scene, texture, premium, materialBag])

  return <primitive object={cloned} />
}

useGLTF.preload("/bloodthirst.glb")
useTexture.preload("/bloodthirst-texture.webp")

/* ─── Camera rig — finale takes over when sealed ─── */

function CameraRig({
  scrollProgress,
  mouseRef,
  kfs,
  finaleRef,
}: {
  scrollProgress: React.RefObject<number>
  mouseRef: React.RefObject<{ x: number; y: number }>
  kfs: Keyframe[]
  finaleRef: React.RefObject<FinaleState>
}) {
  const { camera } = useThree()
  const lookAt = useRef(new THREE.Vector3(0, 0, 0))
  const smooth = useRef(0)

  useFrame((_, raw) => {
    const dt = clampDelta(raw)
    const finale = finaleRef.current?.t ?? -1

    if (finale >= 0) {
      // Finale camera: snap close to the can, mild dolly retreat, no parallax
      const ft = Math.min(finale / 1.4, 1)
      const e = easeOutExpo(ft)
      const tx = 0
      const ty = 0
      const tz = THREE.MathUtils.lerp(2.0, 2.6, e)

      camera.position.x = damp(camera.position.x, tx, 8, dt)
      camera.position.y = damp(camera.position.y, ty, 8, dt)
      camera.position.z = damp(camera.position.z, tz, 6, dt)

      lookAt.current.x = damp(lookAt.current.x, 0, 6, dt)
      lookAt.current.y = damp(lookAt.current.y, 0, 6, dt)
      lookAt.current.z = damp(lookAt.current.z, 0, 6, dt)
      camera.lookAt(lookAt.current)

      if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
        const cam = camera as THREE.PerspectiveCamera
        const targetFov = THREE.MathUtils.lerp(28, 24, e)
        cam.fov = damp(cam.fov, targetFov, 5, dt)
        cam.updateProjectionMatrix()
      }
      return
    }

    const p = scrollProgress.current ?? 0
    smooth.current = THREE.MathUtils.lerp(smooth.current, p, 1 - Math.exp(-12 * dt))
    const k = interp(smooth.current, kfs)
    const m = mouseRef.current ?? { x: 0, y: 0 }
    const mx = m.x * 0.12
    const my = m.y * 0.06

    camera.position.x = damp(camera.position.x, k.camera[0] + mx, 4, dt)
    camera.position.y = damp(camera.position.y, k.camera[1] + my, 4, dt)
    camera.position.z = damp(camera.position.z, k.camera[2], 4, dt)

    lookAt.current.x = damp(lookAt.current.x, k.lookAt[0], 4, dt)
    lookAt.current.y = damp(lookAt.current.y, k.lookAt[1], 4, dt)
    lookAt.current.z = damp(lookAt.current.z, k.lookAt[2], 4, dt)
    camera.lookAt(lookAt.current)

    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      const cam = camera as THREE.PerspectiveCamera
      const targetFov = k.fov
      if (Math.abs(cam.fov - targetFov) > 0.05) {
        cam.fov = damp(cam.fov, targetFov, 4, dt)
        cam.updateProjectionMatrix()
      }
    }
  })

  return null
}

function CanGroup({
  scrollProgress,
  kfs,
  premium,
  finaleRef,
  materialBag,
}: {
  scrollProgress: React.RefObject<number>
  kfs: Keyframe[]
  premium: boolean
  finaleRef: React.RefObject<FinaleState>
  materialBag: React.MutableRefObject<MaterialBag>
}) {
  const ref = useRef<THREE.Group>(null)
  const rotY = useRef(FRONT)
  const rotZ = useRef(0)
  const px = useRef(0)
  const py = useRef(0)
  const sc = useRef(1)
  const smooth = useRef(0)

  // Finale anchors — captured at the moment seal begins
  const finaleAnchor = useRef<{ rotY: number; scale: number } | null>(null)
  const lastFinale = useRef<number>(-1)

  useFrame((_, raw) => {
    if (!ref.current) return
    const dt = clampDelta(raw)
    const finale = finaleRef.current?.t ?? -1

    if (finale >= 0) {
      // Capture starting state on the first finale frame
      if (lastFinale.current < 0) {
        finaleAnchor.current = {
          rotY: rotY.current,
          scale: sc.current,
        }
      }
      lastFinale.current = finale
      const anchor = finaleAnchor.current!

      // 0..0.9s : spin 540° (3π) with ease-out-expo, scale 1 → 1.4
      const spinT = Math.min(finale / 0.9, 1)
      const spinE = easeOutExpo(spinT)
      rotY.current = anchor.rotY - 3 * Math.PI * spinE
      sc.current = anchor.scale + (1.4 - anchor.scale) * spinE

      // 0.5..1.4s : material opacity fade 1 → 0
      const fadeT = Math.max(0, Math.min((finale - 0.5) / 0.9, 1))
      const opacity = 1 - fadeT
      const mats = materialBag.current?.list
      if (mats) {
        for (let i = 0; i < mats.length; i++) {
          const m = mats[i] as THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial
          m.opacity = opacity
          m.transparent = true
        }
      }

      ref.current.rotation.y = rotY.current
      ref.current.rotation.z = 0
      ref.current.position.x = 0
      ref.current.position.y = -1.29
      ref.current.scale.set(sc.current, sc.current, sc.current)
      return
    }

    // Reset finale anchor when not sealing
    if (lastFinale.current >= 0) {
      lastFinale.current = -1
      finaleAnchor.current = null
    }

    const p = scrollProgress.current ?? 0
    smooth.current = THREE.MathUtils.lerp(smooth.current, p, 1 - Math.exp(-12 * dt))
    const k = interp(smooth.current, kfs)

    rotY.current = damp(rotY.current, k.canRotY, 6, dt)
    rotZ.current = damp(rotZ.current, k.canRotZ, 5, dt)
    px.current = damp(px.current, k.canX, 5, dt)
    py.current = damp(py.current, k.canY, 5, dt)
    sc.current = damp(sc.current, k.canScale, 3.5, dt)

    ref.current.rotation.y = rotY.current
    ref.current.rotation.z = rotZ.current
    ref.current.position.x = px.current
    ref.current.position.y = -1.29 + py.current
    ref.current.scale.set(sc.current, sc.current, sc.current)
  })

  return (
    <group ref={ref} position={[0, -1.29, 0]}>
      <CanModel premium={premium} materialBag={materialBag} />
    </group>
  )
}

/* ─── Particles — slow ambient drift ─── */

function AmbientParticles({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * 8
      arr[i * 3 + 1] = (Math.random() - 0.5) * 6
      arr[i * 3 + 2] = (Math.random() - 0.5) * 4 - 1
    }
    return arr
  }, [count])

  useFrame((_, raw) => {
    if (!ref.current) return
    const dt = clampDelta(raw)
    ref.current.rotation.y += dt * 0.02
  })

  return (
    <points ref={ref} frustumCulled>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.012}
        color="#B00020"
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

/* ─── Particle burst — radial dissolve from can on seal ─── */

function FinaleBurst({
  finaleRef,
  count = 380,
}: {
  finaleRef: React.RefObject<FinaleState>
  count?: number
}) {
  const ref = useRef<THREE.Points>(null)
  const matRef = useRef<THREE.PointsMaterial>(null)

  // Pre-compute random unit-sphere directions + speeds
  const { positions, dirs, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const dirs = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      // random direction on unit sphere
      const u = Math.random() * 2 - 1
      const theta = Math.random() * Math.PI * 2
      const r = Math.sqrt(1 - u * u)
      dirs[i * 3 + 0] = r * Math.cos(theta)
      dirs[i * 3 + 1] = u
      dirs[i * 3 + 2] = r * Math.sin(theta)
      speeds[i] = 1.0 + Math.random() * 2.5
      // initialize at origin — will be set per-frame
      positions[i * 3 + 0] = 0
      positions[i * 3 + 1] = 0
      positions[i * 3 + 2] = 0
    }
    return { positions, dirs, speeds }
  }, [count])

  useFrame(() => {
    if (!ref.current || !matRef.current) return
    const finale = finaleRef.current?.t ?? -1
    if (finale < 0) {
      matRef.current.opacity = 0
      return
    }

    // Start the burst at 0.6s (the can is mid-spin); life 1.4s
    const t = Math.max(0, finale - 0.6)
    const life = Math.min(t / 1.4, 1)
    const e = 1 - Math.pow(1 - life, 2) // easeOutQuad

    const attr = ref.current.geometry.getAttribute("position") as THREE.BufferAttribute
    const arr = attr.array as Float32Array
    for (let i = 0; i < count; i++) {
      const dist = e * speeds[i] * 1.6
      arr[i * 3 + 0] = dirs[i * 3 + 0] * dist
      arr[i * 3 + 1] = dirs[i * 3 + 1] * dist
      arr[i * 3 + 2] = dirs[i * 3 + 2] * dist
    }
    attr.needsUpdate = true
    matRef.current.opacity = (1 - life) * 0.95
  })

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        size={0.04}
        color="#E63956"
        transparent
        opacity={0}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function SceneTone() {
  const { gl, size } = useThree()
  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping
    // Wider canvases catch more dark portions of the env map reflected on the
    // can sides — bump exposure on ultrawide aspects so iridescence stays bright.
    const aspect = size.width / Math.max(size.height, 1)
    const wideBoost = Math.min(0.17, Math.max(0, (aspect - 1.6) * 0.12))
    gl.toneMappingExposure = 1.15 + wideBoost
  }, [gl, size.width, size.height])
  return null
}

/* ─── Iridescence hue-shift — Phase 3 (Proof) gives the label a different sheen ─── */

function IridescenceShift({
  scrollProgress,
  materialBag,
}: {
  scrollProgress: React.RefObject<number>
  materialBag: React.MutableRefObject<MaterialBag>
}) {
  const smooth = useRef(0)

  useFrame((_, raw) => {
    const dt = clampDelta(raw)
    const p = scrollProgress.current ?? 0
    smooth.current = THREE.MathUtils.lerp(smooth.current, p, 1 - Math.exp(-8 * dt))

    // Bell curve peaking at the middle of Phase 3 (0.40–0.55)
    // Outside the range, weight = 0 → defaults preserved.
    const center = 0.475
    const halfWidth = 0.075
    const dist = Math.abs(smooth.current - center) / halfWidth
    const weight = Math.max(0, 1 - dist) // triangular bell, peak 1 at center

    const mats = materialBag.current?.list
    if (!mats) return

    // Default iridescence baked in CanModel: 0.45, IOR 1.6, thickness [120, 720]
    // Proof peak: push iridescence higher, IOR shifts to 1.85 (different rainbow band),
    // thickness range tightens for a more pronounced sheen.
    const irid = 0.45 + weight * 0.30        // 0.45 → 0.75
    const ior = 1.6 + weight * 0.25          // 1.6 → 1.85
    const thicknessMin = 120 + weight * 60   // 120 → 180
    const thicknessMax = 720 + weight * 240  // 720 → 960

    for (let i = 0; i < mats.length; i++) {
      const m = mats[i] as THREE.MeshPhysicalMaterial
      if (m.iridescence === undefined) continue // standard material — skip
      m.iridescence = irid
      m.iridescenceIOR = ior
      if (m.iridescenceThicknessRange) {
        m.iridescenceThicknessRange[0] = thicknessMin
        m.iridescenceThicknessRange[1] = thicknessMax
      }
    }
  })

  return null
}

/* ─── Public Scene ─── */

export type RitualSceneProps = {
  scrollProgress: React.RefObject<number>
  isMobile?: boolean
  /** Disable iridescence + cut particles for low-power devices */
  premium?: boolean
  /** When true, the scene plays its closing finale (spin → dissolve) */
  sealed?: boolean
}

export function RitualScene({
  scrollProgress,
  isMobile = false,
  premium = true,
  sealed = false,
}: RitualSceneProps) {
  const mouseRef = useRef({ x: 0, y: 0 })
  const kfs = isMobile ? mobileKeyframes : desktopKeyframes
  const materialBag = useRef<MaterialBag>({ list: [] })

  // Finale clock — increments while sealed
  const finaleRef = useRef<FinaleState>({ t: -1 })
  const sealStart = useRef<number | null>(null)

  useEffect(() => {
    if (!sealed) {
      finaleRef.current.t = -1
      sealStart.current = null
      return
    }
    sealStart.current = performance.now()
    let raf = 0
    const tick = () => {
      if (sealStart.current == null) return
      finaleRef.current.t = (performance.now() - sealStart.current) / 1000
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [sealed])

  useEffect(() => {
    const move = (e: MouseEvent) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      }
    }
    window.addEventListener("mousemove", move, { passive: true })
    return () => window.removeEventListener("mousemove", move)
  }, [])

  return (
    <Canvas
      camera={{ position: [0.1, 0.18, 4.6], fov: 32 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
      dpr={isMobile ? [1, 1.5] : [1.25, 2]}
    >
      <SceneTone />
      <CameraRig
        scrollProgress={scrollProgress}
        mouseRef={mouseRef}
        kfs={kfs}
        finaleRef={finaleRef}
      />

      {/* Cool key — top-right, jewel-case feel */}
      <directionalLight position={[2, 4, 3]} intensity={4.0} color="#f0f4ff" />
      <directionalLight position={[-3, 1, -2]} intensity={1.2} color="#7fa8c8" />
      <pointLight position={[-1.6, -0.5, -1.5]} intensity={3.2} color="#B00020" distance={6} decay={2} />
      <ambientLight intensity={0.3} color="#1a1a1f" />

      <Environment files="/env.hdr" background={false} />

      <CanGroup
        scrollProgress={scrollProgress}
        kfs={kfs}
        premium={premium && !isMobile}
        finaleRef={finaleRef}
        materialBag={materialBag}
      />

      {/* Iridescence shifts subtly during Phase 3 (Proof) */}
      {premium && !isMobile && (
        <IridescenceShift scrollProgress={scrollProgress} materialBag={materialBag} />
      )}

      {!isMobile && <AmbientParticles count={500} />}
      {isMobile && <AmbientParticles count={150} />}

      <FinaleBurst finaleRef={finaleRef} count={isMobile ? 180 : 380} />
    </Canvas>
  )
}
