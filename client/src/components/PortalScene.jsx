import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float } from '@react-three/drei';
import * as THREE from 'three';

function MultiColorRings() {
    const outerRef = useRef();
    const midRef = useRef();
    const innerRef = useRef();
    const core = useRef();

    useFrame((state, delta) => {
        outerRef.current.rotation.z -= delta * 0.3;
        outerRef.current.rotation.x -= delta * 0.1;
        midRef.current.rotation.z += delta * 0.5;
        midRef.current.rotation.y += delta * 0.15;
        innerRef.current.rotation.z -= delta * 0.8;
        innerRef.current.rotation.x += delta * 0.2;

        // Color cycle
        const t = state.clock.elapsedTime;
        const colors = [
            new THREE.Color(0.133, 0.827, 0.933), // cyan
            new THREE.Color(0.659, 0.333, 0.969), // purple
            new THREE.Color(0.925, 0.286, 0.600), // pink
        ];
        const idx = Math.floor(t * 0.5) % colors.length;
        const next = (idx + 1) % colors.length;
        const mixed = colors[idx].clone().lerp(colors[next], (t * 0.5) % 1);
        outerRef.current.material.color = mixed;
        outerRef.current.material.emissive = mixed;
    });

    return (
        <group>
            {/* Outer ring */}
            <mesh ref={outerRef} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[3.2, 0.05, 16, 100]} />
                <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={3} />
            </mesh>
            {/* Mid ring */}
            <mesh ref={midRef} rotation={[Math.PI / 2.5, 0.3, 0]}>
                <torusGeometry args={[2.5, 0.035, 16, 80]} />
                <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={3} transparent opacity={0.9} />
            </mesh>
            {/* Inner ring */}
            <mesh ref={innerRef} rotation={[Math.PI / 2, 0.5, Math.PI / 4]}>
                <torusGeometry args={[1.8, 0.04, 16, 60]} />
                <meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={4} transparent opacity={0.85} />
            </mesh>
            {/* Core sphere */}
            <Float speed={2} rotationIntensity={0.3} floatIntensity={0.8}>
                <mesh ref={core}>
                    <sphereGeometry args={[0.6, 32, 32]} />
                    <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={6} transparent opacity={0.9} />
                </mesh>
            </Float>

            <pointLight color="#22d3ee" intensity={4} distance={12} />
            <pointLight color="#a855f7" intensity={3} distance={10} position={[2, 0, 0]} />
        </group>
    );
}

export default function PortalScene({ status }) {
    return (
        <Canvas camera={{ position: [0, 0, 8], fov: 60 }} className="w-full h-full">
            <color attach="background" args={['#050709']} />
            <ambientLight intensity={0.2} />
            <MultiColorRings status={status} />
            <Stars radius={12} depth={30} count={800} factor={3} saturation={0.8} fade speed={0.8} />
        </Canvas>
    );
}
