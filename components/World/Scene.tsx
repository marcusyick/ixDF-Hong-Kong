import React, { useRef, useEffect, useMemo, useState } from 'react';
import { Text, Float, useHelper, MeshDistortMaterial, Sparkles, useTexture, Html } from '@react-three/drei';
import { useFrame, ThreeElements } from '@react-three/fiber';
import { PointLightHelper, Mesh, DoubleSide, Vector3 } from 'three';
import * as THREE from 'three';
import { Collider } from '../../types';

const Firework: React.FC<{ color: string, onComplete: () => void }> = ({ color, onComplete }) => {
    const rocketRef = useRef<THREE.Mesh>(null);
    const [exploding, setExploding] = useState(false);
    const particlesRef = useRef<THREE.Points>(null);
    
    // Initial rocket velocity - Reduced to 6-7 range for lower altitude
    const velocity = useRef(new THREE.Vector3(0, 6 + Math.random(), 0));
    const explodedTime = useRef(0);
    const explosionPos = useRef(new THREE.Vector3(0, 0, 0));

    // Particle data
    const particleCount = 500;
    const [positions] = useState(() => new Float32Array(particleCount * 3));
    const [velocities] = useState(() => {
        const arr = [];
        for(let i=0; i<particleCount; i++) {
            // Uniform spherical distribution for "globe" shape
            const u = Math.random();
            const v = Math.random();
            const theta = 2 * Math.PI * u;
            const phi = Math.acos(2 * v - 1);
            
            // Significantly increased explosion speed for bigger range (8-12 range)
            const speed = 8 + Math.random() * 4; 
            
            arr.push({
                x: speed * Math.sin(phi) * Math.cos(theta),
                y: speed * Math.sin(phi) * Math.sin(theta),
                z: speed * Math.cos(phi)
            });
        }
        return arr;
    });

    useFrame((state, delta) => {
        if (!exploding) {
            if (rocketRef.current) {
                rocketRef.current.position.add(velocity.current.clone().multiplyScalar(delta));
                // Reduced gravity to 3 for floatier ascent
                velocity.current.y -= 3 * delta; 
                
                if (velocity.current.y <= 0) {
                    // Capture position before removing rocket mesh
                    explosionPos.current.copy(rocketRef.current.position);
                    setExploding(true);
                    explodedTime.current = state.clock.elapsedTime;
                }
            }
        } else {
             if (particlesRef.current) {
                 const elapsed = state.clock.elapsedTime - explodedTime.current;
                 if (elapsed > 2.5) {
                     onComplete();
                     return;
                 }

                 const positionsAttr = particlesRef.current.geometry.attributes.position;
                 
                 for(let i=0; i<particleCount; i++) {
                     const vx = velocities[i].x;
                     const vy = velocities[i].y;
                     const vz = velocities[i].z;
                     
                     // Reduced air drag (from 1.5 to 0.8) to allow larger expansion
                     const drag = Math.exp(-0.8 * elapsed); 
                     
                     const cx = vx * elapsed * drag;
                     // Gravity on particles (lighter than rocket)
                     const cy = (vy * elapsed * drag) - (2 * elapsed * elapsed); 
                     const cz = vz * elapsed * drag;

                     positionsAttr.setXYZ(i, cx, cy, cz);
                 }
                 positionsAttr.needsUpdate = true;
                 
                 const mat = particlesRef.current.material as THREE.PointsMaterial;
                 // Fade out
                 mat.opacity = Math.max(0, 1 - (elapsed / 2.5));
                 // Shrink slightly over time
                 mat.size = Math.max(0.01, 0.25 * (1 - elapsed * 0.3));
             }
        }
    });
    
    if (exploding) {
        return (
             <points ref={particlesRef} position={explosionPos.current}>
                 <bufferGeometry>
                     <bufferAttribute 
                        attach="attributes-position" 
                        count={particleCount} 
                        array={positions} 
                        itemSize={3} 
                    />
                 </bufferGeometry>
                 <pointsMaterial 
                    size={0.2} 
                    color={color} 
                    transparent 
                    depthWrite={false} 
                    blending={THREE.AdditiveBlending} 
                />
             </points>
        )
    }

    return (
        <mesh ref={rocketRef} position={[0, 0, 0]}>
            <sphereGeometry args={[0.1]} />
            <meshBasicMaterial color={color} />
            <mesh position={[0, -0.2, 0]}>
                 <cylinderGeometry args={[0.05, 0.05, 0.4]} />
                 <meshBasicMaterial color="white" />
            </mesh>
            <pointLight color={color} intensity={2} distance={5} />
        </mesh>
    );
}

