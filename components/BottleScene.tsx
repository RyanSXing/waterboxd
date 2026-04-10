'use client'
import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Environment, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'

function Bottle() {
  const { scene } = useGLTF('/fiji_water_bottle.glb')
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
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />
      <directionalLight position={[-5, -2, -5]} intensity={0.4} color="#4fc3f7" />
      <Bottle />
      <ContactShadows position={[0, -1.4, 0]} opacity={0.3} scale={5} blur={2} />
      <Environment preset="city" />
    </Canvas>
  )
}

useGLTF.preload('/fiji_water_bottle.glb')
