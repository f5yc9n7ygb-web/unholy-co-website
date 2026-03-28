"use client"

import { useRef, useMemo, Suspense } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useGLTF, useTexture, Environment, OrbitControls } from "@react-three/drei"
import * as THREE from "three"

/* ─── The Can ─── */

function CanModel({ autoRotate }: { autoRotate: boolean }) {
  const { scene } = useGLTF("/bloodthirst.glb")
  const texture = useTexture("/bloodthirst-texture.webp")
  const ref = useRef<THREE.Group>(null)

  texture.flipY = false
  texture.colorSpace = THREE.SRGBColorSpace
  // Sharper texture sampling
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.anisotropy = 16

  // Clone scene so we don't mutate shared cache
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
        mat.metalness = 0.6
        mat.roughness = 0.35
        mat.envMapIntensity = 1.0
        mat.needsUpdate = true
      } else {
        mat.color = new THREE.Color(0x222222)
        mat.metalness = 0.9
        mat.roughness = 0.18
        mat.envMapIntensity = 1.2
        mat.needsUpdate = true
      }
    })
    return clone
  }, [scene, texture])

  useFrame((_, delta) => {
    if (autoRotate && ref.current) {
      // Clamp delta to prevent runaway rotation after tab-switch or long frames
      const dt = Math.min(delta, 0.1)
      ref.current.rotation.y += dt * 0.3
    }
  })

  return (
    <group ref={ref} dispose={null}>
      <primitive object={clonedScene} />
    </group>
  )
}

useGLTF.preload("/bloodthirst.glb")

/* ─── Subtle blood-red caustic on the ground ─── */

function BloodCaustic() {
  const meshRef = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshBasicMaterial
      // clock.elapsedTime is safe — it doesn't spike on tab-switch like delta does
      mat.opacity = 0.12 + Math.sin(clock.elapsedTime * 0.8) * 0.04
    }
  })

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.32, 0]}>
      <circleGeometry args={[1, 64]} />
      <meshBasicMaterial
        color="#B00020"
        transparent
        opacity={0.12}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  )
}

/* ─── Post-processing tone ─── */

function SceneTone() {
  const { gl } = useThree()
  gl.toneMapping = THREE.ACESFilmicToneMapping
  gl.toneMappingExposure = 1.1
  return null
}

/* ─── Public Component ─── */

type CanViewerProps = {
  className?: string
  autoRotate?: boolean
  interactive?: boolean
  scale?: number
}

export function CanViewer({
  className,
  autoRotate = true,
  interactive = true,
  scale = 1,
}: CanViewerProps) {
  return (
    <div className={className} aria-label="Interactive 3D BloodThirst can" role="img">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 35 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
        dpr={[1, 2]}
      >
        <SceneTone />

        {/*
          Key light — slightly warm, top-right.
          Simulates a single dramatic studio softbox.
        */}
        <directionalLight
          position={[2, 4, 3]}
          intensity={3.5}
          color="#fff5e6"
          castShadow={false}
        />

        {/* Fill light — cool blue from the opposite side to separate edges */}
        <directionalLight
          position={[-3, 1, -1]}
          intensity={1.2}
          color="#8090b0"
        />

        {/* Blood accent rim — subtle red kiss on the edge */}
        <pointLight
          position={[-1.5, 0.5, -2]}
          intensity={2}
          color="#B00020"
          distance={6}
          decay={2}
        />

        {/* Faint top-down ambient to stop pure-black crush */}
        <ambientLight intensity={0.15} color="#1a1a2e" />

        <Suspense fallback={null}>
          {/* HDR environment for realistic metallic reflections */}
          <Environment files="/env.hdr" background={false} />

          <group scale={scale} position={[0, -1.29, 0]}>
            <CanModel autoRotate={autoRotate} />
          </group>

          <BloodCaustic />
        </Suspense>

        {interactive && (
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            enableDamping
            dampingFactor={0.06}
            rotateSpeed={0.5}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 1.7}
          />
        )}
      </Canvas>
    </div>
  )
}
