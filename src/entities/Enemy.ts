import * as THREE from 'three';
import { Entity } from './Entity.ts';
import { EnemyType } from '../core/Types.ts';
import { MeshFactory } from '../graphics/MeshFactory.ts';
import { Projectile } from './Projectile.ts';
import { SoundManager } from '../core/Audio.ts';
import { ParticleSystem } from '../systems/ParticleSystem.ts';

export class Enemy extends Entity {
  public type: EnemyType;
  public attackCooldown: number = 1.5;
  public parts: Record<string, THREE.Object3D>;
  public touchDamage: number = 1;

  // AI & Animation states
  protected aiTimer: number = 0;
  protected targetDir: THREE.Vector2 = new THREE.Vector2();
  protected moveSpeed: number = 3.5;
  protected particles: ParticleSystem;

  // Charger specific states
  protected isCharging: boolean = false;
  protected chargeWindup: number = 0;
  protected chargeDir: THREE.Vector2 = new THREE.Vector2();

  constructor(scene: THREE.Scene, type: EnemyType, position: THREE.Vector3) {
    const factory = MeshFactory.get();
    const { root, parts } = factory.createEnemyMesh(type);

    let radius = 0.5;
    let health = 10;
    let speed = 3.5;

    switch (type) {
      case EnemyType.VOID_SPIDER:
        radius = 0.45;
        health = 8;
        speed = 4.6;
        break;
      case EnemyType.WEEPING_SPECTER:
        radius = 0.55;
        health = 14;
        speed = 2.4;
        break;
      case EnemyType.BILE_SPITTER:
        radius = 0.7;
        health = 22;
        speed = 1.8;
        break;
      case EnemyType.GRAVE_CHARGER:
        radius = 0.65;
        health = 26;
        speed = 2.2;
        break;
    }

    super(scene, root, radius, health);
    this.type = type;
    this.parts = parts;
    this.moveSpeed = speed;
    this.position.copy(position);
    this.particles = ParticleSystem.get();
  }

