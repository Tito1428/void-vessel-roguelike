import * as THREE from 'three';
import { Entity } from './Entity.ts';
import { MeshFactory } from '../graphics/MeshFactory.ts';
import { Projectile } from './Projectile.ts';
import { PlayerStats, RelicDef } from '../core/Types.ts';
import { SoundManager } from '../core/Audio.ts';
import { ParticleSystem } from '../systems/ParticleSystem.ts';

export class Player extends Entity {
  public stats: PlayerStats = {
    maxHealth: 6,
    health: 6,
    damage: 3.5,
    fireRate: 0.32,
    shotSpeed: 12.0,
    range: 1.6,
    moveSpeed: 6.8,
    coins: 0,
    keys: 1,
    bombs: 1,
    relics: [],
    tearsCount: 1,
    isBouncy: false,
    isSpectral: false,
    hasOrbital: false,
    vampiric: false,
    bloodSigil: false
  };

  public isDashing: boolean = false;
  public dashCooldown: number = 0;
  public dashTimer: number = 0;
  public facingDirection: THREE.Vector2 = new THREE.Vector2(0, 1);
  public itemHoldingMesh: THREE.Object3D | null = null;
  public isHoldingItem: boolean = false;
  public holdingItemTimer: number = 0;

  // Orbitals
  public orbitalMesh: THREE.Mesh | null = null;
  public orbitalAngle: number = 0;

  // Animation references
  private headGroup: THREE.Group;
  private bodyGroup: THREE.Group;
  private leftFoot: THREE.Mesh;
  private rightFoot: THREE.Mesh;
  private leftHand: THREE.Mesh;
  private rightHand: THREE.Mesh;

  private shootCooldownTimer: number = 0;
  private walkCycleTimer: number = 0;
  private headRecoilTimer: number = 0;
  private particles: ParticleSystem;

  constructor(scene: THREE.Scene, position: THREE.Vector3) {
    const factory = MeshFactory.get();
    const { root, head, body, leftFoot, rightFoot, leftHand, rightHand } = factory.createPlayerMesh();
    super(scene, root, 0.45, 6);

    this.headGroup = head;
    this.bodyGroup = body;
    this.leftFoot = leftFoot;
    this.rightFoot = rightFoot;
    this.leftHand = leftHand;
    this.rightHand = rightHand;
    this.particles = ParticleSystem.get();

    this.position.copy(position);
  }

  public move(dir: THREE.Vector2, dt: number) {
    if (this.isHoldingItem) return;

    if (this.isDashing) {
      // Dash maintains velocity
      return;
    }

    const currentSpeed = this.stats.moveSpeed;
    if (dir.lengthSq() > 0) {
      this.facingDirection.copy(dir);
      this.position.x += dir.x * currentSpeed * dt;
      this.position.z += dir.y * currentSpeed * dt;

      // Animate walking cycle
      this.walkCycleTimer += dt * 14;
      const legOffset = Math.sin(this.walkCycleTimer) * 0.28;
      this.leftFoot.position.z = legOffset;
      this.rightFoot.position.z = -legOffset;

      // Bobbing body
      this.bodyGroup.position.y = 0.55 + Math.abs(Math.sin(this.walkCycleTimer)) * 0.08;
      this.bodyGroup.rotation.z = -dir.x * 0.12;

      // Dust puffs occasionally
      if (Math.random() < 0.12) {
        this.particles.createDustPuff(new THREE.Vector3(this.position.x, 0.1, this.position.z), 1);
      }
    } else {
      // Idle pose
      this.walkCycleTimer = 0;
      this.leftFoot.position.z = THREE.MathUtils.lerp(this.leftFoot.position.z, 0, dt * 10);
      this.rightFoot.position.z = THREE.MathUtils.lerp(this.rightFoot.position.z, 0, dt * 10);
      this.bodyGroup.position.y = 0.55 + Math.sin(performance.now() * 0.003) * 0.02;
      this.bodyGroup.rotation.z = 0;
    }
  }

