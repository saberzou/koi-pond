// config.js — Koi Pond constants
export const FISH_COUNT = 7;
export const FEAR_RADIUS = 150;
export const FEAR_FORCE = 8;
export const FEAR_DECAY = 0.96;
export const WANDER_SPEED = 0.8;
export const MAX_SPEED = 4;
export const TURN_RATE = 0.03;
export const TAIL_SPEED = 0.12;
export const RIPPLE_MAX_RADIUS = 120;
export const RIPPLE_DURATION = 60; // frames
export const FISH_COLORS = [
  { body: '#E8611A', spots: '#FFFFFF', belly: '#F5D6B8' }, // orange/white
  { body: '#C41E1E', spots: '#FFFFFF', belly: '#F0C8C8' }, // red/white
  { body: '#D4920B', spots: '#F5E6A3', belly: '#FFF5D6' }, // gold
  { body: '#1A1A1A', spots: '#E8611A', belly: '#4A3A2A' }, // black/orange
  { body: '#E85A1A', spots: '#D4920B', belly: '#FFFFFF' }, // orange/gold
  { body: '#C41E1E', spots: '#D4920B', belly: '#F5D6B8' }, // red/gold
  { body: '#F5F5F5', spots: '#C41E1E', belly: '#FFFFFF' }, // white/red
];
