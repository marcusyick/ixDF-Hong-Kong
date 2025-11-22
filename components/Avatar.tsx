import React, { useRef } from 'react';
import { useFrame, ThreeElements } from '@react-three/fiber';
import { Group } from 'three';
import { CharacterType, Accessory } from '../types';

interface AvatarProps {
  type: CharacterType;
  color: string;
  accessory?: Accessory;
  position?: [number, number, number];
  rotation?: [number, number, number];
  isMoving?: boolean;
  scale?: number;
  withShadow?: boolean;
}

const Face = () => (
  <group position={[0, 0.4, 0.46]}>
    {/* Left Eye */}
    <mesh position={[-0.18, 0, 0]}>
      <sphereGeometry args={[0.04, 16, 16]} />
      <meshStandardMaterial color="#1a1a1a" roughness={0.2} />
    </mesh>
    {/* Right Eye */}
    <mesh position={[0.18, 0, 0]}>
      <sphereGeometry args={[0.04, 16, 16]} />
      <meshStandardMaterial color="#1a1a1a" roughness={0.2} />
    </mesh>
    {/* Cheeks */}
    <mesh position={[-0.25, -0.05, -0.02]}>
       <circleGeometry args={[0.06]} />
       <meshBasicMaterial color="#ffadad" transparent opacity={0.4} />
    </mesh>
    <mesh position={[0.25, -0.05, -0.02]}>
       <circleGeometry args={[0.06]} />
       <meshBasicMaterial color="#ffadad" transparent opacity={0.4} />
    </mesh>
  </group>
);

const PartyHat = () => (
  <group position={[0, 0.85, 0]} rotation={[0.2, 0, -0.1]}>
      <mesh position={[0, 0.25, 0]}>
          <coneGeometry args={[0.2, 0.5, 32]} />
          <meshStandardMaterial color="#f472b6" />
      </mesh>
      <mesh position={[0, 0, 0]}>
          <torusGeometry args={[0.2, 0.03, 8, 32]} />
          <meshStandardMaterial color="#fbbf24" />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.06]} />
          <meshStandardMaterial color="#fbbf24" />
      </mesh>
  </group>
);

const Sunglasses = () => (
    <group position={[0, 0.4, 0.5]}>
        {/* Lenses */}
        <mesh position={[-0.18, 0, 0]}>
            <boxGeometry args={[0.18, 0.12, 0.05]} />
            <meshStandardMaterial color="black" roughness={0.1} />
        </mesh>
        <mesh position={[0.18, 0, 0]}>
            <boxGeometry args={[0.18, 0.12, 0.05]} />
            <meshStandardMaterial color="black" roughness={0.1} />
        </mesh>
        {/* Bridge */}
        <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.1, 0.02, 0.04]} />
            <meshStandardMaterial color="#333" />
        </mesh>
        {/* Arms */}
        <mesh position={[-0.3, 0, -0.2]} rotation={[0, -0.2, 0]}>
             <boxGeometry args={[0.02, 0.02, 0.4]} />
             <meshStandardMaterial color="#333" />
        </mesh>
        <mesh position={[0.3, 0, -0.2]} rotation={[0, 0.2, 0]}>
             <boxGeometry args={[0.02, 0.02, 0.4]} />
             <meshStandardMaterial color="#333" />
        </mesh>
    </group>
);