const FireworkLauncher: React.FC<{ position: [number, number, number], playerPos?: React.MutableRefObject<THREE.Vector3> }> = ({ position, playerPos }) => {
    const [fireworks, setFireworks] = useState<{id: number, color: string}[]>([]);
    const [showPrompt, setShowPrompt] = useState(false);
    
    useFrame(() => {
        if (playerPos?.current) {
             const dist = new THREE.Vector3(...position).distanceTo(playerPos.current);
             setShowPrompt(dist < 3.5);
        }
    });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.key === 'e' || e.key === 'E') && showPrompt) {
                const colors = ['#ef4444', '#3b82f6', '#eab308', '#a855f7', '#ec4899', '#22c55e'];
                const randomColor = colors[Math.floor(Math.random() * colors.length)];
                setFireworks(prev => [...prev, { id: Date.now() + Math.random(), color: randomColor }]);
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showPrompt]);

    const removeFirework = (id: number) => {
        setFireworks(prev => prev.filter(fw => fw.id !== id));
    }

    return (
        <group position={position}>
            {/* Launcher Base */}
            <mesh position={[0, 0.1, 0]}>
                <boxGeometry args={[0.6, 0.2, 0.6]} />
                <meshStandardMaterial color="#334155" />
            </mesh>
            {/* Launcher Tube */}
            <mesh position={[0, 0.5, 0]}>
                <cylinderGeometry args={[0.2, 0.2, 0.8]} />
                <meshStandardMaterial color="#94a3b8" />
            </mesh>
            <mesh position={[0, 0.5, 0]}>
                 <cylinderGeometry args={[0.15, 0.15, 0.81]} />
                 <meshStandardMaterial color="#0f172a" />
            </mesh>
            <mesh position={[0, 0.5, 0]}>
                <cylinderGeometry args={[0.21, 0.21, 0.2]} />
                <meshStandardMaterial color="#ef4444" />
            </mesh>
            
            {/* Interaction Prompt */}
            {showPrompt && (
                <Html position={[0, 1.8, 0]} center>
                    <div className="flex flex-col items-center animate-bounce">
                        <div className="bg-black/70 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-sm font-bold border border-white/20 shadow-lg whitespace-nowrap flex items-center gap-2">
                            <span className="bg-white text-black w-5 h-5 rounded flex items-center justify-center text-xs font-extrabold">E</span>
                            Launch Fireworks
                        </div>
                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-black/70 mt-1"></div>
                    </div>
                </Html>
            )}

            {fireworks.map(fw => (
                <Firework key={fw.id} color={fw.color} onComplete={() => removeFirework(fw.id)} />
            ))}
        </group>
    )
}

