"use client"

import { Suspense, useMemo, useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { useTexture } from "@react-three/drei"
import * as THREE from "three"

function damp(current: number, target: number, speed: number, delta: number) {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-speed * Math.min(delta, 0.1)))
}

function ShopCanModel() {
  const texture = useTexture("/bloodthirst-texture.webp")

  texture.flipY = true
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.anisotropy = 8

  const bodyMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: texture,
        metalness: 0.82,
        roughness: 0.24,
      }),
    [texture]
  )

  const rimMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#c7c0a6"),
        metalness: 0.92,
        roughness: 0.18,
      }),
    []
  )

  return (
    <group>
      <mesh castShadow receiveShadow rotation={[0, Math.PI, 0]}>
        <cylinderGeometry args={[0.72, 0.72, 3.1, 96, 1, true]} />
        <primitive object={bodyMaterial} attach="material" />
      </mesh>
      <mesh position={[0, 1.57, 0]}>
        <cylinderGeometry args={[0.73, 0.72, 0.08, 96]} />
        <primitive object={rimMaterial} attach="material" />
      </mesh>
      <mesh position={[0, -1.57, 0]}>
        <cylinderGeometry args={[0.72, 0.73, 0.08, 96]} />
        <primitive object={rimMaterial} attach="material" />
      </mesh>
    </group>
  )
}

useTexture.preload("/bloodthirst-texture.webp")

function ShopCanRig({ progress }: { progress: React.RefObject<number> }) {
  const groupRef = useRef<THREE.Group>(null)
  const rotY = useRef(Math.PI * 0.15)
  const rotZ = useRef(0)
  const posY = useRef(0)
  const scale = useRef(0.98)

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const p = THREE.MathUtils.clamp(progress.current || 0, 0, 1)
    const targetRotY = Math.PI * 0.15 + p * Math.PI * 1.35
    const targetRotZ = Math.sin(p * Math.PI * 2) * 0.055
    const targetY = Math.sin(p * Math.PI) * 0.08
    const targetScale = 0.96 + Math.sin(p * Math.PI) * 0.1

    rotY.current = damp(rotY.current, targetRotY, 5, delta)
    rotZ.current = damp(rotZ.current, targetRotZ, 4, delta)
    posY.current = damp(posY.current, targetY, 4, delta)
    scale.current = damp(scale.current, targetScale, 3.5, delta)

    groupRef.current.rotation.y = rotY.current
    groupRef.current.rotation.z = rotZ.current
    groupRef.current.position.y = posY.current
    groupRef.current.scale.setScalar(scale.current)
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <ShopCanModel />
    </group>
  )
}

export default function ShopCanScene({ progress }: { progress: React.RefObject<number> }) {
  return (
    <Canvas
      camera={{ position: [0, 0.08, 6.2], fov: 32 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.75]}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.42} color="#202038" />
      <directionalLight position={[3, 4, 4]} intensity={4.8} color="#fff7ef" />
      <directionalLight position={[-4, 1.5, -2]} intensity={1.4} color="#7790b8" />
      <pointLight position={[-1.6, 0.4, 2.2]} intensity={3.5} color="#B00020" distance={7} />
      <Suspense fallback={null}>
        <ShopCanRig progress={progress} />
      </Suspense>
    </Canvas>
  )
}
