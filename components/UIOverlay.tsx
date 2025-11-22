import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Smile, Users, Coins, ShoppingBag, Check, Lock } from 'lucide-react';
import { UserState, ChatMessage, Accessory } from '../types';
import { SHOP_ITEMS } from '../constants';

interface UIOverlayProps {
  user: UserState;
  chatHistory: ChatMessage[]; // kept in props to avoid breaking parent, even if not used for list
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
    // Optional: focus input back?
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between">
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

      {/* Emoji Picker Panel */}
      {showEmojiPicker && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 pointer-events-auto z-30 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-white/60 grid grid-cols-8 gap-2">
                {EMOJI_LIST.map(emoji => (
                    <button
                        key={emoji}
                        onClick={() => handleEmojiClick(emoji)}
                        className="text-2xl hover:scale-125 transition-transform p-2 hover:bg-white/50 rounded-lg active:scale-95"
                    >
                        {emoji}
                    </button>
                ))}
            </div>
            {/* Triangle pointer */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white/90"></div>
        </div>
      )}

      {/* Bottom Centered Input Area */}
      <div className="absolute bottom-8 w-full flex justify-center pointer-events-auto px-4">
        <form 
          onSubmit={handleSubmit} 
          className="w-full max-w-xl bg-white/90 backdrop-blur-xl rounded-full p-2 shadow-2xl flex gap-2 items-center border border-white/60 ring-1 ring-black/5 transition-transform hover:scale-[1.01]"
        >
          <button
            type="button"
            onClick={onMicToggle}
            className={`p-3 rounded-full transition-all duration-300 flex-shrink-0 ${
              isListening 
                ? 'bg-red-500 text-white animate-pulse shadow-red-200 shadow-lg ring-2 ring-red-300' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
            }`}
            title="Toggle Microphone"
          >
            {isListening ? <Mic size={22} /> : <MicOff size={22} />}
          </button>
          
          {/* Emoji Toggle */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`p-3 rounded-full transition-colors flex-shrink-0 ${
                showEmojiPicker ? 'bg-garden-100 text-garden-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
            title="Open Emojis"
          >
            <Smile size={22} />
          </button>

          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={nearbyNPC ? `Say something to ${nearbyNPC}...` : "Type to chat..."}
            className="flex-1 bg-transparent text-gray-900 placeholder-gray-500 border-none focus:ring-0 text-base px-2 outline-none font-medium h-full"
          />
          
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="p-3 bg-garden-600 text-white rounded-full hover:bg-garden-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md transform active:scale-95 flex-shrink-0"
          >
            <Send size={20} strokeWidth={2.5} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default UIOverlay;