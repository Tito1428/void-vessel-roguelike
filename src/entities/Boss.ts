import * as THREE from 'three';
import { Entity } from './Entity.ts';
import { EnemyType } from '../core/Types.ts';
import { MeshFactory } from '../graphics/MeshFactory.ts';
import { Projectile } from './Projectile.ts';
import { SoundManager } from '../core/Audio.ts';
import { ParticleSystem } from '../systems/ParticleSystem.ts';
import { Enemy } from './Enemy.ts';

export class Boss extends Entity {
  public name: string = 'Malakor, The Weeping Titan';
  public phase: number = 1;
  public parts: Record<string, THREE.Object3D>;
  public touchDamage: number = 2;

  private attackTimer: number = 0;
  private attackState: 'IDLE' | 'WINDUP_SLAM' | 'SLAM' | 'SPIRAL' = 'IDLE';
  private spiralAngle: number = 0;
  private particles: ParticleSystem;

  constructor(scene: THREE.Scene, position: THREE.Vector3) {
    const factory = MeshFactory.get();
    const { root, parts } = factory.createEnemyMesh(EnemyType.BOSS_MALAKOR);

    super(scene, root, 1.8, 160);
    this.parts = parts;
    this.position.copy(position);
    this.particles = ParticleSystem.get();
  }

  public updateBoss(
    playerPos: THREE.Vector3,
    projectilesList: Projectile[],
    spawnEnemyCallback: (enemy: Enemy) => void,
    dt: number
  ) {
    this.attackTimer += dt;

    // Check phase transition
    if (this.phase === 1 && this.health <= this.maxHealth * 0.5) {
      this.phase = 2;
      SoundManager.get().playBossRoar();
      this.particles.createSparkBurst(this.position, 25);
      // Change core to raging purple/red
      if (this.parts.core instanceof THREE.Mesh) {
        (this.parts.core.material as THREE.MeshBasicMaterial).color.setHex(0xff0022);
      }
    }

    // Facing player
    const toPlayer = new THREE.Vector2(
      playerPos.x - this.position.x,
      playerPos.z - this.position.z
    );
    const toPlayerNorm = toPlayer.clone().normalize();
    this.mesh.rotation.y = THREE.MathUtils.lerp(
      this.mesh.rotation.y,
      Math.atan2(toPlayerNorm.x, toPlayerNorm.y),
      dt * 2.5
    );

    // Floating fists gentle idle animation
    const fistBob = Math.sin(performance.now() * 0.003) * 0.25;
    if (this.parts.leftFist) this.parts.leftFist.position.y = 2.0 + fistBob;
    if (this.parts.rightFist) this.parts.rightFist.position.y = 2.0 - fistBob;

    // Boss Attack Routines
    const attackInterval = this.phase === 1 ? 3.0 : 2.0;

    if (this.attackTimer >= attackInterval) {
      this.attackTimer = 0;
      const roll = Math.random();

      if (roll < 0.45) {
        this.executeGroundSlam(projectilesList);
      } else if (roll < 0.8) {
        this.executeRadialBurst(projectilesList);
      } else {
        // Summon 2 spiders
        SoundManager.get().playBossRoar();
        const offset1 = new THREE.Vector3(this.position.x - 3, 0, this.position.z);
        const offset2 = new THREE.Vector3(this.position.x + 3, 0, this.position.z);
        spawnEnemyCallback(new Enemy(this.scene, EnemyType.VOID_SPIDER, offset1));
        spawnEnemyCallback(new Enemy(this.scene, EnemyType.VOID_SPIDER, offset2));
        this.particles.createBloodSplatter(this.position, 12, 0xaa22ff);
      }
    }

    // Phase 2 continuous spiral bullet spray
    if (this.phase === 2) {
      this.spiralAngle += dt * 4.0;
      if (Math.random() < 0.2) {
        const dir = new THREE.Vector2(Math.cos(this.spiralAngle), Math.sin(this.spiralAngle));
        projectilesList.push(
          new Projectile(this.scene, {
            isPlayer: false,
            damage: 1,
            speed: 6.5,
            direction: dir,
            position: new THREE.Vector3(this.position.x, 1.8, this.position.z),
            scale: 0.9
          })
        );
      }
    }
  }

  private executeGroundSlam(projectilesList: Projectile[]) {
    SoundManager.get().playBossRoar();

    // Slam animation: elevate fists then slam
    if (this.parts.leftFist && this.parts.rightFist) {
      this.parts.leftFist.position.y = 4.0;
      this.parts.rightFist.position.y = 4.0;

      setTimeout(() => {
        if (this.parts.leftFist && this.parts.rightFist) {
          this.parts.leftFist.position.y = 0.5;
          this.parts.rightFist.position.y = 0.5;
        }

        SoundManager.get().playEnemyKill();
        this.particles.createDustPuff(this.position, 20);
        this.particles.createSparkBurst(this.position, 15);

        // 8-directional shockwave bullets
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const dir = new THREE.Vector2(Math.cos(angle), Math.sin(angle));
          projectilesList.push(
            new Projectile(this.scene, {
              isPlayer: false,
              damage: 1,
              speed: 7.5,
              direction: dir,
              position: new THREE.Vector3(this.position.x, 0.4, this.position.z),
              scale: 1.2
            })
          );
        }
      }, 400);
    }
  }

  private executeRadialBurst(projectilesList: Projectile[]) {
    SoundManager.get().playShoot(0.4);
    const count = this.phase === 1 ? 12 : 16;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const dir = new THREE.Vector2(Math.cos(angle), Math.sin(angle));
      projectilesList.push(
        new Projectile(this.scene, {
          isPlayer: false,
          damage: 1,
          speed: 5.8,
          direction: dir,
          position: new THREE.Vector3(this.position.x, 2.2, this.position.z),
          scale: 1.0
        })
      );
    }
  }

  protected override onDeath() {
    SoundManager.get().playBossRoar();
    SoundManager.get().playEnemyKill();
    this.particles.createBloodSplatter(this.position, 40, 0xaa0033);
    this.particles.createSparkBurst(this.position, 35);
  }
}