const Flag: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    const flagRef = useRef<Mesh>(null);
    // Stable Wikimedia URL for HK Flag
    const texture = useTexture('https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Flag_of_Hong_Kong.svg/640px-Flag_of_Hong_Kong.svg.png');

    useFrame((state) => {
        if (!flagRef.current) return;
        const t = state.clock.elapsedTime;
        
        // Access the position attribute to manipulate vertices
        const posAttribute = flagRef.current.geometry.attributes.position;
        
        for(let i=0; i<posAttribute.count; i++){
            const x = posAttribute.getX(i);
            // Pin the left side (near the pole) by only moving vertices where x > 0
            // Simple sine wave that moves along X over time
            if(x > 0) {
                const wave = Math.sin(x * 3 - t * 4) * (x * 0.2);
                posAttribute.setZ(i, wave);
            }
        }
        posAttribute.needsUpdate = true;
        // Re-calculate normals for correct lighting on the wavy surface
        flagRef.current.geometry.computeVertexNormals();
    });

    return (
        <group position={position}>
            {/* Pole */}
            <mesh position={[0, 1.5, 0]}>
                <cylinderGeometry args={[0.04, 0.04, 3]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Flag Mesh - High segments for smooth waving */}
            <mesh ref={flagRef} position={[0.6, 2.5, 0]}>
                <planeGeometry args={[1.2, 0.8, 15, 10]} />
                <meshStandardMaterial map={texture} side={DoubleSide} roughness={0.4} />
            </mesh>
        </group>
    )
}

const GoalPost: React.FC<{ position: [number, number, number], rotation?: [number, number, number] }> = ({ position, rotation = [0, 0, 0] }) => (
    <group position={position} rotation={rotation as any}>
        {/* Posts */}
        <mesh position={[-2, 1, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 2]} />
            <meshStandardMaterial color="white" />
        </mesh>
        <mesh position={[2, 1, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 2]} />
            <meshStandardMaterial color="white" />
        </mesh>
        {/* Crossbar */}
        <mesh position={[0, 2, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.05, 0.05, 4]} />
            <meshStandardMaterial color="white" />
        </mesh>
        {/* Net (Simplified) */}
        <mesh position={[0, 1, -0.5]} rotation={[0.5, 0, 0]}>
            <planeGeometry args={[4, 2.5]} />
            <meshBasicMaterial color="#e2e8f0" wireframe transparent opacity={0.3} side={DoubleSide} />
        </mesh>
    </group>
);

