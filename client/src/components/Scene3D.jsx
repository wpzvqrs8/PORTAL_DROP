import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

/** Infinite neon cyber-grid floor */
function CyberGrid() {
    const gridRef = useRef();
    useFrame((state) => {
        // Slowly scroll the grid toward the camera for depth illusion
        gridRef.current.position.z = (state.clock.elapsedTime * 1.5) % 4;
    });
    return (
        <group ref={gridRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -4, 0]}>
            <gridHelper args={[80, 40, '#22d3ee', '#1e3a4a']} />
        </group>
    );
}

/** Floating data-stream particles — colored dots streaming upward */
function DataParticles() {
    const count = 800;
    const particlesRef = useRef();

    const [positions, colors] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const col = new Float32Array(count * 3);
        const palette = [
            [0.133, 0.827, 0.933], // cyan
            [0.659, 0.333, 0.969], // purple
            [0.925, 0.286, 0.600], // pink
            [0.302, 0.871, 0.502], // green
            [0.961, 0.620, 0.043], // amber
        ];
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 40;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
            const c = palette[Math.floor(Math.random() * palette.length)];
            col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2];
        }
        return [pos, col];
    }, []);

    useFrame((_, delta) => {
        const pos = particlesRef.current.geometry.attributes.position;
        for (let i = 0; i < count; i++) {
            pos.array[i * 3 + 1] += delta * (0.3 + Math.random() * 0.2);
            if (pos.array[i * 3 + 1] > 12) pos.array[i * 3 + 1] = -12;
        }
        pos.needsUpdate = true;
    });

    return (
        <points ref={particlesRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[positions, 3]} />
                <bufferAttribute attach="attributes-color" args={[colors, 3]} />
            </bufferGeometry>
            <pointsMaterial size={0.07} vertexColors transparent opacity={0.85} sizeAttenuation />
        </points>
    );
}

/** Ambient glow blobs — colored light sources slowly drifting */
function GlowBlobs() {
    const blobsRef = useRef([]);
    const blobs = useMemo(() => [
        { color: '#22d3ee', pos: [-6, 2, -8], speed: 0.3 },
        { color: '#a855f7', pos: [6, -1, -10], speed: 0.2 },
        { color: '#ec4899', pos: [0, 3, -12], speed: 0.25 },
    ], []);

    useFrame((state) => {
        blobs.forEach((b, i) => {
            if (blobsRef.current[i]) {
                blobsRef.current[i].position.y = b.pos[1] + Math.sin(state.clock.elapsedTime * b.speed) * 1.5;
                blobsRef.current[i].position.x = b.pos[0] + Math.cos(state.clock.elapsedTime * b.speed * 0.5) * 1;
            }
        });
    });

    return (
        <>
            {blobs.map((b, i) => (
                <pointLight
                    key={i}
                    ref={(el) => (blobsRef.current[i] = el)}
                    color={b.color}
                    intensity={3}
                    distance={20}
                    position={b.pos}
                />
            ))}
        </>
    );
}

export default function Scene3D() {
    return (
        <div className="fixed inset-0 z-0 pointer-events-none" style={{ background: '#050709' }}>
            <Canvas
                camera={{ position: [0, 2, 10], fov: 60 }}
                frameloop="always"
                gl={{ antialias: true, alpha: false }}
            >
                <color attach="background" args={['#050709']} />
                <ambientLight intensity={0.15} />
                <GlowBlobs />
                <CyberGrid />
                <DataParticles />
                <Stars radius={60} depth={30} count={1500} factor={2} saturation={0.5} fade speed={0.5} />
            </Canvas>
        </div>
    );
}
