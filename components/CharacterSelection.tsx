import React, { useState } from 'react';
import { Canvas, ThreeElements } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Avatar from './Avatar';
import { CHARACTER_OPTIONS } from '../constants';
import { CharacterType, UserState } from '../types';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

interface Props {
  onComplete: (user: UserState) => void;
}

const CharacterSelection: React.FC<Props> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [selectedChar, setSelectedChar] = useState(CHARACTER_OPTIONS[0]);

  const handleStart = () => {
    if (name.trim()) {
      onComplete({
        name: name.trim(),
        characterType: selectedChar.type,
        color: selectedChar.color
      });
    }
  };

  return (
    <div className="w-full h-screen bg-gradient-to-br from-sky-300 to-garden-200 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-4xl flex flex-col md:flex-row gap-8 items-center">
        
        {/* Left: Preview */}
        <div className="w-full md:w-1/2 h-80 bg-gradient-to-b from-sky-200 to-garden-300 rounded-2xl overflow-hidden shadow-inner relative">
            <div className="absolute top-4 left-4 bg-white/50 px-3 py-1 rounded-full text-xs font-bold text-gray-600 z-10">
                Drag to rotate
            </div>
          <Canvas camera={{ position: [0, 0.5, 2.5], fov: 50 }}>
            <ambientLight intensity={0.8} />
            <directionalLight position={[2, 5, 2]} />
            <Avatar 
                type={selectedChar.type} 
                color={selectedChar.color} 
                position={[0, -1, 0]} 
                scale={1.2}
            />
            <OrbitControls enableZoom={false} minPolarAngle={Math.PI/4} maxPolarAngle={Math.PI/2} />
          </Canvas>
        </div>

        {/* Right: Form */}
        <div className="w-full md:w-1/2 space-y-6">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-extrabold text-gray-800">Welcome Visitor!</h1>
            <p className="text-gray-600 mt-2">Customize your look for the garden meeting.</p>
          </div>

          <div className="space-y-3">
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

          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-700">Choose Avatar</label>
            <div className="grid grid-cols-2 gap-3">
              {CHARACTER_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setSelectedChar(opt)}
                  className={`p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                    selectedChar.label === opt.label
                      ? 'border-garden-500 bg-garden-50 text-garden-700'
                      : 'border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: opt.color }}></div>
                  <span className="font-semibold text-sm">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={!name.trim()}
            className="w-full py-4 bg-garden-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-garden-700 transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed"
          >
            Enter the Garden 🌿
          </button>
        </div>
      </div>
    </div>
  );
};

export default CharacterSelection;