const FootballField: React.FC<{ position: [number, number, number] }> = ({ position }) => (
    <group position={position}>
        {/* Turf */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow userData={{ walkable: true }}>
            <planeGeometry args={[20, 30]} />
            <meshStandardMaterial color="#4ade80" />
        </mesh>
        
        {/* Lines (White) */}
        {/* Borders */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} userData={{ walkable: true }}>
            <planeGeometry args={[18, 28]} />
             <meshBasicMaterial color="white" wireframe />
        </mesh>
        {/* Center Line */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} userData={{ walkable: true }}>
             <planeGeometry args={[18, 0.1]} />
             <meshBasicMaterial color="white" />
        </mesh>
         {/* Center Circle */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} userData={{ walkable: true }}>
            <ringGeometry args={[2, 2.1, 32]} />
            <meshBasicMaterial color="white" />
        </mesh>

        {/* Goals */}
        <GoalPost position={[0, 0, -14]} />
        <GoalPost position={[0, 0, 14]} rotation={[0, Math.PI, 0]} />
    </group>
);

const Tree: React.FC<{ position: [number, number, number], color?: string, scale?: number }> = ({ position, color = "#22c55e", scale = 1 }) => (
  <group position={position} scale={scale}>
    <mesh position={[0, 0.5, 0]}>
      <cylinderGeometry args={[0.2, 0.4, 1, 8]} />
      <meshStandardMaterial color="#78350f" />
    </mesh>
    <mesh position={[0, 1.5, 0]}>
      <coneGeometry args={[1, 2, 8]} />
      <meshStandardMaterial color={color} />
    </mesh>
    <mesh position={[0, 2.5, 0]}>
      <coneGeometry args={[0.8, 1.5, 8]} />
      <meshStandardMaterial color={color} />
    </mesh>
  </group>
);

const Rock: React.FC<{ position: [number, number, number], scale?: number }> = ({ position, scale = 1 }) => {
  // Use useMemo to keep rotation stable across re-renders
  const rotation = useMemo(() => [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI] as [number, number, number], []);
  
  return (
      <mesh position={position} scale={scale} rotation={rotation}>
        <dodecahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color="#94a3b8" flatShading />
      </mesh>
  );
}

const Mountain: React.FC<{ position: [number, number, number] }> = ({ position }) => (
  <group position={position}>
    <mesh position={[0, 5, 0]} userData={{ walkable: true }}>
        <coneGeometry args={[8, 12, 4]} />
        <meshStandardMaterial color="#64748b" flatShading />
    </mesh>
    <mesh position={[0, 9, 0]} userData={{ walkable: true }}>
        <coneGeometry args={[3, 4, 4]} />
        <meshStandardMaterial color="white" flatShading />
    </mesh>
  </group>
);

const WoodenHouse: React.FC<{ position: [number, number, number], rotation?: [number, number, number] }> = ({ position, rotation = [0, 0, 0] }) => (
  <group position={position} rotation={rotation as any}>
    {/* Base / Deck */}
    <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[5, 0.4, 5]} />
        <meshStandardMaterial color="#78350f" />
    </mesh>
    {/* Steps */}
    <mesh position={[0, 0.1, 2.7]} userData={{ walkable: true }}>
        <boxGeometry args={[2, 0.2, 0.4]} />
        <meshStandardMaterial color="#78350f" />
    </mesh>

    {/* Walls */}
    <mesh position={[0, 1.7, 0]}>
        <boxGeometry args={[4.5, 3, 4.5]} />
        <meshStandardMaterial color="#b45309" />
    </mesh>
    
    {/* Roof */}
    <mesh position={[0, 4, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[4.5, 2.5, 4]} />
        <meshStandardMaterial color="#581c87" />
    </mesh>
    
    {/* Door Frame */}
    <mesh position={[0, 1.2, 2.26]}>
        <boxGeometry args={[1.4, 2.2, 0.1]} />
        <meshStandardMaterial color="#451a03" />
    </mesh>
    {/* Door */}
    <mesh position={[0, 1.2, 2.3]}>
        <boxGeometry args={[1.2, 2, 0.1]} />
        <meshStandardMaterial color="#713f12" />
    </mesh>
    
    {/* Window Round */}
    <mesh position={[1.5, 2, 2.3]} rotation={[Math.PI/2, 0, 0]}>
         <cylinderGeometry args={[0.5, 0.5, 0.1, 16]} />
         <meshStandardMaterial color="#bae6fd" emissive="#7dd3fc" emissiveIntensity={0.2} />
    </mesh>
    
    {/* Side Window */}
    <mesh position={[-2.26, 2, 0]} rotation={[0, Math.PI/2, 0]}>
         <boxGeometry args={[1.5, 1, 0.1]} />
         <meshStandardMaterial color="#bae6fd" />
    </mesh>
  </group>
);

// Deterministic random for rocks to prevent re-rendering jitter
const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
};

// Generate rock data once
const RIVER_ROCKS = Array.from({ length: 40 }).map((_, i) => {
    // Use deterministic values based on index i
    const r1 = seededRandom(i * 12.34);
    const r2 = seededRandom(i * 45.67);
    const r3 = seededRandom(i * 89.01);
    
    const x = -60 + i * 3.5 + r1 * 2;
    return {
        key: i,
        pos1: [x, 0, -7 + r2 * 0.5] as [number, number, number],
        scale1: 0.8 + r2,
        pos2: [x, 0, 7 - r3 * 0.5] as [number, number, number],
        scale2: 0.8 + r3
    };
});

