'use client'
import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'

useGLTF.setDecoderPath('/draco/')

function Bottle() {
  const { scene } = useGLTF('/water_bottle.glb')
  const ref = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.y = state.clock.elapsedTime * 0.4
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.08
  })

  return <primitive ref={ref} object={scene} scale={2.2} position={[0, -0.5, 0]} />
}

export default function BottleScene() {
  return (
    <Canvas
      camera={{ position: [0, 0.5, 3.5], fov: 45 }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 5, 5]} intensity={2} />
      <directionalLight position={[-5, 2, -5]} intensity={1} color="#4fc3f7" />
      <pointLight position={[0, 3, 2]} intensity={1.5} />
      <Suspense fallback={null}>
        <Bottle />
        <ContactShadows position={[0, -1.4, 0]} opacity={0.3} scale={5} blur={2} />
      </Suspense>
    </Canvas>
  )
}

useGLTF.preload('/water_bottle.glb')
