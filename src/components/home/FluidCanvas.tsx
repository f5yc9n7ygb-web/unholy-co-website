"use client"

import { useEffect, useRef, useCallback } from "react"

// ─── Shaders ────────────────────────────────────────────────────────────────

const VERT = `attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }`

const FRAG = `precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

vec2 hash(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(dot(hash(i), f), dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
    mix(dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
        dot(hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.877, 0.479, -0.479, 0.877);
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = rot * p * 2.0 + vec2(100.0);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float t = u_time;
  float aspect = u_resolution.x / u_resolution.y;
  vec2 uvA = vec2(uv.x * aspect, uv.y);

  // Mouse warp — tendrils flow toward cursor
  vec2 mA = vec2(u_mouse.x * aspect, u_mouse.y);
  float md = length(uvA - mA);
  vec2 warp = normalize(uvA - mA + 0.001) * smoothstep(0.8, 0.0, md) * 0.18;

  // Domain-warped FBM for organic flow
  vec2 p = uvA * 2.5;
  vec2 q = vec2(
    fbm(p + t * 0.08 + warp),
    fbm(p + vec2(5.2, 1.3) + t * 0.06)
  );
  vec2 r = vec2(
    fbm(p + q * 4.0 + vec2(1.7, 9.2) + t * 0.05),
    fbm(p + q * 4.0 + vec2(8.3, 2.8) + t * 0.04)
  );
  float f = fbm(p + r * 2.0);

  // Mouse proximity glow boost
  f += smoothstep(0.5, 0.0, md) * 0.2;

  // Color ramp — deep black to blood red
  vec3 col = vec3(0.0);
  col = mix(col, vec3(0.15, 0.0, 0.025), smoothstep(0.1, 0.4, f));
  col = mix(col, vec3(0.4, 0.0, 0.06), smoothstep(0.3, 0.6, f));
  col = mix(col, vec3(0.69, 0.0, 0.125), smoothstep(0.55, 0.9, f));
  col += vec3(0.12, 0.02, 0.02) * smoothstep(0.75, 1.0, f);

  // Vignette
  float vig = 1.0 - 0.45 * pow(length(uv - 0.5) * 1.4, 2.0);
  col *= vig * 0.5;

  gl_FragColor = vec4(col, 1.0);
}`

// ─── WebGL helpers ──────────────────────────────────────────────────────────

function compileShader(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error("Shader compile error:", gl.getShaderInfoLog(s))
    gl.deleteShader(s)
    return null
  }
  return s
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function FluidCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: 0.5, y: 0.5 })
  const targetRef = useRef({ x: 0.5, y: 0.5 })

  const handlePointer = useCallback((e: MouseEvent | TouchEvent) => {
    const cx = "touches" in e ? (e.touches[0]?.clientX ?? 0) : e.clientX
    const cy = "touches" in e ? (e.touches[0]?.clientY ?? 0) : e.clientY
    targetRef.current = { x: cx / window.innerWidth, y: 1.0 - cy / window.innerHeight }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Respect reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    // Skip WebGL on touch/mobile devices — the domain-warped FBM shader is too
    // GPU-heavy for mid-range Android, causing the homepage hero to glitch.
    // The CSS gradient fallback on the canvas element covers these devices.
    if (window.matchMedia("(hover: none) and (pointer: coarse)").matches) return

    const gl = canvas.getContext("webgl", { alpha: false, antialias: false, powerPreference: "low-power" })
    if (!gl) return

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERT)
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAG)
    if (!vs || !fs) return

    const prog = gl.createProgram()!
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(prog))
      return
    }
    gl.useProgram(prog)

    // Fullscreen quad
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog, "a_position")
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const uTime = gl.getUniformLocation(prog, "u_time")
    const uRes = gl.getUniformLocation(prog, "u_resolution")
    const uMouse = gl.getUniformLocation(prog, "u_mouse")

    // Render at reduced resolution for performance
    const dpr = Math.min(window.devicePixelRatio, 1.5)

    const resize = () => {
      const w = Math.floor(canvas.clientWidth * dpr)
      const h = Math.floor(canvas.clientHeight * dpr)
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        gl.viewport(0, 0, w, h)
      }
    }
    resize()

    const start = performance.now()
    let raf: number

    const render = () => {
      resize()

      // Smooth mouse interpolation (lerp toward target)
      const m = mouseRef.current
      const t = targetRef.current
      m.x += (t.x - m.x) * 0.05
      m.y += (t.y - m.y) * 0.05

      gl.uniform1f(uTime, (performance.now() - start) / 1000)
      gl.uniform2f(uRes, canvas.width, canvas.height)
      gl.uniform2f(uMouse, m.x, m.y)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

      raf = requestAnimationFrame(render)
    }
    raf = requestAnimationFrame(render)

    window.addEventListener("mousemove", handlePointer)
    window.addEventListener("touchmove", handlePointer as EventListener, { passive: true })
    window.addEventListener("resize", resize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("mousemove", handlePointer)
      window.removeEventListener("touchmove", handlePointer as EventListener)
      window.removeEventListener("resize", resize)
      gl.deleteProgram(prog)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      gl.deleteBuffer(buf)
    }
  }, [handlePointer])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        // CSS gradient fallback if WebGL fails to init
        background: "radial-gradient(ellipse at 50% 30%, rgba(176,0,32,0.12), transparent 70%), black",
      }}
    />
  )
}
