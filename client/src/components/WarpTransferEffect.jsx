import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';

/** Spiraling vortex particles during file transfer */
function VortexParticles({ progress = 0 }) {
    const ref = useRef();
    const count = 600;

    const [positions, colors, speeds] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const col = new Float32Array(count * 3);
        const spd = new Float32Array(count);
        const palette = [
            [0.133, 0.827, 0.933], // cyan
            [0.659, 0.333, 0.969], // purple
            [0.925, 0.286, 0.600], // pink
            [0.302, 0.871, 0.502], // green
        ];
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 * 8;
            const radius = 3 + Math.random() * 2;
            pos[i * 3] = Math.cos(angle) * radius;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 5;
            pos[i * 3 + 2] = Math.sin(angle) * radius;
            const c = palette[Math.floor(Math.random() * palette.length)];
            col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2];
            spd[i] = 0.5 + Math.random() * 1.5;
        }
        return [pos, col, spd];
    }, []);

    useFrame((state, delta) => {
        const p = ref.current.geometry.attributes.position;
        const t = state.clock.elapsedTime;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 * 8 + t * speeds[i] * 0.5;
            // Spiral inward as progress grows
            const radius = Math.max(0.2, 3 + Math.random() * 0.1 - (progress / 100) * 2.5);
            p.array[i * 3] = Math.cos(angle) * radius;
            p.array[i * 3 + 2] = Math.sin(angle) * radius;
            p.array[i * 3 + 1] += delta * speeds[i] * (progress > 50 ? -0.5 : 0.2);
            if (p.array[i * 3 + 1] > 3) p.array[i * 3 + 1] = -3;
            if (p.array[i * 3 + 1] < -3) p.array[i * 3 + 1] = 3;
        }
        p.needsUpdate = true;
        // Spin the whole group
        ref.current.rotation.y += delta * (0.5 + progress * 0.01);
    });

    return (
        <points ref={ref}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[positions, 3]} />
                <bufferAttribute attach="attributes-color" args={[colors, 3]} />
            </bufferGeometry>
            <pointsMaterial size={0.08} vertexColors transparent opacity={0.9} sizeAttenuation />
        </points>
    );
}

/** Central glowing ring that pulses during transfer */
function PulsingRing({ progress = 0 }) {
    const outerRef = useRef();
    const innerRef = useRef();

    useFrame((state, delta) => {
        outerRef.current.rotation.z -= delta * 1.2;
        innerRef.current.rotation.z += delta * 2;
        // Pulse scale
        const pulse = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.05;
        outerRef.current.scale.setScalar(pulse);
    });

    // Color cycles: cyan -> purple -> pink
    const cycle = (progress / 100);
    const r = Math.sin(cycle * Math.PI * 2) * 0.5 + 0.5;
    const ringColor = new THREE.Color(0.133 + r * 0.8, 0.827 - r * 0.5, 0.933 - r * 0.3);

    return (
        <group>
            {/* Outer ring */}
            <mesh ref={outerRef}>
                <torusGeometry args={[2.2, 0.06, 16, 100]} />
                <meshStandardMaterial color={ringColor} emissive={ringColor} emissiveIntensity={3} />
            </mesh>
            {/* Inner ring — different axis */}
            <mesh ref={innerRef} rotation={[Math.PI / 3, 0, 0]}>
                <torusGeometry args={[1.5, 0.04, 16, 80]} />
                <meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={4} />
            </mesh>
            {/* Core glow sphere */}
            <mesh>
                <sphereGeometry args={[0.4, 32, 32]} />
                <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={5} transparent opacity={0.8} />
            </mesh>
            <pointLight color={ringColor} intensity={6} distance={8} />
        </group>
    );
}

export default function WarpTransferEffect({ progress = 0, active = false }) {
    return (
        <AnimatePresence>
            {active && (
                <motion.div
                    className="fixed inset-0 z-50 flex flex-col items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    style={{ background: 'rgba(5,7,9,0.92)', backdropFilter: 'blur(8px)' }}
                >
                    {/* 3D Scene */}
                    <div className="w-full h-full absolute inset-0 pointer-events-none">
                        <Canvas camera={{ position: [0, 0, 7], fov: 55 }}>
                            <ambientLight intensity={0.2} />
                            <VortexParticles progress={progress} />
                            <PulsingRing progress={progress} />
                        </Canvas>
                    </div>

                    {/* HUD overlay */}
                    <div className="relative z-10 flex flex-col items-center gap-4 pointer-events-none select-none">
                        <p className="text-xs font-mono uppercase tracking-[0.3em] text-cyan-400/80 animate-pulse">
                            WARPING DATA
                        </p>
                        <div className="w-48 h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500"
                                initial={{ width: '0%' }}
                                animate={{ width: `${progress}%` }}
                                transition={{ ease: 'easeOut', duration: 0.3 }}
                            />
                        </div>
                        <p className="text-2xl font-black font-mono text-white tracking-widest tabular-nums">
                            {Math.round(progress)}%
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
