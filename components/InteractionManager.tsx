
import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CameraTarget, InteractionConfig } from '../types';

interface InteractionManagerProps {
  handData: React.MutableRefObject<{ 
    x: number; 
    y: number; 
    isPinching: boolean; 
    isFist: boolean; 
    present: boolean 
  }>;
  setCameraTarget: React.Dispatch<React.SetStateAction<CameraTarget>>;
  interactionConfig: InteractionConfig;
  mousePosRef: React.MutableRefObject<THREE.Vector3>; // Shared ref for other components to read 3D mouse pos
}

export const InteractionManager: React.FC<InteractionManagerProps> = ({ 
  handData, 
  setCameraTarget, 
  interactionConfig,
  mousePosRef 
}) => {
  const { camera, raycaster, size } = useThree();
  const planeGeo = new THREE.PlaneGeometry(100, 100);
  const dummyMesh = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial());
  
  // Ref for tracking rotation drag
  const lastPinchRef = useRef<{ x: number, y: number } | null>(null);
  const currentRot = useRef({ az: 0, pol: Math.PI / 2 });

  useFrame(() => {
    const { x, y, isPinching, present } = handData.current;
    
    // 1. Raycast to find 3D position of hand on Z=0 plane (approx tree center)
    if (present) {
      // Convert 0..1 (video space) to -1..1 (NDC)
      // Video is mirrored, so x becomes -(x*2-1) or just (1-x)*2 - 1
      const ndcX = (1 - x) * 2 - 1;
      const ndcY = -(y * 2 - 1); // Flip Y

      raycaster.setFromCamera({ x: ndcX, y: ndcY }, camera);
      
      const target = new THREE.Vector3();
      // Intersect with a virtual plane at z=0 facing camera
      const planeNormal = new THREE.Vector3(0, 0, 1);
      const planeConstant = 0;
      const plane = new THREE.Plane(planeNormal, planeConstant);
      
      raycaster.ray.intersectPlane(plane, target);
      
      // Update shared ref (Smoothing could be added here)
      mousePosRef.current.lerp(target, 0.2);
    } else {
      // Move interaction point far away if hand not present
      mousePosRef.current.lerp(new THREE.Vector3(1000, 1000, 1000), 0.1);
    }

    // 2. Pinch Rotation Logic
    if (isPinching && present) {
      if (!lastPinchRef.current) {
        lastPinchRef.current = { x, y }; // Start Drag
      } else {
        const dx = x - lastPinchRef.current.x;
        const dy = y - lastPinchRef.current.y;

        // Invert X because video is mirrored
        const speed = interactionConfig.rotationSpeed * 5.0;
        
        currentRot.current.az += -dx * speed; 
        currentRot.current.pol -= dy * speed;
        
        // Clamp Polar
        currentRot.current.pol = THREE.MathUtils.clamp(currentRot.current.pol, 0.1, 3.0);

        setCameraTarget({
          azimuth: currentRot.current.az,
          polar: currentRot.current.pol,
          active: true
        });

        lastPinchRef.current = { x, y };
      }
    } else {
      lastPinchRef.current = null;
    }
  });

  return null; // Logic only
};
