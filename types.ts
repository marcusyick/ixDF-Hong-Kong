export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
import { ThreeElements } from '@react-three/fiber';

declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
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
  BALLOON = 'Balloon'
}

export interface UserState {
  name: string;
  characterType: CharacterType;
  color: string;
  accessory: Accessory;
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