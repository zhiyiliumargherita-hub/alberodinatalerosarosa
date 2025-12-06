
import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Float } from '@react-three/drei';
import { EffectComposer, Bloom, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';
import { easing } from 'maath';
import { Foliage } from './Foliage';
import { Ornaments } from './Ornaments';
import { Ribbon } from './Ribbon';
import { TreeTopper } from './TreeTopper';
import { GoldDust } from './GoldDust';
import { InteractionManager } from './InteractionManager';
import { AppState, CameraTarget, InteractionConfig } from '../types';

interface ExperienceProps {
  appState: AppState;
  cameraTarget: CameraTarget;
  setCameraTarget: React.Dispatch<React.SetStateAction<CameraTarget>>;
  interactionConfig: InteractionConfig;
  handData: React.MutableRefObject<{ x: number; y: number; isPinching: boolean; isFist: boolean; present: boolean }>;
}

const CameraController: React.FC<{ target: CameraTarget }> = ({ target }) => {
  const controlsRef = useRef<any>(null);

  useFrame((state, delta) => {
    if (target.active && controlsRef.current) {
      easing.damp(controlsRef.current, 'azimuthAngle', target.azimuth, 0.5, delta);
      easing.damp(controlsRef.current, 'polarAngle', target.polar, 0.5, delta);
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls 
      ref={controlsRef}
      enablePan={false} 
      minDistance={10} 
      maxDistance={50} 
      autoRotate={!target.active} 
      autoRotateSpeed={0.5}
      makeDefault
    />
  );
};

const SceneContent: React.FC<ExperienceProps> = ({ 
  appState, cameraTarget, setCameraTarget, interactionConfig, handData 
}) => {
  // Shared ref for the 3D position of the hand/interaction point
  const mousePosRef = useRef(new THREE.Vector3(100, 100, 100));

  const repulsionConfig = { 
    strength: interactionConfig.repulsionStrength, 
    radius: interactionConfig.repulsionRadius 
  };

  return (
    <>
      <color attach="background" args={['#4A0E2E']} />
      <fog attach="fog" args={['#4A0E2E', 20, 90]} />
      
      <ambientLight intensity={0.8} color="#FFD1DC" />
      <pointLight position={[10, 10, 10]} intensity={2.0} color="#FFFFFF" />
      <pointLight position={[-10, 5, -10]} intensity={2.0} color="#FF007F" />
      <spotLight position={[0, 25, 5]} angle={0.6} penumbra={0.5} intensity={3} color="#E8E8E8" />

      {/* Logic Components */}
      <InteractionManager 
        handData={handData} 
        setCameraTarget={setCameraTarget} 
        interactionConfig={interactionConfig}
        mousePosRef={mousePosRef}
      />

      <group position={[0, -2, 0]}>
         <Float speed={1} rotationIntensity={0.1} floatIntensity={0.2}>
            <Foliage appState={appState} mousePosRef={mousePosRef} repulsionConfig={repulsionConfig} />
            <Ornaments appState={appState} />
            <Ribbon appState={appState} mousePosRef={mousePosRef} repulsionConfig={repulsionConfig} />
            <TreeTopper appState={appState} />
            <GoldDust appState={appState} mousePosRef={mousePosRef} config={interactionConfig} />
         </Float>
      </group>

      <Stars radius={100} depth={50} count={3000} factor={4} saturation={1} fade speed={1} />

      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={0.65} luminanceSmoothing={0.7} height={300} intensity={1.5} radius={0.8} />
        <Noise opacity={0.03} />
      </EffectComposer>

      <CameraController target={cameraTarget} />
    </>
  );
};

export const Experience: React.FC<ExperienceProps> = (props) => {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 22], fov: 45, near: 0.1, far: 200 }}
      gl={{ antialias: false, alpha: false, stencil: false, depth: true }}
    >
      <Suspense fallback={null}>
        <SceneContent {...props} />
      </Suspense>
    </Canvas>
  );
};
