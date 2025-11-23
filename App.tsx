import React, { useState, useEffect, useCallback } from 'react';
import CharacterSelection from './components/CharacterSelection';
import GameCanvas from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';
import { UserState, ChatMessage, Accessory, BroadcastMessage } from './types';
import { NPC_LIST } from './constants';

function App() {
  const [user, setUser] = useState<UserState | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [nearbyNPC, setNearbyNPC] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  
  // Multiplayer Chat Signals
  const [broadcastMessage, setBroadcastMessage] = useState<BroadcastMessage | null>(null);

  const handleMicToggle = useCallback(async () => {
    const newState = !isListening;
    setIsListening(newState);

    if (newState) {
        if (micStream && micStream.active) {
            // Already have a stream, just ensure it's not muted logic wise
            return; 
        }
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
    };

    recognition.onerror = () => {
        // Don't turn off global listening if it's just a recognition error, keep stream alive
    }; 
    
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
    if (!user) return;

    const msgId = Date.now().toString();
    const newUserMsg: ChatMessage = {
      id: msgId,
      sender: user.name,
      text: text,
      isUser: true,
      timestamp: Date.now()
    };

    setChatHistory(prev => [...prev, newUserMsg]);
    
    // Trigger broadcast to other players (as Self)
    setBroadcastMessage({ text, sender: user.name, id: msgId });

    // Check if near an NPC to talk to
    if (nearbyNPC) {
      const npc = NPC_LIST.find(n => n.name === nearbyNPC);
      if (npc && npc.responses.length > 0) {
        // Pick a random hardcoded response
        const randomResponse = npc.responses[Math.floor(Math.random() * npc.responses.length)];
        
        const npcMsgId = (Date.now() + 1).toString();
        const npcMsg: ChatMessage = {
            id: npcMsgId,
            sender: npc.name,
            text: randomResponse,
            isUser: false,
            timestamp: Date.now()
        };
        
        // Small delay to feel natural
        setTimeout(() => {
            setChatHistory(prev => [...prev, npcMsg]);
            // CRITICAL: Broadcast the NPC's response to everyone else
            // so they see the NPC talking too.
            setBroadcastMessage({ text: randomResponse, sender: npc.name, id: npcMsgId });
        }, 600);
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
    setScore(0);
  };

  const handlePurchaseAccessory = (item: { id: Accessory, cost: number }) => {
      if (!user) return;

      // Check if already owned
      if (user.unlockedAccessories.includes(item.id)) {
          // Just Equip
          setUser({ ...user, accessory: item.id });
          return;
      }

      // Buy Logic
      if (score >= item.cost) {
          setScore(prev => prev - item.cost);
          setUser({
              ...user,
              accessory: item.id,
              unlockedAccessories: [...user.unlockedAccessories, item.id]
          });
      }
  };

  const handleCharacterSelectionComplete = (newUser: UserState, initialStream: MediaStream | null) => {
      setUser(newUser);
      if (initialStream) {
          setMicStream(initialStream);
          setIsListening(true);
      }
  }

  if (!user) {
    return <CharacterSelection onComplete={handleCharacterSelectionComplete} />;
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
        onPlayerListUpdate={setRemoteUsers}
        onCoinCollected={() => setScore(prev => prev + 1)}
      />
      <UIOverlay 
        user={user}
        chatHistory={chatHistory}
        onSendMessage={handleSendMessage}
        onMicToggle={handleMicToggle}
        isListening={isListening}
        nearbyNPC={nearbyNPC}
        onSwitchCharacter={handleSwitchCharacter}
        onlineUsers={[user.name, ...remoteUsers]}
        score={score}
        onPurchaseAccessory={handlePurchaseAccessory}
      />
    </div>
  );
}

export default App;