"use client"

import { Suspense, useEffect, useMemo, useRef } from "react"
import type React from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Environment, Lightformer, useGLTF, useTexture } from "@react-three/drei"
import * as THREE from "three"

type MobileCanStageProps = {
  onReady?: () => void
  onFirstDrag?: () => void
}

const FRONT = Math.PI - 1.1
const damp = (current: number, target: number, speed: number, delta: number) =>
  THREE.MathUtils.lerp(current, target, 1 - Math.exp(-speed * Math.min(delta, 0.1)))

export function MobileCanStage({ onReady, onFirstDrag }: MobileCanStageProps) {
  const motionRef = useRef({
    current: FRONT,
    target: FRONT,
    velocity: 0,
    dragging: false,
    lastX: 0,
    lastT: 0,
  })
  const invalidateRef = useRef<(() => void) | null>(null)
  const inertiaRef = useRef<number | null>(null)
  const dragFired = useRef(false)

  useEffect(() => {
    return () => {
      if (inertiaRef.current) cancelAnimationFrame(inertiaRef.current)
    }
  }, [])

  const startInertia = () => {
    if (inertiaRef.current) cancelAnimationFrame(inertiaRef.current)
    const tick = () => {
      const motion = motionRef.current
      motion.velocity *= 0.93
      motion.target += motion.velocity
      invalidateRef.current?.()
      if (Math.abs(motion.velocity) > 0.0008) {
        inertiaRef.current = requestAnimationFrame(tick)
      } else {
        inertiaRef.current = null
      }
    }
    inertiaRef.current = requestAnimationFrame(tick)
  }

  return (
    <div
      className="absolute inset-0 touch-pan-y"
      role="img"
      aria-label="Interactive BloodThirst can"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId)
        if (inertiaRef.current) cancelAnimationFrame(inertiaRef.current)
        motionRef.current.dragging = true
        motionRef.current.lastX = event.clientX
        motionRef.current.lastT = performance.now()
        motionRef.current.velocity = 0
      }}
      onPointerMove={(event) => {
        const motion = motionRef.current
        if (!motion.dragging) return
        const now = performance.now()
        const dx = event.clientX - motion.lastX
        const dt = Math.max(16, now - motion.lastT)
        motion.target += dx * 0.012
        motion.velocity = (dx / dt) * 0.18
        motion.lastX = event.clientX
        motion.lastT = now
        invalidateRef.current?.()
        if (!dragFired.current && Math.abs(dx) > 4) {
          dragFired.current = true
          onFirstDrag?.()
        }
      }}
      onPointerUp={(event) => {
        motionRef.current.dragging = false
        event.currentTarget.releasePointerCapture(event.pointerId)
        startInertia()
      }}
      onPointerCancel={() => {
        motionRef.current.dragging = false
        startInertia()
      }}
    >
      <Canvas
        frameloop="demand"
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.2, 5.2], fov: 34 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.34} color="#18181d" />
        <directionalLight position={[2.4, 3.2, 3.5]} intensity={2.8} color="#f4f2ff" />
        <directionalLight position={[-2.2, -0.4, 2.8]} intensity={1.2} color="#B00020" />
        <Environment resolution={64} background={false}>
          <Lightformer form="rect" intensity={2.8} position={[0, 1.8, 3]} scale={[2.8, 1.2, 1]} />
          <Lightformer form="rect" intensity={1.2} position={[-2.8, 0.3, 1.5]} rotation-y={0.7} scale={[0.8, 2.4, 1]} color="#B00020" />
          <Lightformer form="ring" intensity={1.7} position={[2.2, -0.6, 2.4]} scale={[1.4, 1.4, 1]} color="#ffffff" />
        </Environment>
        {/* Gate both onReady and the can render on the GLB resolving — the model
            is deliberately not preloaded, so useGLTF/useTexture will suspend. */}
        <Suspense fallback={null}>
          <SceneController invalidateRef={invalidateRef} onReady={onReady} />
          <Can motionRef={motionRef} />
        </Suspense>
      </Canvas>
    </div>
  )
}

function SceneController({
  invalidateRef,
  onReady,
}: {
  invalidateRef: React.MutableRefObject<(() => void) | null>
  onReady?: () => void
}) {
  const { gl, invalidate } = useThree()
  const frames = useRef(0)
  const fired = useRef(false)

  useEffect(() => {
    invalidateRef.current = invalidate
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = 1.08
    invalidate()
    return () => {
      invalidateRef.current = null
    }
  }, [gl, invalidate, invalidateRef])

  useFrame(() => {
    if (fired.current) return
    frames.current += 1
    if (frames.current < 2) {
      invalidate()
      return
    }
    fired.current = true
    onReady?.()
  })

  return null
}

function Can({
  motionRef,
}: {
  motionRef: React.MutableRefObject<{
    current: number
    target: number
    velocity: number
    dragging: boolean
    lastX: number
    lastT: number
  }>
}) {
  const groupRef = useRef<THREE.Group>(null)
  const model = useCanModel()
  const { invalidate } = useThree()

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group) return
    const motion = motionRef.current
    motion.current = damp(motion.current, motion.target, 13, delta)
    group.rotation.y = motion.current
    group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, motion.dragging ? -motion.velocity * 4 : 0, 0.12)
    if (Math.abs(motion.current - motion.target) > 0.001 || Math.abs(motion.velocity) > 0.0008) {
      invalidate()
    }
  })

  return (
    <group ref={groupRef} position={[0, -1.34, 0]} scale={[1.02, 1.02, 1.02]}>
      <primitive object={model} />
    </group>
  )
}

function useCanModel() {
  const gltf = useGLTF("/bloodthirst-mobile.glb") as { scene: THREE.Group }
  const texture = useTexture("/bloodthirst-texture.webp")

  texture.flipY = false
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.anisotropy = 8

  return useMemo(() => {
    const clone = gltf.scene.clone(true)
    clone.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (!mesh.isMesh) return

      if ((mesh.material as THREE.Material)?.name === "aluminium") {
        mesh.material = new THREE.MeshPhysicalMaterial({
          name: "aluminium",
          map: texture,
          metalness: 0.78,
          roughness: 0.32,
          clearcoat: 0.68,
          clearcoatRoughness: 0.24,
          iridescence: 0.16,
          iridescenceIOR: 1.55,
          iridescenceThicknessRange: [120, 480],
          envMapIntensity: 1.15,
        })
      } else {
        mesh.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(0x101010),
          metalness: 0.92,
          roughness: 0.16,
          envMapIntensity: 1.18,
        })
      }
    })
    return clone
  }, [gltf.scene, texture])
}