const River: React.FC = () => (
    <group position={[0, 0.1, -14]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow userData={{ walkable: true }}>
            {/* High segment count for smooth waves */}
            <planeGeometry args={[120, 15, 64, 64]} />
            <MeshDistortMaterial
                color="#0ea5e9"
                speed={2}
                distort={0.25}
                radius={1}
                roughness={0.2}
                metalness={0.4}
            />
        </mesh>
        
        {/* River Banks (Stable Rocks) */}
        {RIVER_ROCKS.map((rock) => (
            <group key={rock.key}>
                    <Rock position={rock.pos1} scale={rock.scale1} />
                    <Rock position={rock.pos2} scale={rock.scale2} />
            </group>
        ))}
    </group>
)

const Campfire: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    const fireRef = useRef<Mesh>(null);
    
    useFrame((state) => {
        if(fireRef.current) {
            fireRef.current.scale.y = 1 + Math.sin(state.clock.elapsedTime * 10) * 0.2;
            fireRef.current.rotation.y += 0.1;
        }
    });

    return (
        <group position={position}>
            {/* Logs */}
            <mesh position={[0.3, 0.1, 0]} rotation={[0, 0, 1]}>
                <cylinderGeometry args={[0.08, 0.08, 0.8]} />
                <meshStandardMaterial color="#78350f" />
            </mesh>
            <mesh position={[-0.3, 0.1, 0]} rotation={[0, 0, -1]}>
                <cylinderGeometry args={[0.08, 0.08, 0.8]} />
                <meshStandardMaterial color="#78350f" />
            </mesh>
            <mesh position={[0, 0.1, 0.3]} rotation={[1, 0, 0]}>
                <cylinderGeometry args={[0.08, 0.08, 0.8]} />
                <meshStandardMaterial color="#78350f" />
            </mesh>
            {/* Fire */}
            <mesh ref={fireRef} position={[0, 0.4, 0]}>
                <coneGeometry args={[0.3, 0.6, 6]} />
                <meshStandardMaterial color="orange" emissive="orange" emissiveIntensity={2} />
            </mesh>
            <pointLight position={[0, 0.5, 0]} color="orange" intensity={3} distance={5} decay={2} />
        </group>
    );
};

const Whiteboard: React.FC<{ position: [number, number, number], rotation?: [number, number, number] }> = ({ position, rotation = [0, 0, 0] }) => (
  <group position={position} rotation={rotation as any}>
    {/* Stand/Legs - Widened */}
    <mesh position={[-1.8, 1.2, 0]}>
       <cylinderGeometry args={[0.04, 0.04, 2.4]} />
       <meshStandardMaterial color="#64748b" metalness={0.6} />
    </mesh>
    <mesh position={[1.8, 1.2, 0]}>
       <cylinderGeometry args={[0.04, 0.04, 2.4]} />
       <meshStandardMaterial color="#64748b" metalness={0.6} />
    </mesh>
    {/* Cross bar at bottom */}
    <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[4, 0.05, 0.05]} />
        <meshStandardMaterial color="#64748b" />
    </mesh>

    {/* Board Frame - Bigger */}
    <mesh position={[0, 2.2, 0]}>
      <boxGeometry args={[4.2, 2.5, 0.1]} />
      <meshStandardMaterial color="#94a3b8" />
    </mesh>
    
    {/* Board Surface */}
    <mesh position={[0, 2.2, 0.06]}>
      <planeGeometry args={[4, 2.3]} />
      <meshStandardMaterial color="white" roughness={0.2} />
    </mesh>

    {/* Content Group */}
    <group position={[0, 2.2, 0.07]}>
        {/* Replaced Image with Text to prevent loading errors */}
        <Text 
            position={[0, 0.5, 0]} 
            fontSize={0.6} 
            color="#0f172a" 
            fontWeight="bold" 
            anchorX="center" 
            anchorY="middle"
        >
            IxDF
        </Text>

        {/* Text Content - Shifted down */}
        <Text
            position={[0, -0.2, 0]}
            fontSize={0.18}
            color="#64748b"
            anchorX="center"
            anchorY="middle"
        >
            Welcome to the
        </Text>
        <Text
            position={[0, -0.5, 0]}
            fontSize={0.3}
            color="#0f172a"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
        >
            IxDF Hong Kong
        </Text>
        <Text
            position={[0, -0.85, 0]}
            fontSize={0.22}
            color="#334155"
            anchorX="center"
            anchorY="middle"
        >
            Design Community
        </Text>
    </group>
  </group>
);

