'use client'
import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'

useGLTF.setDecoderPath('/draco/')

const mouse = { x: 0, y: 0 }

function Bottle() {
  const { scene } = useGLTF('/plastic_water_bottle.glb')
  const ref = useRef<THREE.Group>(null)
  const target = useRef({ x: 0, y: 0 })

  useFrame(() => {
    if (!ref.current) return
    target.current.y = mouse.x * Math.PI
    target.current.x = mouse.y * 0.4
    ref.current.rotation.y += (target.current.y - ref.current.rotation.y) * 0.08
    ref.current.rotation.x += (target.current.x - ref.current.rotation.x) * 0.08
    ref.current.position.y = Math.sin(Date.now() * 0.001) * 0.08
  })

  return <primitive ref={ref} object={scene} scale={0.5} position={[0, 0, 0]} />
}

export default function BottleScene() {
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      mouse.x = (e.clientX / window.innerWidth)  * 2 - 1
      mouse.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('mousemove', onMouseMove)
    return () => window.removeEventListener('mousemove', onMouseMove)
  }, [])

  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={1.5} />
      <directionalLight position={[5, 5, 5]} intensity={2.5} />
      <directionalLight position={[-5, 2, -5]} intensity={1} color="#4fc3f7" />
      <pointLight position={[0, 3, 2]} intensity={1.5} />
      <Suspense fallback={null}>
        <Bottle />
        <ContactShadows position={[0, -1.8, 0]} opacity={0.2} scale={3} blur={2} />
      </Suspense>
    </Canvas>
  )
}

useGLTF.preload('/plastic_water_bottle.glb')
