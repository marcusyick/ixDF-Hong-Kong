import { CharacterType, NPCData, Accessory } from './types';

export const CHARACTER_OPTIONS = [
  { type: CharacterType.RABBIT, color: '#fca5a5', label: 'Pink Bun' },
  { type: CharacterType.BEAR, color: '#93c5fd', label: 'Blue Bear' },
  { type: CharacterType.CAT, color: '#fde047', label: 'Yellow Cat' },
  { type: CharacterType.ROBOT, color: '#475569', label: 'Chill Bot' },
];

export const ACCESSORY_OPTIONS = [
  { id: Accessory.NONE, label: 'None', icon: '🚫' },
  { id: Accessory.HAT, label: 'Party Hat', icon: '🎉' },
  { id: Accessory.GLASSES, label: 'Sunglasses', icon: '😎' },
  { id: Accessory.BALLOON, label: 'Balloon', icon: '🎈' },
];

export const SHOP_ITEMS = [
  { id: Accessory.FLOWER, label: 'Flower', cost: 5, icon: '🌸' },
  { id: Accessory.BASEBALL_HAT, label: 'Baseball Hat', cost: 10, icon: '🧢' },
  { id: Accessory.CROWN, label: 'Shiny Crown', cost: 20, icon: '👑' },
];

export const NPC_LIST: NPCData[] = [
  {
    id: 'npc_1',
    name: 'Sarah (Comm. Mgr)',
    characterType: CharacterType.RABBIT,
    color: '#fdba74',
    position: [5, 0, 5],
    persona: "You are Sarah, the Community Manager for IxDF Hong Kong.",
    responses: [
      "Welcome! I'm Sarah. Have you introduced yourself to the group yet? We'd love to know what you do!",
      "It's so lively today! If you need a break, try kicking the football around in the field!",
      "We're discussing how the community can help each other grow. Do you have any ideas to share?"
    ],
    useThinking: false,
    accessory: Accessory.HAT
  },
  {
    id: 'npc_2',
    name: 'Ken (UX Mentor)',
    characterType: CharacterType.BEAR,
    color: '#60a5fa', 
    position: [-8, 0, -2],
    persona: "You are Ken, a senior UX Mentor.",
    responses: [
      "Hello. I'm curious, do you use AI tools in your design process? It's a hot topic right now.",
      "I'm here to see how we can support junior designers. What brought you to the garden today?",
      "Collaboration is the heart of UX. Have you met any new designers here yet?"
    ],
    useThinking: true,
    accessory: Accessory.GLASSES
  },
  {
    id: 'npc_3',
    name: 'Mimi (The Cat)',
    characterType: CharacterType.CAT,
    color: '#e2e8f0', 
    position: [42, 0, 22],
    persona: "You are a cat living in the garden.",
    responses: [
      "Meow.",
      "Meow meow!",
      "Meow meow meow...",
      "Purr... Meow!",
      "Meow?"
    ],
    useThinking: false,
    accessory: Accessory.FLOWER
  },
  {
    id: 'npc_4',
    name: 'Alex (Visual Designer)',
    characterType: CharacterType.ROBOT,
    color: '#a855f7',
    position: [12, 0, -5],
    persona: "You are Alex, a trendy Visual Designer.",
    responses: [
      "I'm totally into generative art right now. Do you use any AI tools for visuals?",
      "The colors in this garden are so relaxing. Great for creative inspiration!",
      "I'd love to hear how you handle visual consistency in your projects."
    ],
    accessory: Accessory.BASEBALL_HAT
  },
  {
    id: 'npc_5',
    name: 'Fiona (Product Owner)',
    characterType: CharacterType.BEAR,
    color: '#ec4899',
    position: [-5, 0, 10],
    persona: "You are Fiona, a pragmatic Product Owner.",
    responses: [
      "I'm always looking for ways to improve team collaboration. How does your team work together?",
      "Efficiency is key! But we shouldn't sacrifice user experience for speed.",
      "What topics should we cover in the next meetup? I'm taking suggestions!"
    ],
    accessory: Accessory.CROWN
  },
  {
    id: 'npc_6',
    name: 'Ben (Student)',
    characterType: CharacterType.RABBIT,
    color: '#84cc16',
    position: [20, 0, 15],
    persona: "You are Ben, an eager design student.",
    responses: [
      "I'm just starting out in UX. Do you have any advice on building a portfolio?",
      "Everything here is so cool! I want to learn how to build 3D spaces like this.",
      "I'm hoping to find a mentor here. Everyone seems so nice!"
    ],
    accessory: Accessory.BALLOON
  }
];