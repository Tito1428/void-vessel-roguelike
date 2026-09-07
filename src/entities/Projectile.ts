import * as THREE from 'three';
import { MaterialsManager } from '../graphics/Materials.ts';
import { ParticleSystem } from '../systems/ParticleSystem.ts';
import { SoundManager } from '../core/Audio.ts';

export interface ProjectileConfig {
  isPlayer: boolean;
  damage: number;
  speed: number;
  direction: THREE.Vector2;
  position: THREE.Vector3;
  range?: number;
  isBouncy?: boolean;
  isSpectral?: boolean;
  scale?: number;
  color?: number;
}

export class Projectile {
  public mesh: THREE.Mesh;
  public velocity: THREE.Vector2 = new THREE.Vector2();
  public position: THREE.Vector3 = new THREE.Vector3();
  public isPlayer: boolean;
  public damage: number;
  public isBouncy: boolean;
  public isSpectral: boolean;
  public radius: number = 0.22;
  public isDead: boolean = false;
  public bouncesLeft: number = 0;

  private scene: THREE.Scene;
  private life: number = 0;
  private maxLife: number = 1.6;
  private initialY: number = 1.1;
  private particles: ParticleSystem;

  constructor(scene: THREE.Scene, config: ProjectileConfig) {
    this.scene = scene;
    this.isPlayer = config.isPlayer;
    this.damage = config.damage;
    this.isBouncy = config.isBouncy ?? false;
    this.isSpectral = config.isSpectral ?? false;
    this.bouncesLeft = this.isBouncy ? 2 : 0;
    this.particles = ParticleSystem.get();

    this.velocity.copy(config.direction).multiplyScalar(config.speed);
    this.position.copy(config.position);
    this.initialY = config.position.y || 1.1;

    const scale = config.scale || 1.0;
    this.radius *= scale;

    const mats = MaterialsManager.get();

    if (config.isPlayer) {
      // Arcane Magic Bolt: Faceted mana core with spinning rune ring
      const spellGroup = new THREE.Group();
      
      const coreGeo = new THREE.OctahedronGeometry(this.radius, 0);
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0x00f3ff,
        emissive: 0x00c8ff,
        emissiveIntensity: 1.4,
        roughness: 0.1,
        metalness: 0.8
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      spellGroup.add(core);

      const ringGeo = new THREE.TorusGeometry(this.radius * 1.35, 0.035, 5, 12);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      spellGroup.add(ring);

      this.mesh = spellGroup as unknown as THREE.Mesh;
    } else {
      // Corrupted Shadow / Blood Bullet
      const geo = new THREE.SphereGeometry(this.radius, 7, 7);
      this.mesh = new THREE.Mesh(geo, mats.enemyBulletMaterial);
    }

    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);
  }

  public update(dt: number) {
    if (this.isDead) return;

    this.life += dt;
    if (this.life >= this.maxLife) {
      this.impact();
      return;
    }

    // Move on XZ plane
    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.y * dt;

    // Magical hovering flight (no tear dropping!)
    this.position.y = this.initialY + Math.sin(this.life * 14) * 0.05;
    this.mesh.position.copy(this.position);

    // Spin magical core and rune ring
    this.mesh.rotation.x += dt * 8.0;
    this.mesh.rotation.y += dt * 10.0;

    // Magic particle trail
    if (this.isPlayer && Math.random() < 0.45) {
      this.particles.createMagicTrail(this.position);
    }
  }

  public bounce(normalX: number, normalZ: number) {
    if (this.bouncesLeft > 0) {
      this.bouncesLeft--;
      if (normalX !== 0) this.velocity.x = -this.velocity.x;
      if (normalZ !== 0) this.velocity.y = -this.velocity.y;
      SoundManager.get().playShoot(1.6);
      this.particles.createMagicBurst(this.position, 6, 0x00f3ff);
    } else {
      this.impact();
    }
  }

  public impact() {
    if (this.isDead) return;
    this.isDead = true;

    if (this.isPlayer) {
      this.particles.createMagicBurst(this.position, 12, 0x00f3ff);
      SoundManager.get().playEnemyHit();
    } else {
      this.particles.createBloodSplatter(this.position, 6, 0xaa22ff);
    }

    this.scene.remove(this.mesh);
  }

  public destroy() {
    this.isDead = true;
    this.scene.remove(this.mesh);
  }
}
