
import React, { useState, useRef } from 'react';
import { Experience } from './components/Experience';
import { UI } from './components/UI';
import { HandController } from './components/HandController';
import { GUI } from './components/GUI';
import { AppState, CameraTarget, InteractionConfig } from './types';
import { INTERACTION_DEFAULTS } from './constants';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.TREE_SHAPE);
  const [cameraTarget, setCameraTarget] = useState<CameraTarget>({ 
    azimuth: 0, polar: Math.PI / 2, active: false 
  });
  
  // Real-time Interaction Params
  const [interactionConfig, setInteractionConfig] = useState<InteractionConfig>(INTERACTION_DEFAULTS);

  // High-freq hand data (Ref to avoid re-renders)
  const handDataRef = useRef({ x: 0.5, y: 0.5, isPinching: false, isFist: false, present: false });

  return (
    <div className="relative w-full h-screen bg-[#4A0E2E]">
      <Experience 
        appState={appState} 
        cameraTarget={cameraTarget} 
        setCameraTarget={setCameraTarget}
        interactionConfig={interactionConfig}
        handData={handDataRef}
      />
      
      <UI appState={appState} setAppState={setAppState} />
      
      <GUI config={interactionConfig} setConfig={setInteractionConfig} />
      
      <HandController 
        currentAppState={appState}
        setAppState={setAppState} 
        onHandUpdate={(data) => {
          handDataRef.current = data;
        }}
      />
    </div>
  );
};

export default App;
