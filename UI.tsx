
import React from 'react';
import { AppState } from '../types';

interface UIProps {
  appState: AppState;
  setAppState: (state: AppState) => void;
}

export const UI: React.FC<UIProps> = ({ appState, setAppState }) => {
  const isTree = appState === AppState.TREE_SHAPE;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-end p-8 z-10">
      
      {/* Footer / Controls */}
      <footer className="mb-8 flex flex-col items-center gap-4 w-full">
        <div className="pointer-events-auto">
          <button
            onClick={() => setAppState(isTree ? AppState.SCATTERED : AppState.TREE_SHAPE)}
            className={`
              relative overflow-hidden group px-10 py-4 rounded-full 
              border border-pink-400/30 backdrop-blur-md 
              transition-all duration-700 ease-out
              ${isTree ? 'bg-pink-900/40' : 'bg-transparent'}
              hover:bg-pink-800/50 hover:border-pink-300
              shadow-[0_0_30px_rgba(240,131,162,0.2)]
            `}
          >
            <span className={`
              relative z-10 font-serif text-lg tracking-widest text-pink-50 
              transition-all duration-500
            `}>
              {isTree ? "SCATTER DREAMS" : "ASSEMBLE TREE"}
            </span>
            
            {/* Inner Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
          </button>
        </div>
        
        <div className="text-pink-400/40 text-xs font-light tracking-widest mt-4">
          DRAG TO ROTATE &bull; SCROLL TO ZOOM
        </div>
      </footer>
    </div>
  );
};
