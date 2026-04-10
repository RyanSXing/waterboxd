'use client'
import { useEffect, useRef } from 'react'

// Shared vertex shader — positions fullscreen quad
const VERT = `#version 300 es
layout(location = 0) in vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0, 1); }
`

// Buffer A: wave simulation (ping-pong)
// x=pressure, y=pressure velocity, z=x gradient, w=y gradient
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

  float p_right = texelFetch(u_prev, px + ivec2( 1,  0), 0).x;
  float p_left  = texelFetch(u_prev, px + ivec2(-1,  0), 0).x;
  float p_up    = texelFetch(u_prev, px + ivec2( 0,  1), 0).x;
  float p_down  = texelFetch(u_prev, px + ivec2( 0, -1), 0).x;

  if (px.x == 0)                  p_left  = p_right;
  if (px.x == int(u_res.x) - 1)  p_right = p_left;
  if (px.y == 0)                  p_down  = p_up;
  if (px.y == int(u_res.y) - 1)  p_up    = p_down;

  pVel += delta * (-2.0 * pressure + p_right + p_left) / 4.0;
  pVel += delta * (-2.0 * pressure + p_up + p_down) / 4.0;
  pressure += delta * pVel;
  pVel -= 0.005 * delta * pressure;
  pVel *= 1.0 - 0.002 * delta;
  pressure *= 0.999;

  fragColor = vec4(pressure, pVel, (p_right - p_left) / 2.0, (p_up - p_down) / 2.0);

  // Always emit ripples at mouse position (no click required)
  if (u_mouse.z > 0.0) {
    float dist = distance(gl_FragCoord.xy, u_mouse.xy);
    if (dist <= 20.0) {
      fragColor.x += (1.0 - dist / 20.0) * 0.4;
    }
  }
}
`

// Image pass: render wave as dark water with light reflections
const RENDER_FRAG = `#version 300 es
precision highp float;
uniform sampler2D u_sim;
uniform vec2 u_res;
out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec4 data = texture(u_sim, uv);

  vec3 color = vec3(0.0);

  vec3 normal   = normalize(vec3(-data.z, 0.5, -data.w));
  vec3 lightDir = normalize(vec3(-3.0, 10.0, 3.0));

  // Subtle diffuse water tint
  float diff = max(0.0, dot(normal, lightDir));
  color += vec3(0.0, 0.06, 0.15) * diff * 0.25;

  // Specular glint (blue-white, like light on water at night)
  float spec = pow(max(0.0, dot(normal, lightDir)), 60.0);
  color += vec3(0.35, 0.65, 1.0) * spec;

  // Pressure glow
  color += vec3(0.0, 0.04, 0.1) * max(0.0, data.x) * 0.4;

  fragColor = vec4(color, 1.0);
}
`

export default function WaterShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const gl = canvas.getContext('webgl2')
    if (!gl) return

    if (!gl.getExtension('EXT_color_buffer_float')) {
      console.warn('EXT_color_buffer_float not supported — water shader disabled')
      return
    }

    let animId: number
    let w = 0, h = 0
    let textures: [WebGLTexture, WebGLTexture] | null = null
    let fbos: [WebGLFramebuffer, WebGLFramebuffer] | null = null
    let frame = 0
    const mouse = { x: 0, y: 0, down: false }

    // --- GL helpers ---
    function compileShader(type: number, src: string) {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        console.error('Shader error:', gl.getShaderInfoLog(s))
      return s
    }

    function makeProgram(frag: string) {
      const p = gl.createProgram()!
      gl.attachShader(p, compileShader(gl.VERTEX_SHADER, VERT))
      gl.attachShader(p, compileShader(gl.FRAGMENT_SHADER, frag))
      gl.linkProgram(p)
      if (!gl.getProgramParameter(p, gl.LINK_STATUS))
        console.error('Program error:', gl.getProgramInfoLog(p))
      return p
    }

    function makeFloatTexture(tw: number, th: number) {
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

    // Fullscreen quad VAO (shared — layout(location=0) in both shaders)
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

    // Cache uniform locations
    const simUniforms = {
      prev:  gl.getUniformLocation(simProg, 'u_prev'),
      res:   gl.getUniformLocation(simProg, 'u_res'),
      mouse: gl.getUniformLocation(simProg, 'u_mouse'),
      frame: gl.getUniformLocation(simProg, 'u_frame'),
    }
    const renderUniforms = {
      sim: gl.getUniformLocation(renderProg, 'u_sim'),
      res: gl.getUniformLocation(renderProg, 'u_res'),
    }

    function allocate(newW: number, newH: number) {
      if (textures) { gl.deleteTexture(textures[0]); gl.deleteTexture(textures[1]) }
      if (fbos)     { gl.deleteFramebuffer(fbos[0]); gl.deleteFramebuffer(fbos[1]) }
      w = newW; h = newH
      canvas.width = w; canvas.height = h
      textures = [makeFloatTexture(w, h), makeFloatTexture(w, h)]
      fbos     = [makeFBO(textures[0]),   makeFBO(textures[1])]
      frame    = 0
    }

    function draw() {
      if (!textures || !fbos) return

      const read  = frame & 1
      const write = 1 - read

      // Simulation pass → write FBO
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbos[write])
      gl.viewport(0, 0, w, h)
      gl.useProgram(simProg)
      gl.bindVertexArray(vao)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, textures[read])
      gl.uniform1i(simUniforms.prev, 0)
      gl.uniform2f(simUniforms.res, w, h)
      gl.uniform1i(simUniforms.frame, frame)
      gl.uniform4f(simUniforms.mouse, mouse.x, mouse.y, mouse.down ? 1.0 : 0.0, 0.0)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

      // Render pass → screen
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, w, h)
      gl.useProgram(renderProg)
      gl.bindVertexArray(vao)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, textures[write])
      gl.uniform1i(renderUniforms.sim, 0)
      gl.uniform2f(renderUniforms.res, w, h)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

      frame++
      animId = requestAnimationFrame(draw)
    }

    // Input — use window so events fire even through overlaid elements
    function getPos(clientX: number, clientY: number) {
      const rect = canvas.getBoundingClientRect()
      mouse.x = (clientX - rect.left) * (w / rect.width)
      mouse.y = h - (clientY - rect.top) * (h / rect.height) // flip Y for WebGL
    }

    function onMouseMove(e: MouseEvent)  { getPos(e.clientX, e.clientY); mouse.down = true }
    function onMouseLeave()              { mouse.down = false }
    function onTouchMove(e: TouchEvent)  {
      e.preventDefault()
      const t = e.touches[0]
      getPos(t.clientX, t.clientY)
      mouse.down = true
    }
    function onTouchEnd()  { mouse.down = false }

    function onResize() { allocate(window.innerWidth, window.innerHeight) }

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
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
    />
  )
}
