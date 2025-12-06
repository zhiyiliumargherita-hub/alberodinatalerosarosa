
import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AppState, OrnamentData } from '../types';
import { CONFIG, randomRange } from '../constants';
import { easing } from 'maath';

interface OrnamentsProps {
  appState: AppState;
}

// Geometries
const lightGeo = new THREE.SphereGeometry(0.25, 8, 8);

export const Ornaments: React.FC<OrnamentsProps> = ({ appState }) => {
  const lightRef = useRef<THREE.InstancedMesh>(null);

  // Helper to generate data
  const generateData = (count: number, type: OrnamentData['type']): OrnamentData[] => {
    const data: OrnamentData[] = [];
    for (let i = 0; i < count; i++) {
      // Tree Pos
      const hNorm = Math.random(); 
      const yPos = (hNorm - 0.5) * CONFIG.TREE_HEIGHT;
      const radiusAtHeight = (1 - hNorm) * CONFIG.TREE_RADIUS_BASE * 0.9; // Slightly inside
      const angle = Math.random() * Math.PI * 2;
      
      const tx = radiusAtHeight * Math.cos(angle);
      const ty = yPos;
      const tz = radiusAtHeight * Math.sin(angle);

      // Scatter Pos
      const r = CONFIG.SCATTER_RADIUS * 1.2 * Math.cbrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const sx = r * Math.sin(phi) * Math.cos(theta);
      const sy = r * Math.sin(phi) * Math.sin(theta);
      const sz = r * Math.cos(phi);

      let color = '#FFFFFF';
      let scale = 1;

      if (type === 'light') {
        // Bright White lights
        color = '#FFFFFF';
        scale = randomRange(0.3, 0.5); 
      }

      data.push({
        id: `${type}-${i}`,
        type,
        scatterPos: [sx, sy, sz],
        treePos: [tx, ty, tz],
        color,
        scale,
        rotationSpeed: [Math.random(), Math.random(), Math.random()]
      });
    }
    return data;
  };

  // Distribution - Only lights now
  const lights = useMemo(() => generateData(250, 'light'), []);

  const tempObj = new THREE.Object3D();
  const tempColor = new THREE.Color();

  // Set colors initially
  useEffect(() => {
    const setColors = (ref: React.RefObject<THREE.InstancedMesh>, data: OrnamentData[]) => {
      if (ref.current) {
        data.forEach((d, i) => {
          tempColor.set(d.color);
          ref.current!.setColorAt(i, tempColor);
        });
        ref.current.instanceColor!.needsUpdate = true;
      }
    };
    setColors(lightRef, lights);
  }, []);

  const morphRef = useRef(0);

  useFrame((state, delta) => {
    const target = appState === AppState.TREE_SHAPE ? 1 : 0;
    // Fast damping (0.25s)
    easing.damp(morphRef, 'current', target, 0.25, delta);
    const t = morphRef.current;
    const time = state.clock.elapsedTime;

    const updateMesh = (ref: React.RefObject<THREE.InstancedMesh>, data: OrnamentData[], floatIntensity: number) => {
      if (!ref.current) return;
      
      data.forEach((d, i) => {
        const { scatterPos, treePos, rotationSpeed, scale } = d;
        
        // Pos
        tempObj.position.set(
          THREE.MathUtils.lerp(scatterPos[0], treePos[0], t),
          THREE.MathUtils.lerp(scatterPos[1], treePos[1], t),
          THREE.MathUtils.lerp(scatterPos[2], treePos[2], t)
        );

        // Scatter Float
        if (t < 0.95) {
           tempObj.position.y += Math.sin(time + d.id.charCodeAt(0)) * floatIntensity * (1 - t);
           tempObj.position.x += Math.cos(time * 0.5 + i) * floatIntensity * 0.5 * (1 - t);
        }

        // Rotate
        tempObj.rotation.x = time * rotationSpeed[0];
        tempObj.rotation.y = time * rotationSpeed[1];
        tempObj.rotation.z = time * rotationSpeed[2];

        // Scale
        let s = scale;
        // Lights blink
        if (d.type === 'light') {
            s *= (0.8 + 0.4 * Math.sin(time * 4 + i * 10)); // Faster blinking
        }
        
        tempObj.scale.setScalar(s * (0.5 + 0.5 * t)); 

        tempObj.updateMatrix();
        ref.current!.setMatrixAt(i, tempObj.matrix);
      });
      ref.current.instanceMatrix.needsUpdate = true;
    };

    updateMesh(lightRef, lights, 4.0);
  });

  return (
    <group>
      {/* Lights: Bright White */}
      <instancedMesh ref={lightRef} args={[lightGeo, undefined, lights.length]}>
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  );
};