const Balloon = ({ isMoving }: { isMoving: boolean }) => {
    const wrapperRef = useRef<Group>(null);
    const headRef = useRef<Group>(null);

    useFrame((state, delta) => {
        const t = state.clock.elapsedTime;

        if (wrapperRef.current) {
            // Drag Physics: Tilt the whole string backwards when moving
            const targetTiltX = isMoving ? -0.6 : 0; 
            const targetTiltZ = isMoving ? Math.sin(t * 10) * 0.1 : 0;
            const lerpSpeed = 4 * delta;
            wrapperRef.current.rotation.x += (targetTiltX - wrapperRef.current.rotation.x) * lerpSpeed;
            wrapperRef.current.rotation.z += (targetTiltZ - wrapperRef.current.rotation.z) * lerpSpeed;
            const windSway = Math.sin(t * 2.5) * 0.08;
            wrapperRef.current.rotation.z += windSway * delta;
        }

        if (headRef.current) {
             const wobbleSpeed = isMoving ? 12 : 2;
             const wobbleAmp = isMoving ? 0.15 : 0.03;
             headRef.current.rotation.z = Math.sin(t * wobbleSpeed) * wobbleAmp;
             headRef.current.rotation.x = Math.cos(t * (wobbleSpeed * 0.9)) * wobbleAmp;
        }
    })

    return (
        <group ref={wrapperRef} position={[0.6, 0.2, 0.2]}>
            {/* String */}
            <mesh position={[0, 0.5, 0]}>
                <cylinderGeometry args={[0.005, 0.005, 1]} />
                <meshBasicMaterial color="white" />
            </mesh>
            {/* Balloon Head */}
            <group ref={headRef} position={[0, 1, 0]}>
                <mesh>
                    <sphereGeometry args={[0.25, 32, 32]} />
                    <meshStandardMaterial color="#ef4444" roughness={0.2} metalness={0.1} />
                </mesh>
                {/* Knot */}
                <mesh position={[0, -0.25, 0]}>
                    <coneGeometry args={[0.05, 0.05, 8]} />
                    <meshStandardMaterial color="#ef4444" />
                </mesh>
            </group>
        </group>
    )
}

const Flower = ({ isMoving }: { isMoving: boolean }) => {
    const wrapperRef = useRef<Group>(null);
    const headRef = useRef<Group>(null);

    useFrame((state, delta) => {
        const t = state.clock.elapsedTime;
        if (wrapperRef.current) {
            const targetTiltX = isMoving ? -0.4 : 0; 
            const targetTiltZ = isMoving ? Math.sin(t * 10) * 0.1 : 0;
            const lerpSpeed = 6 * delta;
            wrapperRef.current.rotation.x += (targetTiltX - wrapperRef.current.rotation.x) * lerpSpeed;
            wrapperRef.current.rotation.z += (targetTiltZ - wrapperRef.current.rotation.z) * lerpSpeed;
            wrapperRef.current.rotation.z += Math.sin(t * 3) * 0.05 * delta; // Gentle sway
        }
    })

    return (
        <group ref={wrapperRef} position={[0, 0.8, 0]}>
             {/* Stem */}
            <mesh position={[0, 0.2, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 0.4]} />
                <meshStandardMaterial color="#22c55e" />
            </mesh>
            {/* Flower Head */}
            <group ref={headRef} position={[0, 0.4, 0]}>
                 {/* Center */}
                 <mesh>
                    <sphereGeometry args={[0.08]} />
                    <meshStandardMaterial color="#fbbf24" />
                 </mesh>
                 {/* Petals */}
                 {[0, 1, 2, 3, 4].map((i) => (
                     <mesh key={i} position={[Math.cos(i * 1.25) * 0.1, Math.sin(i * 1.25) * 0.1, 0]} rotation={[0, 0, i]}>
                         <circleGeometry args={[0.08]} />
                         <meshStandardMaterial color="#f472b6" side={2} />
                     </mesh>
                 ))}
            </group>
        </group>
    )
}

