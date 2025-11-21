import React, { useRef } from 'react';
import { useFrame, ThreeElements } from '@react-three/fiber';
import { Group } from 'three';
import { CharacterType } from '../types';

// Fix for missing JSX types in this environment
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

interface AvatarProps {
  type: CharacterType;
  color: string;
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

const Avatar: React.FC<AvatarProps> = ({ type, color, position = [0, 0, 0], rotation = [0, 0, 0], isMoving = false, scale = 1, withShadow = true }) => {
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
      // Reset Feet
      if (leftFootRef.current && rightFootRef.current) {
        leftFootRef.current.position.z = 0.15;
        leftFootRef.current.position.y = 0;
        rightFootRef.current.position.z = -0.15;
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