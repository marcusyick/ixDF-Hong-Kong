import React, { useState, useEffect, useCallback } from 'react';
import CharacterSelection from './components/CharacterSelection';
import GameCanvas from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';
import { UserState, ChatMessage } from './types';
import { NPC_LIST } from './constants';
import { generateNPCResponse } from './services/geminiService';

function App() {
  const [user, setUser] = useState<UserState | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [nearbyNPC, setNearbyNPC] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  
  // Multiplayer Chat Signals
  const [broadcastMessage, setBroadcastMessage] = useState<{text: string, id: string} | null>(null);

  const handleMicToggle = useCallback(async () => {
    const newState = !isListening;
    setIsListening(newState);

    if (newState) {
        try {
            // Request Microphone Stream for WebRTC
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setMicStream(stream);
        } catch (err) {
            console.error("Failed to access microphone:", err);
            setIsListening(false);
        }
    } else {
        // Stop all tracks
        if (micStream) {
            micStream.getTracks().forEach(track => track.stop());
            setMicStream(null);
        }
    }
  }, [isListening, micStream]);

  // Mic Speech Recognition Setup (AI Chat)
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return;
    }
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      if (text) {
          handleSendMessage(text);
      }
      // We don't auto-turn off isListening here because we might want to keep the mic stream open for voice chat
      // But for the AI recognition part, it stops automatically.
      // If we want continuous AI listening, we'd restart it.
      // For now, let's assume speech-to-text is a one-off command while voice chat is continuous.
    };

    recognition.onerror = () => {
        // Don't turn off global listening if it's just a recognition error, keep stream alive
    }; 
    
    // Restart recognition if listening is still active? 
    // For this combined use case (Voice Chat + AI Command), it's tricky. 
    // Let's stick to: AI listens once per toggle or we rely on manual input for AI if Voice Chat is primary.
    // Actually, let's just run recognition once when toggled on, then user toggles off/on again for AI.
    // OR: simple approach -> Recognition runs.
    
    if (isListening) {
      try {
        recognition.start();
      } catch(e) {
          // already started
      }
    } else {
      recognition.stop();
    }

    return () => {
      recognition.stop();
    };
  }, [isListening]);

  const handleSendMessage = async (text: string) => {
    const msgId = Date.now().toString();
    const newUserMsg: ChatMessage = {
      id: msgId,
      sender: user?.name || 'Me',
      text: text,
      isUser: true,
      timestamp: Date.now()
    };

    setChatHistory(prev => [...prev, newUserMsg]);
    
    // Trigger broadcast to other players
    setBroadcastMessage({ text, id: msgId });

    // Check if near an NPC to talk to
    if (nearbyNPC) {
      const npc = NPC_LIST.find(n => n.name === nearbyNPC);
      if (npc) {
        const relevantHistory = chatHistory
           .filter(m => m.sender === npc.name || m.isUser)
           .slice(-5)
           .map(m => ({
               role: m.isUser ? 'user' : 'model',
               parts: [{ text: m.text }] as [{ text: string }]
           }));
        
        const responseText = await generateNPCResponse(
            npc.name, 
            npc.persona, 
            text, 
            relevantHistory, 
            npc.useThinking
        );
        
        const npcMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            sender: npc.name,
            text: responseText,
            isUser: false,
            timestamp: Date.now()
        };
        
        setChatHistory(prev => [...prev, npcMsg]);
      }
    }
  };
  
  const handleRemoteChat = (senderName: string, text: string) => {
      const msg: ChatMessage = {
          id: Date.now().toString() + Math.random(),
          sender: senderName,
          text: text,
          isUser: false,
          timestamp: Date.now()
      };
      setChatHistory(prev => [...prev, msg]);
  };

  const handleSwitchCharacter = () => {
    if (micStream) {
        micStream.getTracks().forEach(t => t.stop());
        setMicStream(null);
    }
    setIsListening(false);
    setUser(null);
    setChatHistory([]);
    setNearbyNPC(null);
  };

  if (!user) {
    return <CharacterSelection onComplete={setUser} />;
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      <GameCanvas 
        user={user} 
        chatHistory={chatHistory}
        nearbyNPC={nearbyNPC}
        setNearbyNPC={setNearbyNPC}
        broadcastMessage={broadcastMessage}
        onRemoteChat={handleRemoteChat}
        micStream={micStream}
      />
      <UIOverlay 
        user={user}
        chatHistory={chatHistory}
        onSendMessage={handleSendMessage}
        onMicToggle={handleMicToggle}
        isListening={isListening}
        nearbyNPC={nearbyNPC}
        onSwitchCharacter={handleSwitchCharacter}
      />
    </div>
  );
}

export default App;