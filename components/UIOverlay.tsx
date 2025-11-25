import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Smile, Users, Coins, ShoppingBag, Check, Lock, MessageSquare } from 'lucide-react';
import { UserState, ChatMessage, Accessory } from '../types';
import { SHOP_ITEMS } from '../constants';

interface UIOverlayProps {
  user: UserState;
  chatHistory: ChatMessage[]; 
  onSendMessage: (text: string) => void;
  onMicToggle: () => void;
  isListening: boolean;
  nearbyNPC: string | null;
  onSwitchCharacter: () => void;
  onlineUsers: string[];
  score: number;
  onPurchaseAccessory: (item: { id: Accessory, cost: number }) => void;
}

const EMOJI_LIST = ['😀', '😂', '😍', '😎', '🤔', '😭', '😡', '👍', '👎', '👋', '🙏', '❤️', '🎉', '🔥', '🌿', '🇭🇰'];

const UIOverlay: React.FC<UIOverlayProps> = ({
  user,
  chatHistory,
  onSendMessage,
  onMicToggle,
  isListening,
  nearbyNPC,
  onSwitchCharacter,
  onlineUsers,
  score,
  onPurchaseAccessory
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
      setShowEmojiPicker(false);
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setInputValue(prev => prev + emoji);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-[200] flex flex-col justify-between">
      {/* Top Bar */}
      <div className="p-4 pointer-events-auto flex justify-between items-start">
        {/* Left: Info */}
        <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl shadow-lg inline-block border border-white/40 w-64">
          <h1 className="font-bold text-lg text-garden-800 flex items-center gap-2">
            <span className="text-2xl">🇭🇰</span> IxDF Hong Kong
          </h1>
          <p className="text-sm text-gray-600">
            Playing as <span className="font-semibold text-garden-600">{user.name}</span>
          </p>
           <div className="mt-2 text-xs text-gray-500 flex flex-col gap-1">
              <span className='flex items-center gap-1'><span className="kbd font-mono bg-gray-100 px-1 rounded border border-gray-300">WASD / Arrows</span> to move</span>
              <span className='flex items-center gap-1'><span className="kbd font-mono bg-gray-100 px-1 rounded border border-gray-300">Space</span> to jump</span>
          </div>
          
          {/* Online Users List */}
          <div className="mt-3 pt-3 border-t border-gray-200/50">
            <h3 className="text-xs font-bold text-garden-800 mb-1 flex items-center gap-1">
                <Users size={12} />
                Online Gardeners ({onlineUsers.length})
            </h3>
            <div className="max-h-32 overflow-y-auto scrollbar-hide">
                {onlineUsers.map((name, i) => (
                    <div key={i} className="text-xs text-gray-600 flex items-center gap-1.5 py-0.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${name === user.name ? 'bg-garden-500' : 'bg-green-400'} animate-pulse`}></div>
                        <span className="truncate max-w-[180px]">{name}</span> {name === user.name && <span className="text-gray-400 text-[10px]">(You)</span>}
                    </div>
                ))}
            </div>
          </div>
        </div>

        {/* Center: Score / Shop Button */}
        <div className="absolute left-1/2 transform -translate-x-1/2 top-4 z-50">
            <button 
                onClick={() => setShowShop(!showShop)}
                className="bg-white/90 backdrop-blur-sm px-6 py-2 rounded-full shadow-xl border-2 border-yellow-400 flex items-center gap-2 hover:scale-105 transition-transform active:scale-95"
                title="Open Shop"
            >
                <Coins size={20} className="text-yellow-500 fill-yellow-500" />
                <span className="font-extrabold text-xl text-yellow-600">{score}</span>
                <div className="bg-yellow-100 rounded-full p-1 ml-1">
                    <ShoppingBag size={16} className="text-yellow-700" />
                </div>
            </button>

            {/* Shop Pop-up Modal */}
            {showShop && (
                <div className="absolute top-16 left-1/2 transform -translate-x-1/2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-garden-100 p-4 flex justify-between items-center border-b border-garden-200">
                        <h2 className="font-bold text-garden-800 flex items-center gap-2">
                            <ShoppingBag size={18} />
                            Garden Shop
                        </h2>
                        <button onClick={() => setShowShop(false)} className="text-gray-500 hover:text-gray-800">✕</button>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-3 bg-white/95 max-h-[60vh] overflow-y-auto">
                        {SHOP_ITEMS.map(item => {
                            const isOwned = user.unlockedAccessories.includes(item.id);
                            const isEquipped = user.accessory === item.id;
                            const canAfford = score >= item.cost;

                            return (
                                <div key={item.id} className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 text-center transition-all ${isEquipped ? 'border-garden-500 bg-garden-50' : 'border-gray-100 hover:border-garden-200'}`}>
                                    <div className="text-3xl mb-1">{item.icon}</div>
                                    <div className="font-bold text-xs text-gray-700 leading-tight">{item.label}</div>
                                    
                                    {isOwned ? (
                                        <button 
                                            onClick={() => onPurchaseAccessory(item)}
                                            disabled={isEquipped}
                                            className={`w-full py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 ${isEquipped ? 'bg-garden-200 text-garden-800 cursor-default' : 'bg-gray-100 text-gray-600 hover:bg-garden-500 hover:text-white'}`}
                                        >
                                            {isEquipped ? <><Check size={10} /> Equipped</> : 'Equip'}
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => onPurchaseAccessory(item)}
                                            disabled={!canAfford}
                                            className={`w-full py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 ${canAfford ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500 shadow-sm' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                        >
                                            {canAfford ? <><Coins size={10} /> {item.cost}</> : <><Lock size={10} /> {item.cost}</>}
                                        </button>
                                    )}
                                </div>
                            )
                        })}
                        
                        {/* Default None Option */}
                        <div className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 text-center transition-all ${user.accessory === Accessory.NONE ? 'border-garden-500 bg-garden-50' : 'border-gray-100 hover:border-garden-200'}`}>
                             <div className="text-3xl mb-1">🚫</div>
                             <div className="font-bold text-xs text-gray-700 leading-tight">None</div>
                             <button 
                                onClick={() => onPurchaseAccessory({ id: Accessory.NONE, cost: 0 })}
                                disabled={user.accessory === Accessory.NONE}
                                className={`w-full py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 ${user.accessory === Accessory.NONE ? 'bg-garden-200 text-garden-800 cursor-default' : 'bg-gray-100 text-gray-600 hover:bg-garden-500 hover:text-white'}`}
                            >
                                {user.accessory === Accessory.NONE ? <><Check size={10} /> Equipped</> : 'Equip'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Right: Switch Character Button */}
        <button 
            onClick={onSwitchCharacter}
            className="bg-white/80 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-white/40 text-gray-600 hover:bg-white hover:text-garden-600 transition-all flex items-center gap-2 font-semibold text-sm group"
            title="Switch Character"
        >
            <Users size={20} className="group-hover:scale-110 transition-transform" />
            <span className="hidden md:inline">Switch Character</span>
        </button>
      </div>

      {/* Center Interaction Prompt */}
      {nearbyNPC && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto animate-bounce z-20">
           <div className="bg-white/95 text-garden-900 px-5 py-2 rounded-full shadow-xl font-bold border-2 border-garden-400 flex items-center gap-2">
             <span className="text-xl">💬</span> Talk to {nearbyNPC}
           </div>
        </div>
      )}

      {/* BOTTOM CONTROL AREA */}
      {/* We use a 0-height absolute container at the bottom, then place items absolutely relative to it to ensure perfect alignment */}
      <div className="absolute bottom-0 left-0 right-0 w-full h-0">
          
          {/* BOTTOM LEFT: Voice Control */}
          <div className="absolute bottom-6 left-6 pointer-events-auto z-50">
             <button
                type="button"
                onClick={onMicToggle}
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ring-4 ${
                  isListening 
                    ? 'bg-red-500 text-white animate-pulse shadow-red-500/50 ring-red-300' 
                    : 'bg-white text-gray-700 hover:bg-gray-50 ring-white/50 hover:scale-105'
                }`}
                title={isListening ? "Mute Microphone" : "Unmute Microphone"}
              >
                {isListening ? <Mic size={32} /> : <MicOff size={32} />}
              </button>
          </div>

          {/* BOTTOM CENTER: Chat Input */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-md pointer-events-auto z-50">
              <div className="relative">
                  {/* Emoji Picker Panel */}
                  {showEmojiPicker && (
                    <div className="absolute bottom-14 left-1/2 transform -translate-x-1/2 pointer-events-auto z-30 animate-in fade-in slide-in-from-bottom-4 duration-200">
                        <div className="bg-white/90 backdrop-blur-xl p-3 rounded-2xl shadow-2xl border border-white/60 grid grid-cols-8 gap-1 w-64">
                            {EMOJI_LIST.map(emoji => (
                                <button
                                    key={emoji}
                                    onClick={() => handleEmojiClick(emoji)}
                                    className="text-xl hover:scale-125 transition-transform p-1 hover:bg-white/50 rounded-lg active:scale-95"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                  )}

                  <form 
                    onSubmit={handleSubmit} 
                    className="w-full bg-white/90 backdrop-blur-xl rounded-2xl p-1.5 shadow-2xl flex gap-1.5 items-center border border-white/60"
                  >
                    <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className={`p-2 rounded-xl transition-colors flex-shrink-0 ${
                            showEmojiPicker ? 'bg-garden-100 text-garden-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                        title="Open Emojis"
                    >
                        <Smile size={20} />
                    </button>

                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={nearbyNPC ? `Chat with ${nearbyNPC}...` : "Type message..."}
                        className="flex-1 bg-transparent text-gray-900 placeholder-gray-500 border-none focus:ring-0 text-sm px-1 outline-none font-medium h-full min-w-0"
                    />
                    
                    <button
                        type="submit"
                        disabled={!inputValue.trim()}
                        className="p-2 bg-garden-600 text-white rounded-xl hover:bg-garden-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md transform active:scale-95 flex-shrink-0"
                    >
                        <Send size={18} strokeWidth={2.5} />
                    </button>
                  </form>
              </div>
          </div>

          {/* BOTTOM RIGHT: Chat History */}
          <div className="absolute bottom-6 right-6 w-80 pointer-events-auto z-40">
              {/* Chat History Container */}
              <div className="bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/20 h-48 overflow-y-auto flex flex-col gap-1.5 shadow-lg scrollbar-hide">
                  {chatHistory.length === 0 && (
                      <div className="text-white/50 text-xs text-center italic mt-auto">No messages yet. Say hello!</div>
                  )}
                  {chatHistory.map((msg) => (
                      <div key={msg.id} className={`flex flex-col ${msg.isUser ? 'items-end' : 'items-start'}`}>
                          <div className={`px-3 py-1.5 rounded-2xl text-sm max-w-[85%] break-words shadow-sm ${
                              msg.isUser 
                                ? 'bg-garden-500 text-white rounded-br-none' 
                                : 'bg-white text-gray-800 rounded-bl-none'
                          }`}>
                              {msg.text}
                          </div>
                          <span className="text-[10px] text-white/70 px-1 mt-0.5">{msg.sender}</span>
                      </div>
                  ))}
                  <div ref={chatEndRef} />
              </div>
          </div>
      </div>
    </div>
  );
};

export default UIOverlay;