const AgendaBoard: React.FC<{ position: [number, number, number], rotation?: [number, number, number] }> = ({ position, rotation = [0, 0, 0] }) => (
  <group position={position} rotation={rotation as any}>
    {/* Stand/Legs */}
    <mesh position={[-2, 1.2, 0]}>
       <cylinderGeometry args={[0.04, 0.04, 2.4]} />
       <meshStandardMaterial color="#64748b" metalness={0.6} />
    </mesh>
    <mesh position={[2, 1.2, 0]}>
       <cylinderGeometry args={[0.04, 0.04, 2.4]} />
       <meshStandardMaterial color="#64748b" metalness={0.6} />
    </mesh>
    <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[4.4, 0.05, 0.05]} />
        <meshStandardMaterial color="#64748b" />
    </mesh>

    {/* Board Frame */}
    <mesh position={[0, 2.2, 0]}>
      <boxGeometry args={[4.6, 3.2, 0.1]} />
      <meshStandardMaterial color="#94a3b8" />
    </mesh>
    
    {/* Board Surface */}
    <mesh position={[0, 2.2, 0.06]}>
      <planeGeometry args={[4.4, 3]} />
      <meshStandardMaterial color="white" roughness={0.2} />
    </mesh>

    {/* Content Group */}
    <group position={[0, 2.2, 0.07]}>
        <Text 
            position={[-0.9, 1.2, 0]} 
            fontSize={0.25} 
            color="#0f172a" 
            fontWeight="bold" 
            anchorX="center" 
            anchorY="top"
        >
            Agenda Today!
        </Text>
        <Text 
            position={[-1.9, 0.85, 0]} 
            fontSize={0.16} 
            color="#334155" 
            anchorX="left" 
            anchorY="top"
            maxWidth={3.8}
            lineHeight={1.4}
        >
            • Introduce yourself{'\n'}
            • Play some football{'\n'}
            • Collect coin{'\n'}
            • Meet new designers
        </Text>

        <Text 
            position={[-0.7, -0.2, 0]} 
            fontSize={0.25} 
            color="#0f172a" 
            fontWeight="bold" 
            anchorX="center" 
            anchorY="top"
        >
            Topic suggestions:
        </Text>
        <Text 
            position={[-1.9, -0.55, 0]} 
            fontSize={0.14} 
            color="#334155" 
            anchorX="left" 
            anchorY="top"
            maxWidth={4.0}
            lineHeight={1.5}
        >
            • Why are you here?{'\n'}
            • How do you think the community can help each other?{'\n'}
            • Do you use AI in design? What tools have you been using?
        </Text>
    </group>
  </group>
);

const PlaygroundStructure: React.FC<{ position: [number, number, number] }> = ({ position }) => (
  <group position={position}>
    {/* Simple Slide or Structure */}
    <mesh position={[-1, 1, 0]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[0.2, 3, 1]} />
        <meshStandardMaterial color="#f472b6" />
    </mesh>
    <mesh position={[1, 1.5, 0]}>
        <boxGeometry args={[2, 0.2, 2]} />
        <meshStandardMaterial color="#60a5fa" />
    </mesh>
    <mesh position={[1, 0.75, 0.9]}>
        <cylinderGeometry args={[0.1, 0.1, 1.5]} />
        <meshStandardMaterial color="#60a5fa" />
    </mesh>
    <mesh position={[1, 0.75, -0.9]}>
        <cylinderGeometry args={[0.1, 0.1, 1.5]} />
        <meshStandardMaterial color="#60a5fa" />
    </mesh>
     <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 1.5]} />
        <meshStandardMaterial color="#60a5fa" />
    </mesh>
  </group>
);