  public dash(dir: THREE.Vector2) {
    if (this.dashCooldown > 0 || this.isDashing || this.isHoldingItem) return;

    this.isDashing = true;
    this.dashTimer = 0.22;
    this.dashCooldown = 1.0;
    this.invulnerableTimer = 0.35;

    const dashDir = dir.lengthSq() > 0 ? dir : this.facingDirection;
    this.velocity.x = dashDir.x * 18.0;
    this.velocity.z = dashDir.y * 18.0;

    SoundManager.get().playDash();
    this.particles.createDustPuff(this.position, 8);
    this.particles.createSparkBurst(this.position, 6);
  }

  public shoot(shootDir: THREE.Vector2, projectilesList: Projectile[], dt: number) {
    if (this.isHoldingItem) return;

    this.facingDirection.copy(shootDir);

    if (this.shootCooldownTimer <= 0) {
      this.shootCooldownTimer = this.stats.fireRate;
      this.headRecoilTimer = 0.12;

      // Calculate effective damage (incorporating Blood Sigil if low health)
      let dmg = this.stats.damage;
      if (this.stats.bloodSigil && this.stats.health <= 2) {
        dmg *= 2.0; // Enraged damage when low on health!
      }

      // Momentum inheritance: player's movement adds slight inertia to tears (like classic Isaac)
      const momentumX = this.velocity.x * 0.15;
      const momentumZ = this.velocity.z * 0.15;

      const basePos = new THREE.Vector3(
        this.position.x + shootDir.x * 0.45,
        1.1,
        this.position.z + shootDir.y * 0.45
      );

      // Multi-shot (Triple Eye)
      if (this.stats.tearsCount === 3) {
        const spreadAngles = [-0.18, 0, 0.18];
        spreadAngles.forEach((angle) => {
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          const spreadDir = new THREE.Vector2(
            shootDir.x * cos - shootDir.y * sin,
            shootDir.x * sin + shootDir.y * cos
          );
          const p = new Projectile(this.scene, {
            isPlayer: true,
            damage: dmg,
            speed: this.stats.shotSpeed,
            direction: spreadDir,
            position: basePos,
            isBouncy: this.stats.isBouncy,
            isSpectral: this.stats.isSpectral
          });
          p.velocity.x += momentumX;
          p.velocity.y += momentumZ;
          projectilesList.push(p);
        });
      } else {
        const p = new Projectile(this.scene, {
          isPlayer: true,
          damage: dmg,
          speed: this.stats.shotSpeed,
          direction: shootDir,
          position: basePos,
          isBouncy: this.stats.isBouncy,
          isSpectral: this.stats.isSpectral
        });
        p.velocity.x += momentumX;
        p.velocity.y += momentumZ;
        projectilesList.push(p);
      }

      SoundManager.get().playShoot(1.0 + (Math.random() - 0.5) * 0.15);
    }
  }

  public override update(dt: number) {
    super.update(dt);

    if (this.dashCooldown > 0) this.dashCooldown -= dt;
    if (this.shootCooldownTimer > 0) this.shootCooldownTimer -= dt;

    // Handle dash state
    if (this.isDashing) {
      this.dashTimer -= dt;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
        this.velocity.set(0, 0, 0);
      }
    }

    // Head recoil animation when firing
    if (this.headRecoilTimer > 0) {
      this.headRecoilTimer -= dt;
      const recoilOffset = (this.headRecoilTimer / 0.12) * -0.15;
      this.headGroup.position.z = recoilOffset * this.facingDirection.y;
      this.headGroup.position.x = recoilOffset * this.facingDirection.x;
    } else {
      this.headGroup.position.x = 0;
      this.headGroup.position.z = 0;
    }

    // Orient character towards facing direction
    const targetAngle = Math.atan2(this.facingDirection.x, this.facingDirection.y);
    this.mesh.rotation.y = THREE.MathUtils.lerp(this.mesh.rotation.y, targetAngle, dt * 16);

    // Orbitals update
    if (this.stats.hasOrbital) {
      if (!this.orbitalMesh) {
        this.createOrbitalMesh();
      }
      if (this.orbitalMesh) {
        this.orbitalAngle += dt * 3.5;
        this.orbitalMesh.position.set(
          Math.cos(this.orbitalAngle) * 1.35,
          1.0 + Math.sin(performance.now() * 0.005) * 0.2,
          Math.sin(this.orbitalAngle) * 1.35
        );
        this.orbitalMesh.rotation.y += dt * 4;
      }
    }

