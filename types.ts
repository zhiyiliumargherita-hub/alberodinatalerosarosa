
export enum AppState {
  SCATTERED = 'SCATTERED',
  TREE_SHAPE = 'TREE_SHAPE',
}

export interface Position3 {
  x: number;
  y: number;
  z: number;
}

export interface ParticleData {
  scatterPos: [number, number, number];
  treePos: [number, number, number];
  color: string;
  size: number;
  speed: number;
  phase: number;
}

export interface OrnamentData {
  id: string;
  type: 'light' | 'crystal';
  scatterPos: [number, number, number];
  treePos: [number, number, number];
  color: string;
  scale: number;
  rotationSpeed: [number, number, number];
}

export interface CameraTarget {
  azimuth: number; // Horizontal rotation (radians)
  polar: number;   // Vertical rotation (radians)
  active: boolean; // Is hand control active?
}

// GUI Parameters for interaction tuning
export interface InteractionConfig {
  repulsionStrength: number;
  repulsionRadius: number;
  rotationSpeed: number;
  goldDustCount: number;
}
