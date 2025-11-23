import React, { useState } from 'react';
import { Canvas, ThreeElements } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Mic, MicOff } from 'lucide-react';
import Avatar from './Avatar';
import { CHARACTER_OPTIONS, ACCESSORY_OPTIONS } from '../constants';
import { CharacterType, UserState, Accessory } from '../types';

interface Props {
  onComplete: (user: UserState, initialStream: MediaStream | null) => void;
}

const CharacterSelection: React.FC<Props> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [selectedChar, setSelectedChar] = useState(CHARACTER_OPTIONS[0]);
  const [selectedAccessory, setSelectedAccessory] = useState<Accessory>(Accessory.NONE);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const handleMicRequest = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setMediaStream(stream);
          setIsMicEnabled(true);
      } catch (err) {
          console.error("Failed to access microphone", err);
          setIsMicEnabled(false);
      }
  };

  const handleStart = () => {
    if (name.trim()) {
      onComplete({
        name: name.trim(),
        characterType: selectedChar.type,
        color: selectedChar.color,
        accessory: selectedAccessory,
        unlockedAccessories: [Accessory.NONE, selectedAccessory]
      }, mediaStream);
    }
  };

  return (
    <div className="w-full h-screen bg-gradient-to-br from-sky-300 to-garden-200 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-5xl flex flex-col md:flex-row gap-8 items-center">
        
        {/* Left: Preview */}
        <div className="w-full md:w-5/12 h-96 bg-gradient-to-b from-sky-200 to-garden-300 rounded-2xl overflow-hidden shadow-inner relative">
            <div className="absolute top-4 left-4 bg-white/50 px-3 py-1 rounded-full text-xs font-bold text-gray-600 z-10">
                Drag to rotate
            </div>
          <Canvas camera={{ position: [0, 0.5, 2.5], fov: 50 }}>
            <ambientLight intensity={0.8} />
            <directionalLight position={[2, 5, 2]} />
            <Avatar 
                type={selectedChar.type} 
                color={selectedChar.color} 
                accessory={selectedAccessory}
                position={[0, -1, 0]} 
                scale={1.2}
            />
            <OrbitControls enableZoom={false} minPolarAngle={Math.PI/4} maxPolarAngle={Math.PI/2} />
          </Canvas>
        </div>

        {/* Right: Form */}
        <div className="w-full md:w-7/12 space-y-5">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-extrabold text-gray-800">Welcome Visitor!</h1>
            <p className="text-gray-600 mt-1">Customize your look for the IxDF Hong Kong meeting.</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">Your Name</label>
            <input
              type="text"
              maxLength={12}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a nickname..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-garden-500 focus:ring-2 focus:ring-garden-200 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">Choose Avatar</label>
            <div className="grid grid-cols-2 gap-3">
              {CHARACTER_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setSelectedChar(opt)}
                  className={`p-2 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                    selectedChar.label === opt.label
                      ? 'border-garden-500 bg-garden-50 text-garden-700'
                      : 'border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: opt.color }}></div>
                  <span className="font-semibold text-xs">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">Add an Accessory</label>
            <div className="grid grid-cols-4 gap-2">
                {ACCESSORY_OPTIONS.map((opt) => (
                    <button
                        key={opt.id}
                        onClick={() => setSelectedAccessory(opt.id)}
                        className={`p-2 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 h-20 ${
                            selectedAccessory === opt.id 
                            ? 'border-sky-500 bg-sky-50 text-sky-800'
                            : 'border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <span className="text-2xl">{opt.icon}</span>
                        <span className="text-[10px] font-bold leading-tight text-center">{opt.label}</span>
                    </button>
                ))}
            </div>
          </div>
          
          <div className="pt-2">
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded border-gray-300 text-garden-600 focus:ring-garden-500"
                    checked={isMicEnabled}
                    onChange={(e) => {
                        if (e.target.checked) handleMicRequest();
                        else {
                            setMediaStream(null);
                            setIsMicEnabled(false);
                        }
                    }}
                  />
                  <div className="flex-1 flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">Enable Microphone for Voice Chat</span>
                      {isMicEnabled ? <Mic size={18} className="text-garden-600" /> : <MicOff size={18} className="text-gray-400" />}
                  </div>
              </label>
              <p className="text-xs text-gray-400 mt-1 pl-1">Recommended: Enable mic now to ensure voice chat works immediately.</p>
          </div>

          <button
            onClick={handleStart}
            disabled={!name.trim()}
            className="w-full py-4 bg-garden-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-garden-700 transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed mt-2"
          >
            Enter the Garden 🌿
          </button>
        </div>
      </div>
    </div>
  );
};

export default CharacterSelection;