  public updateAI(playerPos: THREE.Vector3, projectilesList: Projectile[], dt: number) {
    this.aiTimer += dt;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    const toPlayer = new THREE.Vector2(
      playerPos.x - this.position.x,
      playerPos.z - this.position.z
    );
    const distToPlayer = toPlayer.length();
    const toPlayerNorm = toPlayer.clone().normalize();

    switch (this.type) {
      case EnemyType.VOID_SPIDER: {
        // Skittering erratic movement
        if (this.aiTimer > 0.35) {
          this.aiTimer = 0;
          // Blend direct line with slight jitter
          const jitter = (Math.random() - 0.5) * 1.2;
          this.targetDir.set(
            toPlayerNorm.x + Math.sin(jitter) * 0.6,
            toPlayerNorm.y + Math.cos(jitter) * 0.6
          ).normalize();
        }

        this.position.x += this.targetDir.x * this.moveSpeed * dt;
        this.position.z += this.targetDir.y * this.moveSpeed * dt;

        // Animate legs
        const legs = this.parts.legs as unknown as THREE.Group[];
        if (Array.isArray(legs)) {
          const walkTime = performance.now() * 0.015;
          legs.forEach((leg, idx) => {
            leg.rotation.y = Math.sin(walkTime + idx * 1.2) * 0.3;
          });
        }

        // Face movement
        this.mesh.rotation.y = Math.atan2(this.targetDir.x, this.targetDir.y);
        break;
      }

      case EnemyType.WEEPING_SPECTER: {
        // Keeps medium distance, hovers
        if (distToPlayer < 5.0) {
          // Back off slowly
          this.position.x -= toPlayerNorm.x * this.moveSpeed * 0.8 * dt;
          this.position.z -= toPlayerNorm.y * this.moveSpeed * 0.8 * dt;
        } else if (distToPlayer > 8.0) {
          // Approach
          this.position.x += toPlayerNorm.x * this.moveSpeed * dt;
          this.position.z += toPlayerNorm.y * this.moveSpeed * dt;
        }

        // Floating undulation animation
        const hover = Math.sin(performance.now() * 0.004) * 0.15;
        this.mesh.position.y = hover;

        if (this.parts.ribbons) {
          this.parts.ribbons.rotation.z = Math.sin(performance.now() * 0.006) * 0.2;
        }

        this.mesh.rotation.y = Math.atan2(toPlayerNorm.x, toPlayerNorm.y);

        // Shoot homing/directed spectral tears
        if (this.attackCooldown <= 0 && distToPlayer < 14.0) {
          this.attackCooldown = 2.2 + Math.random() * 0.6;
          projectilesList.push(
            new Projectile(this.scene, {
              isPlayer: false,
              damage: 1,
              speed: 6.0,
              direction: toPlayerNorm,
              position: new THREE.Vector3(this.position.x, 1.0, this.position.z),
              scale: 1.1
            })
          );
          SoundManager.get().playShoot(0.7);
        }
        break;
      }

      case EnemyType.BILE_SPITTER: {
        // Slow wandering, stops to spit
        if (this.aiTimer > 2.0) {
          this.aiTimer = 0;
          this.targetDir.set(Math.random() - 0.5, Math.random() - 0.5).normalize();
        }

        if (this.attackCooldown > 0.5) {
          this.position.x += this.targetDir.x * this.moveSpeed * dt;
          this.position.z += this.targetDir.y * this.moveSpeed * dt;
        }

        this.mesh.rotation.y = Math.atan2(toPlayerNorm.x, toPlayerNorm.y);

        // Shoot mortar spread
        if (this.attackCooldown <= 0) {
          this.attackCooldown = 2.8;

          // Puff up animation
          if (this.parts.body) {
            this.parts.body.scale.set(1.3, 1.1, 1.2);
            setTimeout(() => {
              if (this.parts.body) this.parts.body.scale.set(1, 1, 1);
            }, 300);
          }

          const angles = [-0.25, 0, 0.25];
          angles.forEach((ang) => {
            const cos = Math.cos(ang);
            const sin = Math.sin(ang);
            const dir = new THREE.Vector2(
              toPlayerNorm.x * cos - toPlayerNorm.y * sin,
              toPlayerNorm.x * sin + toPlayerNorm.y * cos
            );
            projectilesList.push(
              new Projectile(this.scene, {
                isPlayer: false,
                damage: 1,
                speed: 7.2,
                direction: dir,
                position: new THREE.Vector3(this.position.x, 0.8, this.position.z)
              })
            );
          });
          SoundManager.get().playShoot(0.5);
        }
        break;
      }

      case EnemyType.GRAVE_CHARGER: {
        if (this.isCharging) {
          // Charge forward aggressively!
          this.position.x += this.chargeDir.x * 12.0 * dt;
          this.position.z += this.chargeDir.y * 12.0 * dt;

          if (Math.random() < 0.3) {
            this.particles.createDustPuff(this.position, 2);
          }

          this.aiTimer += dt;
          if (this.aiTimer > 1.4) {
            this.isCharging = false;
            this.attackCooldown = 1.8;
          }
        } else if (this.chargeWindup > 0) {
          // Wind up: scrape feet, shake
          this.chargeWindup -= dt;
          this.mesh.position.x += (Math.random() - 0.5) * 0.08;
          if (this.chargeWindup <= 0) {
            this.isCharging = true;
            this.aiTimer = 0;
            SoundManager.get().playBossRoar();
          }
        } else {
          // Check alignment with player along X or Z axis
          const dx = Math.abs(playerPos.x - this.position.x);
          const dz = Math.abs(playerPos.z - this.position.z);

          if (this.attackCooldown <= 0 && (dx < 1.2 || dz < 1.2) && distToPlayer < 12.0) {
            this.chargeWindup = 0.5;
            if (dx < dz) {
              this.chargeDir.set(0, Math.sign(playerPos.z - this.position.z));
            } else {
              this.chargeDir.set(Math.sign(playerPos.x - this.position.x), 0);
            }
            this.mesh.rotation.y = Math.atan2(this.chargeDir.x, this.chargeDir.y);
          } else {
            // Patrol slowly
            this.position.x += toPlayerNorm.x * this.moveSpeed * dt;
            this.position.z += toPlayerNorm.y * this.moveSpeed * dt;
            this.mesh.rotation.y = Math.atan2(toPlayerNorm.x, toPlayerNorm.y);
          }
        }
        break;
      }
    }
  }

  public onWallHit(normalX: number, normalZ: number) {
    if (this.type === EnemyType.GRAVE_CHARGER && this.isCharging) {
      this.isCharging = false;
      this.attackCooldown = 1.5;
      this.particles.createDustPuff(this.position, 10);
      SoundManager.get().playEnemyHit();
    }
  }

  protected override onDeath() {
    SoundManager.get().playEnemyKill();
    const pColor = this.type === EnemyType.BILE_SPITTER ? 0x66ff22 : 0xaa22ff;
    this.particles.createBloodSplatter(this.position, 14, pColor);
    this.particles.createSparkBurst(this.position, 6);
  }
}
