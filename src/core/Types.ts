import * as THREE from 'three';

export enum RoomType {
  SPAWN = 'SPAWN',
  COMBAT = 'COMBAT',
  TREASURE = 'TREASURE',
  SHOP = 'SHOP',
  BOSS = 'BOSS',
  SECRET = 'SECRET'
}

export enum Direction {
  NORTH = 'NORTH',
  SOUTH = 'SOUTH',
  EAST = 'EAST',
  WEST = 'WEST'
}

export const DIRECTION_OFFSETS: Record<Direction, { x: number; y: number }> = {
  [Direction.NORTH]: { x: 0, y: -1 },
  [Direction.SOUTH]: { x: 0, y: 1 },
  [Direction.EAST]: { x: 1, y: 0 },
  [Direction.WEST]: { x: -1, y: 0 }
};

export const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  [Direction.NORTH]: Direction.SOUTH,
  [Direction.SOUTH]: Direction.NORTH,
  [Direction.EAST]: Direction.WEST,
  [Direction.WEST]: Direction.EAST
};

export enum EnemyType {
  VOID_SPIDER = 'VOID_SPIDER',
  WEEPING_SPECTER = 'WEEPING_SPECTER',
  BILE_SPITTER = 'BILE_SPITTER',
  GRAVE_CHARGER = 'GRAVE_CHARGER',
  BOSS_MALAKOR = 'BOSS_MALAKOR'
}

export enum PickupType {
  COIN = 'COIN',
  COIN_GOLD = 'COIN_GOLD',
  HEART_HALF = 'HEART_HALF',
  HEART_FULL = 'HEART_FULL',
  KEY = 'KEY',
  BOMB = 'BOMB',
  RELIC = 'RELIC',
  CHEST = 'CHEST',
  TRAPDOOR = 'TRAPDOOR'
}

export interface RelicDef {
  id: string;
  name: string;
  tagline: string;
  description: string;
  iconIndex: number;
  color: number;
  statBonus?: {
    damage?: number;
    fireRate?: number; // lower delay = faster
    moveSpeed?: number;
    shotSpeed?: number;
    maxHealth?: number;
    health?: number;
    tearsCount?: number;
    isBouncy?: boolean;
    isSpectral?: boolean;
    hasOrbital?: boolean;
    vampiric?: boolean;
    bloodSigil?: boolean;
  };
}

export interface Hitbox {
  radius: number;
  height: number;
}

export interface AABB {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface PlayerStats {
  maxHealth: number; // in half-hearts, e.g. 6 = 3 hearts
  health: number;
  damage: number;
  fireRate: number; // seconds delay between shots
  shotSpeed: number;
  range: number;
  moveSpeed: number;
  coins: number;
  keys: number;
  bombs: number;
  relics: RelicDef[];
  // Modifiers
  tearsCount: number;
  isBouncy: boolean;
  isSpectral: boolean;
  hasOrbital: boolean;
  vampiric: boolean;
  bloodSigil: boolean;
}

export enum GameState {
  TITLE = 'TITLE',
  PLAYING = 'PLAYING',
  ROOM_TRANSITION = 'ROOM_TRANSITION',
  ITEM_POPUP = 'ITEM_POPUP',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}
