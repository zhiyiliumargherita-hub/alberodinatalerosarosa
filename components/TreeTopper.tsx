
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AppState } from '../types';
import { CONFIG, COLORS } from '../constants';
import { easing } from 'maath';

interface TopperProps {
    appState: AppState;
}

export const TreeTopper: React.FC<TopperProps> = ({ appState }) => {
    const groupRef = useRef<THREE.Group>(null);
    const lightRef = useRef<THREE.PointLight>(null);

    // Create Star Geometry
    const starGeo = useMemo(() => {
        const shape = new THREE.Shape();
        const points = 5;
        const outerRadius = 1.6;
        const innerRadius = 0.7;
        
        for (let i = 0; i < points * 2; i++) {
            const angle = (i * Math.PI) / points - Math.PI / 2; // Rotate to point up
            const r = i % 2 === 0 ? outerRadius : innerRadius;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            if (i === 0) shape.moveTo(x, y);
            else shape.lineTo(x, y);
        }
        shape.closePath();

        const extrudeSettings = { 
            depth: 0.4, 
            bevelEnabled: true, 
            bevelThickness: 0.1, 
            bevelSize: 0.05, 
            bevelSegments: 2 
        };
        const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geo.center();
        return geo;
    }, []);

    useFrame((state, delta) => {
        const time = state.clock.elapsedTime;
        const isTree = appState === AppState.TREE_SHAPE;
        
        if (groupRef.current) {
            const targetY = CONFIG.TREE_HEIGHT / 2 + 1.2; // Top of tree
            const targetScale = 1;

            // Position - Fast fly out/in
            easing.damp3(
                groupRef.current.position, 
                isTree ? [0, targetY, 0] : [0, targetY + 20, 0], // Fly away higher
                0.3, // Faster response
                delta
            );

            // Scale
            easing.damp(
                groupRef.current.scale,
                'x',
                isTree ? targetScale : 0,
                0.3, // Faster response
                delta
            );
            groupRef.current.scale.y = groupRef.current.scale.x;
            groupRef.current.scale.z = groupRef.current.scale.x;

            // Rotation
            groupRef.current.rotation.y = time * 0.5;
        }
        
        // Pulse Light
        if (lightRef.current) {
            lightRef.current.intensity = 4.0 + Math.sin(time * 3) * 1.5;
        }
    });

    // Use Pale Pink for the "Glowing" effect
    const starColor = COLORS.PALE_PINKS[0]; 

    return (
        <group ref={groupRef}>
            {/* Main Body - Pale Pink - High Emissive for Bloom Glow */}
            <mesh geometry={starGeo}>
                <meshStandardMaterial 
                    color={starColor} 
                    roughness={0.2} 
                    metalness={0.5}      
                    envMapIntensity={2.0} 
                    emissive={starColor} 
                    emissiveIntensity={6.0} // High intensity for blinding glow
                    toneMapped={false}
                />
            </mesh>
            
            {/* Back Glow Light */}
            <pointLight ref={lightRef} distance={15} color={starColor} decay={2} intensity={6} />
        </group>
    );
};