const BaseballHat = ({ color }: { color: string }) => (
    <group position={[0, 0.7, 0.1]} rotation={[-0.2, 0, 0]}>
        {/* Cap Dome */}
        <mesh>
            <sphereGeometry args={[0.36, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#3b82f6" />
        </mesh>
        {/* Brim */}
        <mesh position={[0, 0, 0.3]} rotation={[0.2, 0, 0]}>
            <boxGeometry args={[0.5, 0.05, 0.4]} />
            <meshStandardMaterial color="#3b82f6" />
        </mesh>
    </group>
)

const Crown = () => (
    <group position={[0, 0.75, 0]}>
        {/* Golden Base Rim */}
        <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.25, 0.25, 0.1, 32]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.6} roughness={0.2} />
        </mesh>
        {/* Dome fill (optional, for comfort) */}
        <mesh position={[0, 0.05, 0]}>
             <sphereGeometry args={[0.24, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
             <meshStandardMaterial color="#b45309" />
        </mesh>

        {/* 4 Curved Spikes */}
        {[0, 1, 2, 3].map((i) => {
            const angle = (i / 4) * Math.PI * 2;
            return (
                <group key={i} rotation={[0, angle, 0]}>
                     {/* Spike */}
                    <mesh position={[0.22, 0.15, 0]} rotation={[0, 0, -0.2]}>
                        <coneGeometry args={[0.08, 0.35, 16]} />
                        <meshStandardMaterial color="#fbbf24" metalness={0.6} roughness={0.2} />
                    </mesh>
                    {/* Red Jewel Ball on Tip */}
                    <mesh position={[0.26, 0.32, 0]}>
                        <sphereGeometry args={[0.05, 16, 16]} />
                        <meshStandardMaterial color="#ef4444" metalness={0.2} roughness={0.1} emissive="#991b1b" emissiveIntensity={0.2} />
                    </mesh>
                </group>
            )
        })}
    </group>
)

const Avatar: React.FC<AvatarProps> = ({ type, color, accessory = Accessory.NONE, position = [0, 0, 0], rotation = [0, 0, 0], isMoving = false, scale = 1, withShadow = true }) => {
  const groupRef = useRef<Group>(null);
  const bodyRef = useRef<Group>(null);
  const leftFootRef = useRef<Group>(null);
  const rightFootRef = useRef<Group>(null);

  // Animation Logic: Bounce and Waddle
  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (isMoving) {
      // Vertical Bounce
      if (bodyRef.current) {
        bodyRef.current.position.y = Math.sin(t * 12) * 0.05 + 0.7; // Base height 0.7
        // Waddle (Z-rotation)
        bodyRef.current.rotation.z = Math.sin(t * 12) * 0.05;
      }
      
      // Feet Walking Cycle
      if (leftFootRef.current && rightFootRef.current) {
        leftFootRef.current.position.z = Math.sin(t * 12) * 0.2;
        leftFootRef.current.position.y = Math.max(0, Math.cos(t * 12) * 0.1); // Lift foot
        
        rightFootRef.current.position.z = Math.sin(t * 12 + Math.PI) * 0.2;
        rightFootRef.current.position.y = Math.max(0, Math.cos(t * 12 + Math.PI) * 0.1); // Lift foot
      }
    } else {
      // Idle Breathing
      if (bodyRef.current) {
        bodyRef.current.position.y = Math.sin(t * 2) * 0.02 + 0.7;
        bodyRef.current.rotation.z = 0;
      }
      // Reset Feet - Align them side by side
      if (leftFootRef.current && rightFootRef.current) {
        leftFootRef.current.position.z = 0;
        leftFootRef.current.position.y = 0;
        rightFootRef.current.position.z = 0;
        rightFootRef.current.position.y = 0;
      }
    }
  });

  const renderAccessories = () => {
    switch (type) {
      case CharacterType.RABBIT:
        return (
          <group position={[0, 0.8, 0]}>
            <mesh position={[-0.2, 0.2, 0]} rotation={[0, 0, -0.1]}>
              <capsuleGeometry args={[0.1, 0.5, 4, 8]} />
              <meshStandardMaterial color={color} />
            </mesh>
            <mesh position={[0.2, 0.2, 0]} rotation={[0, 0, 0.1]}>
              <capsuleGeometry args={[0.1, 0.5, 4, 8]} />
              <meshStandardMaterial color={color} />
            </mesh>
          </group>
        );
      case CharacterType.CAT:
        return (
          <group position={[0, 0.75, 0]}>
             <mesh position={[-0.25, 0.1, 0]} rotation={[0, 0, 0.4]}>
               <coneGeometry args={[0.15, 0.3, 32]} />
               <meshStandardMaterial color={color} />
             </mesh>
             <mesh position={[0.25, 0.1, 0]} rotation={[0, 0, -0.4]}>
               <coneGeometry args={[0.15, 0.3, 32]} />
               <meshStandardMaterial color={color} />
             </mesh>
          </group>
        );
      case CharacterType.ROBOT:
        return (
            <group position={[0, 0.8, 0]}>
               <mesh position={[0, 0.2, 0]}>
                 <cylinderGeometry args={[0.02, 0.02, 0.4]} />
                 <meshStandardMaterial color="gray" />
               </mesh>
               <mesh position={[0, 0.4, 0]}>
                 <sphereGeometry args={[0.08]} />
                 <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.5} />
               </mesh>
               {/* Visor instead of eyes for robot */}
               <mesh position={[0, -0.35, 0.42]}>
                   <boxGeometry args={[0.4, 0.1, 0.1]} />
                   <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={0.5} />
               </mesh>
            </group>
        )
      case CharacterType.BEAR:
      default:
        return (
          <group position={[0, 0.8, 0]}>
            <mesh position={[-0.35, 0, 0]}>
              <sphereGeometry args={[0.15]} />
              <meshStandardMaterial color={color} />
            </mesh>
            <mesh position={[0.35, 0, 0]}>
              <sphereGeometry args={[0.15]} />
              <meshStandardMaterial color={color} />
            </mesh>
          </group>
        );
    }
  };

  return (
    <group ref={groupRef} position={position} rotation={rotation as any} scale={scale}>
      
      {/* Main Body Capsule (The Bean) */}
      <group ref={bodyRef}>
        <mesh castShadow receiveShadow>
           {/* Radius 0.45, Length 0.6 (Total height approx 1.5 with caps) */}
           <capsuleGeometry args={[0.45, 0.6, 8, 16]} /> 
           <meshStandardMaterial color={color} roughness={0.3} />
        </mesh>
        
        {type !== CharacterType.ROBOT && <Face />}
        {renderAccessories()}
        
        {/* User Selected Accessory */}
        {accessory === Accessory.HAT && <PartyHat />}
        {accessory === Accessory.GLASSES && <Sunglasses />}
        {accessory === Accessory.BALLOON && <Balloon isMoving={isMoving} />}
        
        {/* New Shop Accessories */}
        {accessory === Accessory.FLOWER && <Flower isMoving={isMoving} />}
        {accessory === Accessory.BASEBALL_HAT && <BaseballHat color={color} />}
        {accessory === Accessory.CROWN && <Crown />}
        
        {/* Floating Hand Nubs */}
        <mesh position={[-0.5, 0, 0]}>
            <sphereGeometry args={[0.12]} />
            <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[0.5, 0, 0]}>
            <sphereGeometry args={[0.12]} />
            <meshStandardMaterial color={color} />
        </mesh>
      </group>

      {/* Feet */}
      <group position={[0, 0.1, 0]}>
          <group ref={leftFootRef} position={[-0.2, 0, 0]}>
              <mesh position={[0, 0, 0.1]}>
                <sphereGeometry args={[0.16]} />
                <meshStandardMaterial color={color} roughness={0.5} />
              </mesh>
              <mesh position={[0, -0.15, 0.1]} scale={[1, 0.2, 1]}>
                 <sphereGeometry args={[0.16]} />
                 <meshBasicMaterial color="black" opacity={0.2} transparent />
              </mesh>
          </group>
          <group ref={rightFootRef} position={[0.2, 0, 0]}>
              <mesh position={[0, 0, 0.1]}>
                <sphereGeometry args={[0.16]} />
                <meshStandardMaterial color={color} roughness={0.5} />
              </mesh>
              <mesh position={[0, -0.15, 0.1]} scale={[1, 0.2, 1]}>
                 <sphereGeometry args={[0.16]} />
                 <meshBasicMaterial color="black" opacity={0.2} transparent />
              </mesh>
          </group>
      </group>

      {/* Shadow */}
      {withShadow && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.45, 32]} />
            <meshBasicMaterial color="black" opacity={0.15} transparent />
        </mesh>
      )}
    </group>
  );
};

export default Avatar;