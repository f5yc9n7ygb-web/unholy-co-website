"use client"

import { Suspense, useEffect, useMemo, useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { useTexture } from "@react-three/drei"
import { motion, useScroll, useTransform } from "framer-motion"
import * as THREE from "three"

/**
 * Shop-specific 3D can inspection.
 *
 * This intentionally does not reuse the BloodThirst page's scene component.
 * The motion is simpler and commerce-focused: inspect the can, read the
 * product proof points, then continue to checkout.
 */

const PROOF_POINTS = [
  { label: "FORMAT", value: "500ML", blurb: "Matte-black aluminium can" },
  { label: "SUGAR", value: "ZERO", blurb: "No sweeteners. Nothing added." },
  { label: "SOURCE", value: "HIMALAYAN", blurb: "Natural mineral water" },
  { label: "PACKS", value: "6 / 12 / 24", blurb: "Pick your batch size" },
]

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

function ShopCanScene({ progress }: { progress: React.RefObject<number> }) {
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

export function ProductFilm() {
  const containerRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef(0)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  })

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (value) => {
      progressRef.current = value
    })
    return unsubscribe
  }, [scrollYProgress])

  const canX = useTransform(scrollYProgress, [0, 0.45, 1], ["-10%", "0%", "10%"])
  const scanY = useTransform(scrollYProgress, [0.12, 0.88], ["18%", "82%"])
  const leftOpacity = useTransform(scrollYProgress, [0.08, 0.2, 0.78, 0.9], [0, 1, 1, 0])
  const rightOpacity = useTransform(scrollYProgress, [0.18, 0.3, 0.86, 0.96], [0, 1, 1, 0])

  return (
    <section
      ref={containerRef}
      className="relative h-[165vh] overflow-hidden bg-black"
      aria-label="BloodThirst 3D product inspection"
    >
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 820px 560px at 50% 56%, rgba(176,0,32,0.18), transparent 68%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
          aria-hidden="true"
        />

        <motion.div
          style={{ opacity: leftOpacity }}
          className="absolute left-4 top-[15%] z-20 max-w-[16rem] md:left-16 md:top-[22%] md:max-w-xs"
        >
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.45em] text-blood/75 md:text-[11px]">
            // inspect the can
          </p>
          <h2 className="font-cinzel text-3xl font-black uppercase leading-[0.92] text-offwhite md:text-5xl">
            Not a bottle.<br />
            <span className="text-blood">A black can.</span>
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-bone/55 md:text-base">
            Natural Himalayan mineral water in a 500ml aluminium can, made to sit on a desk,
            in a gym bag, or on a late-night table without looking ordinary.
          </p>
        </motion.div>

        <motion.div
          style={{ x: canX }}
          className="absolute inset-y-[10%] left-1/2 z-10 w-[58vw] max-w-[420px] -translate-x-1/2 md:w-[32vw]"
        >
          <ShopCanScene progress={progressRef} />
        </motion.div>

        <motion.div
          style={{ top: scanY }}
          className="pointer-events-none absolute left-[12%] right-[12%] z-30 h-px bg-gradient-to-r from-transparent via-blood/80 to-transparent shadow-[0_0_24px_rgba(176,0,32,0.8)]"
          aria-hidden="true"
        />

        <motion.div
          style={{ opacity: rightOpacity }}
          className="absolute bottom-[10%] right-4 z-20 grid w-[calc(100%-2rem)] max-w-xl grid-cols-2 gap-3 md:right-16 md:top-1/2 md:w-[24rem] md:-translate-y-1/2"
        >
          {PROOF_POINTS.map((point, i) => (
            <motion.div
              key={point.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55, delay: i * 0.08 }}
              className="rounded-xl border border-white/[0.07] bg-black/55 p-4 backdrop-blur-xl"
            >
              <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-blood/70">
                {point.label}
              </p>
              <p className="mt-2 font-cinzel text-xl font-black uppercase leading-none text-offwhite md:text-2xl">
                {point.value}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-bone/45">
                {point.blurb}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
