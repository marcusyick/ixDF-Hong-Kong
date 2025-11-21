import React, { useRef, useEffect, useMemo, useState } from 'react';
import { Text, Float, useHelper, MeshDistortMaterial, Sparkles, useTexture } from '@react-three/drei';
import { useFrame, ThreeElements } from '@react-three/fiber';
import { PointLightHelper, Mesh, DoubleSide, Vector3 } from 'three';
import { Collider } from '../../types';

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
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[20, 30]} />
            <meshStandardMaterial color="#4ade80" />
        </mesh>
        
        {/* Lines (White) */}
        {/* Borders */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <planeGeometry args={[18, 28]} />
             <meshBasicMaterial color="white" wireframe />
        </mesh>
        {/* Center Line */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
             <planeGeometry args={[18, 0.1]} />
             <meshBasicMaterial color="white" />
        </mesh>
         {/* Center Circle */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
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

const Rock: React.FC<{ position: [number, number, number], scale?: number }> = ({ position, scale = 1 }) => (
  <mesh position={position} scale={scale} rotation={[Math.random(), Math.random(), Math.random()]}>
    <dodecahedronGeometry args={[0.5, 0]} />
    <meshStandardMaterial color="#94a3b8" flatShading />
  </mesh>
);

const Mountain: React.FC<{ position: [number, number, number] }> = ({ position }) => (
  <group position={position}>
    <mesh position={[0, 5, 0]}>
        <coneGeometry args={[8, 12, 4]} />
        <meshStandardMaterial color="#64748b" flatShading />
    </mesh>
    <mesh position={[0, 9, 0]}>
        <coneGeometry args={[3, 4, 4]} />
        <meshStandardMaterial color="white" flatShading />
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
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
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
            position={[0, 1.2, 0]} 
            fontSize={0.25} 
            color="#0f172a" 
            fontWeight="bold" 
            anchorX="center" 
            anchorY="top"
        >
            What you can do in here?
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
            • Meet new designers
        </Text>

        <Text 
            position={[0, -0.2, 0]} 
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
const BORDER_TREES = Array.from({ length: 40 }).map((_, i) => {
    const angle = (i / 40) * Math.PI * 2;
    const radius = 22 + Math.random() * 5;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    return { position: [x, 0, z] as [number, number, number], scale: 1 + Math.random() * 0.5 };
}).filter(t => {
    const x = t.position[0];
    const z = t.position[2];
    // Exclude trees inside the Football Field area (New Position Center: [25, 0, 20], Size: [20, 30])
    // Bounds: X [15, 35], Z [5, 35]
    const buffer = 2;
    const inField = x > (15 - buffer) && x < (35 + buffer) && z > (5 - buffer) && z < (35 + buffer);
    return !inField;
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

const STATIC_STRUCTURES = [
    { position: [0, 0, -4] as [number, number, number], radius: 2.2 }, // Whiteboard
    { position: [3, 0, 2] as [number, number, number], radius: 1.0 }, // Campfire
    { position: [10, 0, 0] as [number, number, number], radius: 2.5 }, // Playground
    { position: [-6, 0, 4] as [number, number, number], radius: 1.5 }, // Table Set 1
    { position: [2, 0, -7] as [number, number, number], radius: 1.5 }, // Table Set 2
];

interface SceneProps {
    setColliders?: (colliders: Collider[]) => void;
}

const Scene: React.FC<SceneProps> = ({ setColliders }) => {
  
  useEffect(() => {
    if (!setColliders) return;

    const colliders: Collider[] = [];
    
    // Add trees (trunk radius approx 0.4)
    BORDER_TREES.forEach(t => colliders.push({ position: t.position, radius: 0.6 }));
    INNER_TREES.forEach(t => colliders.push({ position: t.position, radius: 0.6 }));
    
    // Only trees are kept as colliders per request.

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
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#dcfce7" />
      </mesh>

      {/* River */}
      <River />

      {/* Mountains - pushed back */}
      <Mountain position={[-20, 0, -30]} />
      <Mountain position={[0, 0, -35]} />
      <Mountain position={[25, 0, -28]} />

      {/* --- SECTION 1: The Plaza (Central) --- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[5, 32]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
      
      {/* Whiteboard Signage */}
      <Whiteboard position={[0, 0, -4]} />
      
      {/* New Agenda Board */}
      <AgendaBoard position={[6.5, 0, -3]} rotation={[0, -0.5, 0]} />

      {/* Hong Kong Flag */}
      <Flag position={[-4, 0, -2]} />
      
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
      
      {/* Tables */}
      <TableSet position={[-6, 0, 2]} />
      <TableSet position={[-9, 0, 1]} />

      {/* --- SECTION 2: The Zen Garden (Left) --- */}
      <group position={[-10, 0, 0]}>
         {/* Sand patch */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
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
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <circleGeometry args={[5, 32]} />
            <meshStandardMaterial color="#a5f3fc" />
        </mesh>
        <PlaygroundStructure position={[0, 0, 0]} />
        <Tree position={[3, 0, 3]} />
        <Tree position={[3, 0, -3]} />
      </group>

      {/* Football Field - Moved away from River (river is at z approx -14) */}
      <FootballField position={[25, 0, 20]} />

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