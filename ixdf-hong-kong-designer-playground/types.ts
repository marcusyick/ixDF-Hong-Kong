export enum CharacterType {
  RABBIT = 'Rabbit',
  BEAR = 'Bear',
  CAT = 'Cat',
  ROBOT = 'Robot'
}

export interface UserState {
  name: string;
  characterType: CharacterType;
  color: string;
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