
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AppState } from '../types';
import { CONFIG, getRandomColor, randomRange } from '../constants';
import { easing } from 'maath';

const RibbonParticleMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uMorphFactor: { value: 0 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    uMouse: { value: new THREE.Vector3(100,100,100) },
    uRepulseStrength: { value: 0 },
    uRepulseRadius: { value: 0 },
  },
  vertexShader: `
    uniform float uTime;
    uniform float uMorphFactor;
    uniform float uPixelRatio;
    uniform vec3 uMouse;
    uniform float uRepulseStrength;
    uniform float uRepulseRadius;

    attribute vec3 aScatterPos;
    attribute vec3 aTreePos;
    attribute vec3 aColor;
    attribute float aSize;
    attribute float aPhase;

    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      float t = uMorphFactor;
      vec3 pos = mix(aScatterPos, aTreePos, t);

      // Repulsion
      vec3 distVec = pos - uMouse;
      float dist = length(distVec);
      if (dist < uRepulseRadius) {
         float strength = (1.0 - dist / uRepulseRadius) * uRepulseStrength;
         pos += normalize(distVec) * strength;
      }

      float flow = sin(uTime * 2.0 + aPhase) * 0.1 * t;
      pos.y += flow;
      float scatterFloat = sin(uTime * 0.5 + aPhase) * 0.5 * (1.0 - t);
      pos += scatterFloat;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      gl_PointSize = aSize * uPixelRatio * (30.0 / -mvPosition.z);
      vColor = aColor;
      vAlpha = 0.6 + 0.4 * sin(uTime * 3.0 + aPhase);
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    varying float vAlpha;
    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      if (dist > 0.5) discard;
      float strength = 1.0 - (dist * 2.0);
      strength = pow(strength, 2.0);
      gl_FragColor = vec4(vColor, vAlpha * strength);
    }
  `
};

interface RibbonProps {
  appState: AppState;
  mousePosRef: React.MutableRefObject<THREE.Vector3>;
  repulsionConfig: { strength: number; radius: number };
}

export const Ribbon: React.FC<RibbonProps> = ({ appState, mousePosRef, repulsionConfig }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const shaderRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, scatterPositions, treePositions, colors, sizes, phases } = useMemo(() => {
    const count = CONFIG.RIBBON_PARTICLE_COUNT;
    const scatterPosArray = new Float32Array(count * 3);
    const treePosArray = new Float32Array(count * 3);
    const colorArray = new Float32Array(count * 3);
    const sizeArray = new Float32Array(count);
    const phaseArray = new Float32Array(count);
    const tempColor = new THREE.Color();
    const ribbonColors = ['#FFFFFF', '#FFD700', '#FFC0CB', '#FFFFFF']; 

    const height = CONFIG.TREE_HEIGHT;
    const radiusBase = CONFIG.TREE_RADIUS_BASE + 0.9;
    const turns = 5.5;

    for (let i = 0; i < count; i++) {
      const t = i / count; 
      const widthJitter = (Math.random() - 0.5) * 1.8; 
      const heightJitter = (Math.random() - 0.5) * 0.5;
      const angle = t * Math.PI * 2 * turns;
      const yBase = (t - 0.5) * height;
      const rBase = (1 - t) * radiusBase;

      treePosArray[i * 3] = (rBase + widthJitter) * Math.cos(angle);
      treePosArray[i * 3 + 1] = yBase + heightJitter;
      treePosArray[i * 3 + 2] = (rBase + widthJitter) * Math.sin(angle);

      const r = CONFIG.SCATTER_RADIUS * 1.5 * Math.cbrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      scatterPosArray[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      scatterPosArray[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      scatterPosArray[i * 3 + 2] = r * Math.cos(phi);

      const hex = getRandomColor(ribbonColors);
      tempColor.set(hex);
      colorArray[i * 3] = tempColor.r;
      colorArray[i * 3 + 1] = tempColor.g;
      colorArray[i * 3 + 2] = tempColor.b;

      sizeArray[i] = randomRange(4.0, 7.0);
      phaseArray[i] = Math.random() * Math.PI * 2;
    }

    return { positions: scatterPosArray, scatterPositions: scatterPosArray, treePositions: treePosArray, colors: colorArray, sizes: sizeArray, phases: phaseArray };
  }, []);

  useFrame((state, delta) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      const targetMorph = appState === AppState.TREE_SHAPE ? 1 : 0;
      easing.damp(shaderRef.current.uniforms.uMorphFactor, 'value', targetMorph, 0.3, delta);
      // Physics
      shaderRef.current.uniforms.uMouse.value.copy(mousePosRef.current);
      shaderRef.current.uniforms.uRepulseStrength.value = repulsionConfig.strength;
      shaderRef.current.uniforms.uRepulseRadius.value = repulsionConfig.radius;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aScatterPos" count={scatterPositions.length / 3} array={scatterPositions} itemSize={3} />
        <bufferAttribute attach="attributes-aTreePos" count={treePositions.length / 3} array={treePositions} itemSize={3} />
        <bufferAttribute attach="attributes-aColor" count={colors.length / 3} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-aSize" count={sizes.length} array={sizes} itemSize={1} />
        <bufferAttribute attach="attributes-aPhase" count={phases.length} array={phases} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial ref={shaderRef} args={[RibbonParticleMaterial]} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
};
