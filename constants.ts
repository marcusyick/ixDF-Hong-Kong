import { CharacterType, NPCData } from './types';

export const CHARACTER_OPTIONS = [
  { type: CharacterType.RABBIT, color: '#fca5a5', label: 'Pink Bun' },
  { type: CharacterType.BEAR, color: '#93c5fd', label: 'Blue Bear' },
  { type: CharacterType.CAT, color: '#fde047', label: 'Yellow Cat' },
  { type: CharacterType.ROBOT, color: '#cbd5e1', label: 'Chill Bot' },
];

export const NPC_LIST: NPCData[] = [
  {
    id: 'npc_1',
    name: 'Sarah (Comm. Mgr)',
    characterType: CharacterType.RABBIT,
    color: '#fdba74',
    position: [5, 0, 5],
    persona: "You are Sarah, the Community Manager for IxDF Hong Kong. You are super welcoming, energetic, and love connecting designers together. You invite people to check out the latest local design events and meetups!",
    useThinking: false,
    // wanderRadius removed to keep stationary
  },
  {
    id: 'npc_2',
    name: 'Ken (UX Mentor)',
    characterType: CharacterType.BEAR,
    color: '#60a5fa', 
    position: [-8, 0, -2],
    persona: "You are Ken, a senior UX Mentor. You are thoughtful, experienced, and love discussing user research, empathy, design ethics, and career growth. You often ask deep questions to help junior designers reflect.",
    useThinking: true, // Triggers Thinking Mode
    // wanderRadius removed to keep stationary
  }
];