const TableSet: React.FC<{ position: [number, number, number] }> = ({ position }) => (
  <group position={position}>
      {/* Table */}
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 0.05, 32]} />
        <meshStandardMaterial color="#a05a2c" />
      </mesh>
      <mesh position={[0, 0.17, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.35]} />
        <meshStandardMaterial color="#5D4037" />
      </mesh>
      
      {/* Chair 1 */}
      <mesh position={[1, 0.2, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.05]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>
      <mesh position={[1, 0.1, 0]}>
         <cylinderGeometry args={[0.05, 0.05, 0.2]} />
         <meshStandardMaterial color="#5D4037" />
      </mesh>

       {/* Chair 2 */}
      <mesh position={[-1, 0.2, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.05]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>
      <mesh position={[-1, 0.1, 0]}>
         <cylinderGeometry args={[0.05, 0.05, 0.2]} />
         <meshStandardMaterial color="#5D4037" />
      </mesh>
  </group>
);

// --- Data Generation for Physics ---
// Use stable data so we can map collisions
const TREE_COUNT = 80; // Decreased density as requested
const BORDER_TREES = Array.from({ length: TREE_COUNT }).map((_, i) => {
    // Use deterministic random numbers based on index 'i'
    const r1 = seededRandom(i * 100 + 33); // For angle
    const r2 = seededRandom(i * 200 + 44); // For radius
    const r3 = seededRandom(i * 300 + 55); // For scale

    // Distribute trees more randomly over a larger area
    const angle = r1 * Math.PI * 2;
    // Radius range from inner circle to outer bounds
    const radius = 15 + r2 * 45; 
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    return { position: [x, 0, z] as [number, number, number], scale: 0.8 + r3 * 0.8 };
}).filter(t => {
    const x = t.position[0];
    const z = t.position[2];
    
    // 1. Exclude Center Plaza (radius ~10)
    if (Math.abs(x) < 10 && Math.abs(z) < 10) return false;

    // 2. Exclude Football Field area (Field is at [25, 0, 20] with size roughly 20x30)
    // Expanded exclusion zone to ensure no trees are nearby
    if (x > 8 && x < 45 && z > -5 && z < 50) return false;

    // 3. Exclude River Area (River is at Z ~ -14, width ~15)
    // Keep area clear between Z -22 and -6
    if (z > -22 && z < -6) return false;

    // 4. Exclude Wooden House Area (around [45, 0, 20])
    const dx = x - 45;
    const dz = z - 20;
    if (dx*dx + dz*dz < 225) return false; // radius 15 clearance

    return true;
});

const INNER_TREES = [
    { position: [6, 0, 6] as [number, number, number], scale: 0.8 },
    { position: [-6, 0, 8] as [number, number, number], scale: 0.9 },
    { position: [8, 0, -8] as [number, number, number], scale: 1.1 },
    { position: [-12, 0, 5] as [number, number, number], scale: 1.2 },
    { position: [-3, 0, -3] as [number, number, number], scale: 1, color: "#fca5a5" },
    { position: [-4, 0, 2] as [number, number, number], scale: 1, color: "#fca5a5" },
];

const ROCKS = [
    { position: [-8, 0.2, 1] as [number, number, number], scale: 1.5 },
    { position: [-11, 0.2, -2] as [number, number, number], scale: 1.2 },
    { position: [-12, 0.2, 1.5] as [number, number, number], scale: 0.8 },
];

interface SceneProps {
    setColliders?: (colliders: Collider[]) => void;
    playerPosRef?: React.MutableRefObject<THREE.Vector3>;
}

const Scene: React.FC<SceneProps> = ({ setColliders, playerPosRef }) => {
  
  useEffect(() => {
    if (!setColliders) return;

    const colliders: Collider[] = [];
    
    // Add trees (trunk radius approx 0.4)
    BORDER_TREES.forEach(t => colliders.push({ position: t.position, radius: 0.6 }));
    INNER_TREES.forEach(t => colliders.push({ position: t.position, radius: 0.6 }));
    
    // Add Wooden House Collider
    colliders.push({ position: [45, 0, 20], radius: 3.5 });

    setColliders(colliders);
  }, [setColliders]);

  return (
    <group>
      {/* Magical Atmosphere */}
      <Sparkles count={50} scale={35} size={6} speed={0.4} opacity={0.6} color="#fff" />

      {/* Lighting - Bright & Creamy */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 20, 10]} intensity={1.2} color="#fff7ed" castShadow />
      <pointLight position={[-10, 5, -10]} intensity={0.8} color="#a78bfa" />

      {/* Ground - Soft Pastel Green */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow userData={{ walkable: true }}>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#dcfce7" />
      </mesh>

      {/* River */}
      <River />

      {/* Mountains - pushed back */}
      <Mountain position={[-20, 0, -30]} />
      <Mountain position={[0, 0, -35]} />
      <Mountain position={[25, 0, -28]} />

      {/* --- SECTION 1: The Plaza (Central) --- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} userData={{ walkable: true }}>
        <circleGeometry args={[5, 32]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
      
      {/* Whiteboard Signage */}
      <Whiteboard position={[0, 0, -4]} />
      
      {/* New Agenda Board - Moved to Left */}
      <AgendaBoard position={[-4.5, 0, -3]} rotation={[0, 0.5, 0]} />

      {/* Hong Kong Flag - Moved to Right */}
      <Flag position={[3, 0, -4]} />
      
      {/* Campfire Area */}
      <group position={[0, 0, 2]}>
        <Campfire position={[0, 0, 0]} />
        {/* Logs around fire */}
         <mesh position={[1.5, 0.15, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.15, 0.15, 1]} />
            <meshStandardMaterial color="#78350f" />
         </mesh>
         <mesh position={[-1.5, 0.15, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.15, 0.15, 1]} />
            <meshStandardMaterial color="#78350f" />
         </mesh>
      </group>
      
      {/* Fireworks Launcher - Moved Next to Flag */}
      <FireworkLauncher position={[4.5, 0, -4]} playerPos={playerPosRef} />

      {/* Tables */}
      <TableSet position={[-6, 0, 2]} />
      <TableSet position={[-9, 0, 1]} />

      {/* --- SECTION 2: The Zen Garden (Left) --- */}
      <group position={[-10, 0, 0]}>
         {/* Sand patch */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} userData={{ walkable: true }}>
            <circleGeometry args={[5, 32]} />
            <meshStandardMaterial color="#fde68a" />
        </mesh>
        {ROCKS.map((r, i) => (
             <Rock key={i} position={r.position} scale={r.scale} />
        ))}
        {/* Specific colored trees from inner list */}
        <Tree position={[-3, 0, -3]} color="#fca5a5" /> 
        <Tree position={[-4, 0, 2]} color="#fca5a5" />
      </group>

      {/* --- SECTION 3: The Playground (Right) --- */}
      <group position={[10, 0, 0]}>
         {/* Blue turf */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} userData={{ walkable: true }}>
            <circleGeometry args={[5, 32]} />
            <meshStandardMaterial color="#a5f3fc" />
        </mesh>
        <PlaygroundStructure position={[0, 0, 0]} />
        <Tree position={[3, 0, 3]} />
        <Tree position={[3, 0, -3]} />
      </group>

      {/* Football Field - Moved away from River (river is at z approx -14) */}
      <FootballField position={[25, 0, 20]} />
      
      {/* Wooden House - Side of Football Field */}
      <WoodenHouse position={[45, 0, 20]} rotation={[0, -Math.PI / 2, 0]} />

      {/* Border Trees */}
      {BORDER_TREES.map((t, i) => (
          <Tree key={`border-${i}`} position={t.position} scale={t.scale} />
      ))}
      
       {/* Other Inner Trees */}
       <Tree position={[6, 0, 6]} scale={0.8} />
       <Tree position={[-6, 0, 8]} scale={0.9} />
       <Tree position={[8, 0, -8]} scale={1.1} />
       <Tree position={[-12, 0, 5]} scale={1.2} />
    </group>
  );
};

export default Scene;