    // Item holding celebration animation
    if (this.isHoldingItem) {
      this.holdingItemTimer -= dt;
      this.leftHand.position.set(-0.3, 0.85, 0.2);
      this.rightHand.position.set(0.3, 0.85, 0.2);
      if (this.holdingItemTimer <= 0) {
        this.isHoldingItem = false;
        if (this.itemHoldingMesh) {
          this.mesh.remove(this.itemHoldingMesh);
          this.itemHoldingMesh = null;
        }
        this.leftHand.position.set(-0.48, 0.05, 0.1);
        this.rightHand.position.set(0.48, 0.05, 0.1);
      }
    }
  }

  public addRelic(relic: RelicDef) {
    this.stats.relics.push(relic);
    if (relic.statBonus) {
      if (relic.statBonus.damage) this.stats.damage += relic.statBonus.damage;
      if (relic.statBonus.fireRate) this.stats.fireRate = Math.max(0.12, this.stats.fireRate * relic.statBonus.fireRate);
      if (relic.statBonus.moveSpeed) this.stats.moveSpeed += relic.statBonus.moveSpeed;
      if (relic.statBonus.shotSpeed) this.stats.shotSpeed += relic.statBonus.shotSpeed;
      if (relic.statBonus.maxHealth) {
        this.stats.maxHealth += relic.statBonus.maxHealth;
        this.stats.health += relic.statBonus.maxHealth;
      }
      if (relic.statBonus.health) {
        this.heal(relic.statBonus.health);
      }
      if (relic.statBonus.tearsCount) this.stats.tearsCount = relic.statBonus.tearsCount;
      if (relic.statBonus.isBouncy !== undefined) this.stats.isBouncy = relic.statBonus.isBouncy;
      if (relic.statBonus.isSpectral !== undefined) this.stats.isSpectral = relic.statBonus.isSpectral;
      if (relic.statBonus.hasOrbital !== undefined) this.stats.hasOrbital = relic.statBonus.hasOrbital;
      if (relic.statBonus.vampiric !== undefined) this.stats.vampiric = relic.statBonus.vampiric;
      if (relic.statBonus.bloodSigil !== undefined) this.stats.bloodSigil = relic.statBonus.bloodSigil;
    }

    // Trigger celebration pose
    this.isHoldingItem = true;
    this.holdingItemTimer = 1.6;
    const crystalGeo = new THREE.OctahedronGeometry(0.35, 0);
    const crystalMat = new THREE.MeshBasicMaterial({ color: relic.color });
    this.itemHoldingMesh = new THREE.Mesh(crystalGeo, crystalMat);
    this.itemHoldingMesh.position.set(0, 2.1, 0);
    this.mesh.add(this.itemHoldingMesh);

    SoundManager.get().playItemJingle();
  }

  public heal(amount: number) {
    this.stats.health = Math.min(this.stats.maxHealth, this.stats.health + amount);
    SoundManager.get().playHeart();
    this.particles.createSparkBurst(this.position, 8);
  }

  public override takeDamage(amount: number): boolean {
    if (this.isDashing || this.invulnerableTimer > 0 || this.isDead) return false;

    this.stats.health -= amount;
    this.invulnerableTimer = 0.8; // longer i-frames for player

    SoundManager.get().playPlayerHurt();
    this.particles.createBloodSplatter(this.position, 8, 0xcc1122);

    if (this.stats.health <= 0) {
      this.stats.health = 0;
      this.isDead = true;
      this.onDeath();
    }
    return true;
  }

  private createOrbitalMesh() {
    const geo = new THREE.OctahedronGeometry(0.2, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0xa855f7,
      emissiveIntensity: 0.9,
      roughness: 0.2
    });
    this.orbitalMesh = new THREE.Mesh(geo, mat);
    this.mesh.add(this.orbitalMesh);
  }

  protected override onDeath() {
    this.particles.createBloodSplatter(this.position, 20, 0xcc1122);
    this.particles.createSparkBurst(this.position, 15);
  }
}
