
import * as THREE from 'three';

export const COLORS = {
  // Barbie / Luxury Palette
  HOT_PINKS: ['#FF007F', '#FF1493', '#E0115F', '#D6006E'], // Magenta, Deep Pink
  PALE_PINKS: ['#FFC0CB', '#FFB7C5', '#F8C8DC', '#FFD1DC'], // Classic Barbie Pale
  SILVERS: ['#FFFFFF', '#E8E8E8', '#D3D3D3', '#C0C0C0'], // High Gloss Silver
  
  // Accents for Ribbon/Edges
  ACCENTS: ['#FFF8DC', '#FFD700', '#FFFFFF', '#FFEFD5'], // Gold, Warm White
  
  // Background - Deep Raspberry/Purple instead of Black
  BG_GRADIENT: ['#590D38', '#2B0515'], 
};

export const CONFIG = {
  FOLIAGE_COUNT: 5500, 
  RIBBON_PARTICLE_COUNT: 2500, 
  TREE_HEIGHT: 14,
  TREE_RADIUS_BASE: 5.5,
  SCATTER_RADIUS: 25,
};

export const INTERACTION_DEFAULTS = {
  repulsionStrength: 5.0,
  repulsionRadius: 8.0,
  rotationSpeed: 2.0,
  goldDustCount: 1500,
};

// Helper to get random color from palette
export const getRandomColor = (palette: string[]) => {
  return palette[Math.floor(Math.random() * palette.length)];
};

export const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;
