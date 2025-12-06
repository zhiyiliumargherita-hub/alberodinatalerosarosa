
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { InteractionConfig, AppState } from '../types';
import { COLORS, randomRange, getRandomColor } from '../constants';

interface GoldDustProps {
  appState: AppState;
  mousePosRef: React.MutableRefObject<THREE.Vector3>;
  config: InteractionConfig;
}

export const GoldDust: React.FC<GoldDustProps> = ({ appState, mousePosRef, config }) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  // Init Particles
  const { positions, velocities, homePositions } = useMemo(() => {
    const count = config.goldDustCount;
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const home = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const tempColor = new THREE.Color();
    const dustPalette = ['#FFD700', '#FFC0CB', '#FFFFFF']; // Gold, Pink, White

    for (let i = 0; i < count; i++) {
      // Random cloud
      const r = 20 * Math.cbrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      
      home[i * 3] = x;
      home[i * 3 + 1] = y;
      home[i * 3 + 2] = z;

      const c = getRandomColor(dustPalette);
      tempColor.set(c);
      colors[i*3] = tempColor.r;
      colors[i*3+1] = tempColor.g;
      colors[i*3+2] = tempColor.b;
    }

    return { 
      positions: pos, 
      velocities: vel, 
      homePositions: home,
      colors: colors 
    };
  }, [config.goldDustCount]);

  useFrame((state) => {
    if (!pointsRef.current) return;

    const positionsAttr = pointsRef.current.geometry.attributes.position;
    const array = positionsAttr.array as Float32Array;
    const mouse = mousePosRef.current;
    
    const time = state.clock.elapsedTime;

    for (let i = 0; i < config.goldDustCount; i++) {
      const idx = i * 3;
      let px = array[idx];
      let py = array[idx + 1];
      let pz = array[idx + 2];
      
      let vx = velocities[idx];
      let vy = velocities[idx + 1];
      let vz = velocities[idx + 2];

      // 1. Hover/Repulsion Force
      const dx = px - mouse.x;
      const dy = py - mouse.y;
      const dz = pz - mouse.z;
      const distSq = dx*dx + dy*dy + dz*dz;
      const dist = Math.sqrt(distSq);

      if (dist < config.repulsionRadius) {
        const force = (1.0 - dist / config.repulsionRadius) * config.repulsionStrength * 0.2;
        vx += (dx / dist) * force;
        vy += (dy / dist) * force;
        vz += (dz / dist) * force;
      }

      // 2. Return to Home (Elasticity)
      const hx = homePositions[idx];
      const hy = homePositions[idx + 1];
      const hz = homePositions[idx + 2];

      // If Scatter, home is wider
      const scale = appState === AppState.SCATTERED ? 1.5 : 1.0;
      
      // Gentle orbit noise
      const noiseX = Math.sin(time * 0.5 + i) * 0.05;
      const noiseY = Math.cos(time * 0.3 + i) * 0.05;

      vx += (hx * scale + noiseX - px) * 0.02;
      vy += (hy * scale + noiseY - py) * 0.02;
      vz += (hz * scale - pz) * 0.02;

      // 3. Apply Damping
      vx *= 0.92;
      vy *= 0.92;
      vz *= 0.92;

      // 4. Update
      array[idx] = px + vx;
      array[idx + 1] = py + vy;
      array[idx + 2] = pz + vz;

      // Save velocity
      velocities[idx] = vx;
      velocities[idx + 1] = vy;
      velocities[idx + 2] = vz;
    }

    positionsAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={positions.length / 3} // Reuse length
          array={useMemo(() => {
              // Re-create color array to match useMemo logic above for correct render
              const arr = new Float32Array(config.goldDustCount * 3);
              const dustPalette = ['#FFD700', '#FFC0CB', '#FFFFFF'];
              const tempColor = new THREE.Color();
              for(let i=0; i<config.goldDustCount; i++) {
                 tempColor.set(getRandomColor(dustPalette));
                 arr[i*3] = tempColor.r;
                 arr[i*3+1] = tempColor.g;
                 arr[i*3+2] = tempColor.b;
              }
              return arr;
          }, [config.goldDustCount])} 
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial 
        size={0.15} 
        vertexColors 
        transparent 
        opacity={0.8} 
        blending={THREE.AdditiveBlending} 
        depthWrite={false}
      />
    </points>
  );
};
