import { ThreeElements } from '@react-three/fiber';

// Explicitly define IntrinsicElements for Three.js to prevent TypeScript errors
// when the automatic type inference from @react-three/fiber fails or is incomplete.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Core
      group: any;
      mesh: any;
      scene: any;
      object3D: any;
      instancedMesh: any;
      primitive: any;

      // Geometries
      bufferGeometry: any;
      boxGeometry: any;
      sphereGeometry: any;
      cylinderGeometry: any;
      capsuleGeometry: any;
      planeGeometry: any;
      circleGeometry: any;
      coneGeometry: any;
      torusGeometry: any;
      ringGeometry: any;
      tubeGeometry: any;
      dodecahedronGeometry: any;
      latheGeometry: any;
      octahedronGeometry: any;
      icosahedronGeometry: any;
      extrudeGeometry: any;
      shapeGeometry: any;
      torusKnotGeometry: any;

      // Materials
      meshBasicMaterial: any;
      meshStandardMaterial: any;
      meshPhongMaterial: any;
      meshPhysicalMaterial: any;
      meshNormalMaterial: any;
      meshLambertMaterial: any;
      meshDepthMaterial: any;
      meshMatcapMaterial: any;
      pointsMaterial: any;
      lineBasicMaterial: any;
      shaderMaterial: any;
      shadowMaterial: any;
      spriteMaterial: any;

      // Lights
      ambientLight: any;
      pointLight: any;
      directionalLight: any;
      spotLight: any;
      hemisphereLight: any;
      rectAreaLight: any;

      // Cameras
      perspectiveCamera: any;
      orthographicCamera: any;

      // Audio
      positionalAudio: any;

      // Effects/Others
      fog: any;
      fogExp2: any;
      
      // Catch-all
      [elemName: string]: any;
    }
  }
}

export enum CharacterType {
  RABBIT = 'Rabbit',
  BEAR = 'Bear',
  CAT = 'Cat',
  ROBOT = 'Robot'
}

export enum Accessory {
  NONE = 'None',
  HAT = 'Party Hat',
  GLASSES = 'Sunglasses',
  BALLOON = 'Balloon',
  FLOWER = 'Flower',
  BASEBALL_HAT = 'Baseball Hat',
  CROWN = 'Shiny Crown'
}

export interface UserState {
  name: string;
  characterType: CharacterType;
  color: string;
  accessory: Accessory;
  unlockedAccessories: Accessory[];
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  isUser: boolean;
  timestamp: number;
}

export interface NPCData {
  id: string;
  name: string;
  characterType: CharacterType;
  color: string;
  position: [number, number, number]; // x, y, z
  persona: string; // System instruction for this specific NPC
  responses: string[]; // Hardcoded responses
  useThinking?: boolean; // Whether to use high-reasoning model
  wanderRadius?: number;
  accessory?: Accessory;
}

export interface Collider {
  position: [number, number, number];
  radius: number;
}

export interface PlayerSyncData {
  id: string;
  user: UserState;
  position: [number, number, number];
  rotation: number;
  isMoving: boolean;
  isMicOn: boolean;
  timestamp: number;
}

export interface CoinData {
  id: string;
  position: [number, number, number];
}