import * as THREE from 'three';
import { PickupType, RelicDef } from '../core/Types.ts';
import { Pickup } from '../entities/Pickup.ts';

export const ALL_RELICS: RelicDef[] = [
  {
    id: 'cosmic_eye',
    name: 'Tomo del Tri-Fuego',
    tagline: '¡Ráfaga de Maná!',
    description: 'Canaliza 3 proyectiles de magia arcana en abanico e incrementa el daño.',
    iconIndex: 1,
    color: 0x38bdf8,
    statBonus: {
      tearsCount: 3,
      damage: 1.0,
      fireRate: 0.9
    }
  },
  {
    id: 'blood_chalice',
    name: 'Cáliz del Nigromante',
    tagline: 'Drenaje Vital',
    description: 'Aumenta el poder de tus hechizos y absorbe esencia vital al derrotar enemigos.',
    iconIndex: 2,
    color: 0xef4444,
    statBonus: {
      damage: 1.5,
      vampiric: true
    }
  },
  {
    id: 'winged_boots',
    name: 'Botas de Éter',
    tagline: 'Levitación Arcana',
    description: 'Aumenta significativamente la velocidad de desplazamiento y dash.',
    iconIndex: 3,
    color: 0xfacc15,
    statBonus: {
      moveSpeed: 2.5
    }
  },
  {
    id: 'orbital_wisp',
    name: 'Fuego Fatuo Protector',
    tagline: 'Escudo Astral',
    description: 'Un orbe estelar orbita a tu alrededor desintegrando proyectiles enemigos.',
    iconIndex: 4,
    color: 0xc084fc,
    statBonus: {
      hasOrbital: true
    }
  },
  {
    id: 'cursed_skull',
    name: 'Cráneo del Hechicero',
    tagline: 'Poder Prohibido',
    description: 'Incremento devastador de daño mágico a cambio de vitalidad.',
    iconIndex: 5,
    color: 0x4ade80,
    statBonus: {
      damage: 2.8,
      shotSpeed: 2.0
    }
  },
  {
    id: 'bouncy_pearl',
    name: 'Orbe Cinético',
    tagline: 'Rebote de Plasma',
    description: 'Tus proyectiles mágicos rebotan en muros y obstáculos conservando energía.',
    iconIndex: 6,
    color: 0xf472b6,
    statBonus: {
      isBouncy: true,
      damage: 0.5
    }
  },
  {
    id: 'spectral_dagger',
    name: 'Daga de Fase Espectral',
    tagline: 'Magia Intangible',
    description: 'Tus hechizos atraviesan rocas y columnas sólidas sin detenerse.',
    iconIndex: 7,
    color: 0x2dd4bf,
    statBonus: {
      isSpectral: true,
      fireRate: 0.85
    }
  },
  {
    id: 'blood_sigil',
    name: 'Sigilo de Sangre Rúnica',
    tagline: 'Furia Sobrenatural',
    description: 'Tus hechizos infligen el doble de daño cuando estás a punto de perecer.',
    iconIndex: 8,
    color: 0xb91c1c,
    statBonus: {
      bloodSigil: true
    }
  },
  {
    id: 'titan_heart',
    name: 'Corazón del Titán Rúnico',
    tagline: 'Vitalidad Inmortal',
    description: 'Otorga +2 contenedores de corazón permanentes y restaura toda tu esencia.',
    iconIndex: 9,
    color: 0xe11d48,
    statBonus: {
      maxHealth: 4,
      health: 6
    }
  }
];

export class LootSystem {
  private static instance: LootSystem;
  private availableRelics: RelicDef[] = [...ALL_RELICS];

  private constructor() {}

  public static get(): LootSystem {
    if (!LootSystem.instance) {
      LootSystem.instance = new LootSystem();
    }
    return LootSystem.instance;
  }

  public reset() {
    this.availableRelics = [...ALL_RELICS];
  }

  public getRandomRelic(): RelicDef {
    if (this.availableRelics.length === 0) {
      this.availableRelics = [...ALL_RELICS];
    }
    const idx = Math.floor(Math.random() * this.availableRelics.length);
    return this.availableRelics.splice(idx, 1)[0];
  }

  public rollEnemyDrop(scene: THREE.Scene, position: THREE.Vector3): Pickup | null {
    const roll = Math.random();
    // 40% chance of no drop
    if (roll < 0.40) return null;

    const offsetPos = position.clone();
    offsetPos.x += (Math.random() - 0.5) * 0.5;
    offsetPos.z += (Math.random() - 0.5) * 0.5;

    if (roll < 0.65) {
      return new Pickup(scene, PickupType.COIN, offsetPos);
    } else if (roll < 0.75) {
      return new Pickup(scene, PickupType.COIN_GOLD, offsetPos);
    } else if (roll < 0.85) {
      return new Pickup(scene, Math.random() < 0.6 ? PickupType.HEART_HALF : PickupType.HEART_FULL, offsetPos);
    } else if (roll < 0.92) {
      return new Pickup(scene, PickupType.BOMB, offsetPos);
    } else {
      return new Pickup(scene, PickupType.KEY, offsetPos);
    }
  }

  public spawnChest(scene: THREE.Scene, position: THREE.Vector3): Pickup {
    return new Pickup(scene, PickupType.CHEST, position);
  }

  public spawnChestLoot(scene: THREE.Scene, position: THREE.Vector3): Pickup[] {
    const drops: Pickup[] = [];
    // 2-3 coins + heart or bomb
    const count = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      const pos = position.clone();
      const angle = (i / count) * Math.PI * 2;
      pos.x += Math.cos(angle) * 1.2;
      pos.z += Math.sin(angle) * 1.2;
      drops.push(new Pickup(scene, Math.random() < 0.7 ? PickupType.COIN : PickupType.COIN_GOLD, pos));
    }

    const extraPos = position.clone();
    extraPos.z += 1.2;
    drops.push(new Pickup(scene, Math.random() < 0.5 ? PickupType.HEART_FULL : PickupType.BOMB, extraPos));

    return drops;
  }
}
