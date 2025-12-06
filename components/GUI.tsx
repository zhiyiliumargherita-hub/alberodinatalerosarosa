
import React from 'react';
import { InteractionConfig } from '../types';

interface GUIProps {
  config: InteractionConfig;
  setConfig: React.Dispatch<React.SetStateAction<InteractionConfig>>;
}

export const GUI: React.FC<GUIProps> = ({ config, setConfig }) => {
  const handleChange = (key: keyof InteractionConfig, value: number) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="absolute top-8 right-8 z-50 w-64 p-4 rounded-xl backdrop-blur-md bg-pink-900/30 border border-pink-500/30 shadow-lg text-pink-100 font-sans pointer-events-auto">
      <h3 className="text-xs font-bold tracking-widest uppercase mb-4 text-pink-200 border-b border-pink-500/20 pb-2">
        Interaction Tuner
      </h3>
      
      <div className="space-y-4">
        {/* Repulsion Strength */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] uppercase tracking-wide opacity-70">
            <label>Repulsion Force</label>
            <span>{config.repulsionStrength.toFixed(1)}</span>
          </div>
          <input 
            type="range" min="0" max="15" step="0.1"
            value={config.repulsionStrength}
            onChange={(e) => handleChange('repulsionStrength', parseFloat(e.target.value))}
            className="w-full h-1 bg-pink-900/50 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400"
          />
        </div>

        {/* Repulsion Radius */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] uppercase tracking-wide opacity-70">
            <label>Field Radius</label>
            <span>{config.repulsionRadius.toFixed(1)}</span>
          </div>
          <input 
            type="range" min="1" max="15" step="0.5"
            value={config.repulsionRadius}
            onChange={(e) => handleChange('repulsionRadius', parseFloat(e.target.value))}
            className="w-full h-1 bg-pink-900/50 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400"
          />
        </div>

        {/* Rotation Speed */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] uppercase tracking-wide opacity-70">
            <label>Pinch Rot Speed</label>
            <span>{config.rotationSpeed.toFixed(1)}</span>
          </div>
          <input 
            type="range" min="0.5" max="5" step="0.1"
            value={config.rotationSpeed}
            onChange={(e) => handleChange('rotationSpeed', parseFloat(e.target.value))}
            className="w-full h-1 bg-pink-900/50 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400"
          />
        </div>
      </div>
    </div>
  );
};
