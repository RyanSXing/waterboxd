'use client'
import { useEffect, useRef } from 'react'
import Link from 'next/link'

// ─── Shaders ────────────────────────────────────────────────────────────────

const VERT = `#version 300 es
layout(location = 0) in vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0, 1); }
`

// Ping-pong wave simulation (ported from ShaderToy wdtyDH)
const SIM_FRAG = `#version 300 es
precision highp float;
precision highp sampler2D;
uniform sampler2D u_prev;
uniform vec2 u_res;
uniform vec4 u_mouse;
uniform int u_frame;
out vec4 fragColor;
const float delta = 1.0;
void main() {
  if (u_frame == 0) { fragColor = vec4(0); return; }
  ivec2 px = ivec2(gl_FragCoord.xy);
  float pressure = texelFetch(u_prev, px, 0).x;
  float pVel     = texelFetch(u_prev, px, 0).y;
  float p_right  = texelFetch(u_prev, px + ivec2( 1,  0), 0).x;
  float p_left   = texelFetch(u_prev, px + ivec2(-1,  0), 0).x;
  float p_up     = texelFetch(u_prev, px + ivec2( 0,  1), 0).x;
  float p_down   = texelFetch(u_prev, px + ivec2( 0, -1), 0).x;
  if (px.x == 0)                  p_left  = p_right;
  if (px.x == int(u_res.x) - 1)  p_right = p_left;
  if (px.y == 0)                  p_down  = p_up;
  if (px.y == int(u_res.y) - 1)  p_up    = p_down;
  pVel += delta * (-2.0 * pressure + p_right + p_left) / 4.0;
  pVel += delta * (-2.0 * pressure + p_up    + p_down) / 4.0;
  pressure += delta * pVel;
  pVel -= 0.005 * delta * pressure;
  pVel *= 1.0 - 0.002 * delta;
  pressure *= 0.999;
  fragColor = vec4(pressure, pVel, (p_right - p_left) / 2.0, (p_up - p_down) / 2.0);
  // Emit ripple at cursor — larger radius, stronger push
  if (u_mouse.z > 0.0) {
    float dist = distance(gl_FragCoord.xy, u_mouse.xy);
    if (dist <= 60.0) {
      fragColor.x += (1.0 - dist / 60.0) * 2.5;
    }
  }
}
`

// Render: bright water background + distorted text texture
const RENDER_FRAG = `#version 300 es
precision highp float;
uniform sampler2D u_sim;
uniform sampler2D u_text;
uniform vec2 u_res;
out vec4 fragColor;
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec4 data = texture(u_sim, uv);

  // Large visible distortion
  vec2 offset = 0.22 * data.zw;
  vec2 distUV = clamp(uv + offset, 0.0, 1.0);

  // Bright tropical water gradient
  vec3 colShallow = vec3(0.55, 0.90, 0.98);
  vec3 colDeep    = vec3(0.08, 0.68, 0.88);
  vec3 bg = mix(colDeep, colShallow, distUV.y + data.x * 0.12);

  // White sun sparkles
  vec3 norm     = normalize(vec3(-data.z, 0.5, -data.w));
  vec3 lightDir = normalize(vec3(-2.0, 8.0, 4.0));
  float spec    = pow(max(0.0, dot(norm, lightDir)), 35.0);
  bg += vec3(1.0) * spec * 2.0;

  // Text sampled at the same distorted UV (y-flipped; canvas 2D has y=0 at top)
  vec4 txt = texture(u_text, vec2(distUV.x, 1.0 - distUV.y));
  vec3 color = mix(bg, txt.rgb, txt.a * 0.94);

  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`

// ─── Text canvas ────────────────────────────────────────────────────────────

function buildTextCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  const ctx = c.getContext('2d')!

  const cx = w / 2
  const cy = h / 2

  const titleSize = Math.max(52, Math.min(w * 0.10, 160))
  const tagSize   = Math.max(13, Math.min(w * 0.014, 20))

  // Tagline
  ctx.save()
  ctx.font         = `900 ${tagSize}px 'Arial Black', Arial, sans-serif`
  ctx.fillStyle    = '#c1121f'
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'middle'
  if ('letterSpacing' in ctx) (ctx as any).letterSpacing = '6px'
  ctx.fillText('TRACK. RATE. HYDRATE.', cx, cy - titleSize * 0.95)
  ctx.restore()

  // Main title — drop shadow for depth
  ctx.save()
  ctx.font         = `900 ${titleSize}px 'Arial Black', Arial, sans-serif`
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'middle'
  if ('letterSpacing' in ctx) (ctx as any).letterSpacing = '8px'
  ctx.shadowColor   = 'rgba(0,0,0,0.25)'
  ctx.shadowBlur    = 12
  ctx.shadowOffsetY = 4
  ctx.fillStyle    = '#000000'
  ctx.fillText('WATERBOXD', cx, cy)
  ctx.restore()

  return c
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function LandingWater() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const gl = canvas.getContext('webgl2')
    if (!gl) return
    if (!gl.getExtension('EXT_color_buffer_float')) {
      console.warn('EXT_color_buffer_float not supported')
      return
    }

    let animId: number
    let w = 0, h = 0
    let textures: [WebGLTexture, WebGLTexture] | null = null
    let fbos: [WebGLFramebuffer, WebGLFramebuffer] | null = null
    let textTex: WebGLTexture | null = null
    let frame = 0
    const mouse = { x: 0, y: 0, active: false }

    // GL helpers
    function compile(type: number, src: string) {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src); gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s))
      return s
    }
    function makeProgram(frag: string) {
      const p = gl.createProgram()!
      gl.attachShader(p, compile(gl.VERTEX_SHADER, VERT))
      gl.attachShader(p, compile(gl.FRAGMENT_SHADER, frag))
      gl.linkProgram(p)
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) console.error(gl.getProgramInfoLog(p))
      return p
    }
    function makeFloatTex(tw: number, th: number) {
      const t = gl.createTexture()!
      gl.bindTexture(gl.TEXTURE_2D, t)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, tw, th, 0, gl.RGBA, gl.FLOAT, null)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      return t
    }
    function makeFBO(tex: WebGLTexture) {
      const fbo = gl.createFramebuffer()!
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      return fbo
    }

    // Fullscreen quad — attribute location 0
    const vao = gl.createVertexArray()!
    gl.bindVertexArray(vao)
    const buf = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    gl.bindVertexArray(null)

    const simProg    = makeProgram(SIM_FRAG)
    const renderProg = makeProgram(RENDER_FRAG)

    const simU = {
      prev:  gl.getUniformLocation(simProg, 'u_prev'),
      res:   gl.getUniformLocation(simProg, 'u_res'),
      mouse: gl.getUniformLocation(simProg, 'u_mouse'),
      frame: gl.getUniformLocation(simProg, 'u_frame'),
    }
    const renU = {
      sim:  gl.getUniformLocation(renderProg, 'u_sim'),
      text: gl.getUniformLocation(renderProg, 'u_text'),
      res:  gl.getUniformLocation(renderProg, 'u_res'),
    }

    function uploadText() {
      if (textTex) gl.deleteTexture(textTex)
      const tc = buildTextCanvas(w, h)
      textTex = gl.createTexture()!
      gl.bindTexture(gl.TEXTURE_2D, textTex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tc)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    }

    function allocate(newW: number, newH: number) {
      if (textures) { gl.deleteTexture(textures[0]); gl.deleteTexture(textures[1]) }
      if (fbos)     { gl.deleteFramebuffer(fbos[0]); gl.deleteFramebuffer(fbos[1]) }
      w = newW; h = newH
      canvas.width = w; canvas.height = h
      textures = [makeFloatTex(w, h), makeFloatTex(w, h)]
      fbos     = [makeFBO(textures[0]), makeFBO(textures[1])]
      frame    = 0
      uploadText()
    }

    function draw() {
      if (!textures || !fbos || !textTex) return
      const read  = frame & 1
      const write = 1 - read

      // Simulation pass
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbos[write])
      gl.viewport(0, 0, w, h)
      gl.useProgram(simProg)
      gl.bindVertexArray(vao)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, textures[read])
      gl.uniform1i(simU.prev, 0)
      gl.uniform2f(simU.res, w, h)
      gl.uniform1i(simU.frame, frame)
      gl.uniform4f(simU.mouse, mouse.x, mouse.y, mouse.active ? 1.0 : 0.0, 0.0)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

      // Render pass
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, w, h)
      gl.useProgram(renderProg)
      gl.bindVertexArray(vao)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, textures[write])
      gl.uniform1i(renU.sim, 0)
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, textTex)
      gl.uniform1i(renU.text, 1)
      gl.uniform2f(renU.res, w, h)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

      frame++
      animId = requestAnimationFrame(draw)
    }

    function getPos(clientX: number, clientY: number) {
      const rect = canvas.getBoundingClientRect()
      mouse.x = (clientX - rect.left) * (w / rect.width)
      mouse.y = h - (clientY - rect.top) * (h / rect.height) // flip Y for WebGL
    }

    function onMouseMove(e: MouseEvent)  { getPos(e.clientX, e.clientY); mouse.active = true }
    function onMouseLeave()              { mouse.active = false }
    function onTouchMove(e: TouchEvent)  {
      e.preventDefault()
      const t = e.touches[0]; getPos(t.clientX, t.clientY); mouse.active = true
    }
    function onTouchEnd() { mouse.active = false }
    function onResize()   { allocate(window.innerWidth, window.innerHeight) }

    window.addEventListener('mousemove',  onMouseMove)
    window.addEventListener('mouseleave', onMouseLeave)
    canvas.addEventListener('touchmove',  onTouchMove, { passive: false })
    canvas.addEventListener('touchend',   onTouchEnd)
    window.addEventListener('resize',     onResize)

    allocate(window.innerWidth, window.innerHeight)
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('mousemove',  onMouseMove)
      window.removeEventListener('mouseleave', onMouseLeave)
      canvas.removeEventListener('touchmove',  onTouchMove)
      canvas.removeEventListener('touchend',   onTouchEnd)
      window.removeEventListener('resize',     onResize)
      if (textures) { gl.deleteTexture(textures[0]); gl.deleteTexture(textures[1]) }
      if (fbos)     { gl.deleteFramebuffer(fbos[0]); gl.deleteFramebuffer(fbos[1]) }
      if (textTex)  gl.deleteTexture(textTex)
    }
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
      />
      {/* ENTER button sits below the centered text — HTML so it's clickable */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ pointerEvents: 'none' }}
      >
        <div style={{ marginTop: '14vh', pointerEvents: 'auto' }}>
          <Link
            href="/home"
            className="inline-block bg-[#e63946] text-white font-black tracking-widest uppercase px-12 py-4 text-sm hover:bg-white hover:text-black transition-colors"
            style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.35)', border: '3px solid white' }}
          >
            ENTER →
          </Link>
        </div>
      </div>
    </div>
  )
}
