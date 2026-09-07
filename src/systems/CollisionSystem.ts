import * as THREE from 'three';
import { Room } from '../dungeon/Room.ts';
import { Player } from '../entities/Player.ts';
import { Enemy } from '../entities/Enemy.ts';
import { Projectile } from '../entities/Projectile.ts';
import { Direction, AABB } from '../core/Types.ts';
import { SoundManager } from '../core/Audio.ts';
import { ParticleSystem } from './ParticleSystem.ts';
import { LootSystem } from './LootSystem.ts';

export class CollisionSystem {
  private particles: ParticleSystem;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.particles = ParticleSystem.get();
  }

  /**
   * Resolves player movement against walls and obstacles, and checks for room transition
   */
  public resolvePlayerCollisions(
    player: Player,
    room: Room
  ): { transitionDirection: Direction | null } {
    const halfW = room.width / 2;
    const halfH = room.height / 2;

    // Check door transitions (if room is cleared)
    if (room.isCleared) {
      const doorPassageWidth = 2.6;
      const triggerDist = 1.3;

      // North Door
      if (room.doors.has(Direction.NORTH) && Math.abs(player.position.x) < doorPassageWidth / 2) {
        if (player.position.z <= -halfH + triggerDist) {
          return { transitionDirection: Direction.NORTH };
        }
      }

      // South Door
      if (room.doors.has(Direction.SOUTH) && Math.abs(player.position.x) < doorPassageWidth / 2) {
        if (player.position.z >= halfH - triggerDist) {
          return { transitionDirection: Direction.SOUTH };
        }
      }

      // East Door
      if (room.doors.has(Direction.EAST) && Math.abs(player.position.z) < doorPassageWidth / 2) {
        if (player.position.x >= halfW - triggerDist) {
          return { transitionDirection: Direction.EAST };
        }
      }

      // West Door
      if (room.doors.has(Direction.WEST) && Math.abs(player.position.z) < doorPassageWidth / 2) {
        if (player.position.x <= -halfW + triggerDist) {
          return { transitionDirection: Direction.WEST };
        }
      }
    }

    // Clamp inside room perimeter: allow passing into open doorways
    const boundX = halfW - 0.8;
    const boundZ = halfH - 0.8;
    const doorwayW = 2.4;

    const canPassNorth = room.isCleared && room.doors.has(Direction.NORTH) && Math.abs(player.position.x) < doorwayW / 2;
    const canPassSouth = room.isCleared && room.doors.has(Direction.SOUTH) && Math.abs(player.position.x) < doorwayW / 2;
    const canPassEast = room.isCleared && room.doors.has(Direction.EAST) && Math.abs(player.position.z) < doorwayW / 2;
    const canPassWest = room.isCleared && room.doors.has(Direction.WEST) && Math.abs(player.position.z) < doorwayW / 2;

    if (!canPassNorth && player.position.z < -boundZ) player.position.z = -boundZ;
    if (!canPassSouth && player.position.z > boundZ) player.position.z = boundZ;
    if (!canPassWest && player.position.x < -boundX) player.position.x = -boundX;
    if (!canPassEast && player.position.x > boundX) player.position.x = boundX;

    // Multi-pass collision resolution against all obstacles and boss
    for (let iter = 0; iter < 3; iter++) {
      // Room obstacles (rocks, pillars, chests, pedestals)
      room.obstacles.forEach((obs) => {
        if (obs.isDestroyed) return;
        const dx = player.position.x - obs.position.x;
        const dz = player.position.z - obs.position.z;
        const distSq = dx * dx + dz * dz;
        const minDist = player.radius + obs.radius;

        if (distSq < minDist * minDist) {
          const dist = Math.sqrt(distSq);
          let nx = 0;
          let nz = 1;
          if (dist > 0.0001) {
            nx = dx / dist;
            nz = dz / dist;
          }

          // Push player cleanly to the edge of the obstacle
          const penetration = minDist - dist;
          player.position.x += nx * penetration;
          player.position.z += nz * penetration;

          // Zero out player velocity directed into the obstacle
          const velDotNormal = player.velocity.x * nx + player.velocity.z * nz;
          if (velDotNormal < 0) {
            player.velocity.x -= nx * velDotNormal;
            player.velocity.z -= nz * velDotNormal;
          }
        }
      });

      // Boss solid collision
      if (room.boss && !room.boss.isDead) {
        const dx = player.position.x - room.boss.position.x;
        const dz = player.position.z - room.boss.position.z;
        const distSq = dx * dx + dz * dz;
        const minDist = player.radius + room.boss.radius;

        if (distSq < minDist * minDist) {
          const dist = Math.sqrt(distSq);
          const nx = dist > 0.0001 ? dx / dist : 0;
          const nz = dist > 0.0001 ? dz / dist : 1;
          const penetration = minDist - dist;
          player.position.x += nx * penetration;
          player.position.z += nz * penetration;

          const velDotNormal = player.velocity.x * nx + player.velocity.z * nz;
          if (velDotNormal < 0) {
            player.velocity.x -= nx * velDotNormal;
            player.velocity.z -= nz * velDotNormal;
          }
        }
      }
    }

    return { transitionDirection: null };
  }

  /**
   * Resolves enemy collisions with walls, obstacles, and player touch damage
   */
  public resolveEnemyCollisions(enemies: Enemy[], player: Player, room: Room) {
    const halfW = room.width / 2 - 0.9;
    const halfH = room.height / 2 - 0.9;

    enemies.forEach((enemy) => {
      if (enemy.isDead) return;

      // Keep enemy within room bounds
      if (enemy.position.x < -halfW) {
        enemy.position.x = -halfW;
        enemy.onWallHit(-1, 0);
      }
      if (enemy.position.x > halfW) {
        enemy.position.x = halfW;
        enemy.onWallHit(1, 0);
      }
      if (enemy.position.z < -halfH) {
        enemy.position.z = -halfH;
        enemy.onWallHit(0, -1);
      }
      if (enemy.position.z > halfH) {
        enemy.position.z = halfH;
        enemy.onWallHit(0, 1);
      }

      // Obstacle collisions (multi-pass)
      room.obstacles.forEach((obs) => {
        if (obs.isDestroyed) return;
        const dx = enemy.position.x - obs.position.x;
        const dz = enemy.position.z - obs.position.z;
        const distSq = dx * dx + dz * dz;
        const minDist = enemy.radius + obs.radius;

        if (distSq < minDist * minDist) {
          const dist = Math.sqrt(distSq);
          const nx = dist > 0.0001 ? dx / dist : 0;
          const nz = dist > 0.0001 ? dz / dist : 1;
          const pushDist = minDist - dist;
          enemy.position.x += nx * pushDist;
          enemy.position.z += nz * pushDist;
          enemy.onWallHit(nx, nz);
        }
      });

      // Touch damage to player
      const distToPlayer = new THREE.Vector2(
        enemy.position.x - player.position.x,
        enemy.position.z - player.position.z
      );
      if (distToPlayer.length() < enemy.radius + player.radius) {
        const didDamage = player.takeDamage(enemy.touchDamage);
        if (didDamage) {
          // Push player away
          const pushDir = distToPlayer.clone().normalize().negate();
          player.applyKnockback(pushDir, 12);
        }
      }
    });
  }

  /**
   * Projectile collisions against enemies, boss, player, obstacles, and walls
   */
  public updateProjectiles(
    projectiles: Projectile[],
    player: Player,
    enemies: Enemy[],
    room: Room,
    dt: number
  ) {
    const halfW = room.width / 2 - 0.5;
    const halfH = room.height / 2 - 0.5;

    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      p.update(dt);

      if (p.isDead) {
        projectiles.splice(i, 1);
        continue;
      }

      // Wall bounce or impact
      if (p.position.x < -halfW) {
        p.bounce(1, 0);
      } else if (p.position.x > halfW) {
        p.bounce(-1, 0);
      } else if (p.position.z < -halfH) {
        p.bounce(0, 1);
      } else if (p.position.z > halfH) {
        p.bounce(0, -1);
      }

      if (p.isDead) {
        projectiles.splice(i, 1);
        continue;
      }

      // Obstacle collision
      if (!p.isSpectral) {
        for (const obs of room.obstacles) {
          if (obs.isDestroyed) continue;
          const dist = new THREE.Vector2(
            p.position.x - obs.position.x,
            p.position.z - obs.position.z
          ).length();

          if (dist < p.radius + obs.radius) {
            // Breakable urns
            if (!obs.isRock) {
              obs.isDestroyed = true;
              room.group.remove(obs.mesh);
              this.particles.createSparkBurst(obs.position, 12);
              SoundManager.get().playEnemyHit();
              if (Math.random() < 0.45) {
                const drop = LootSystem.get().rollEnemyDrop(this.scene, obs.position);
                if (drop) room.pickups.push(drop);
              }
            }
            p.bounce(p.velocity.x > 0 ? -1 : 1, p.velocity.y > 0 ? -1 : 1);
            break;
          }
        }
      }

      if (p.isDead) {
        projectiles.splice(i, 1);
        continue;
      }

      // Player projectiles hitting enemies
      if (p.isPlayer) {
        let hitSomething = false;

        // Check normal enemies
        for (const enemy of enemies) {
          if (enemy.isDead) continue;
          const dist = new THREE.Vector2(
            p.position.x - enemy.position.x,
            p.position.z - enemy.position.z
          ).length();

          if (dist < p.radius + enemy.radius) {
            hitSomething = true;
            enemy.takeDamage(p.damage);
            enemy.applyKnockback(p.velocity.clone().normalize(), 8);
            SoundManager.get().playEnemyHit();

            // Blood & sparks
            this.particles.createBloodSplatter(p.position, 6, 0xaa22ff);

            if (enemy.isDead) {
              // Roll drop
              const drop = LootSystem.get().rollEnemyDrop(this.scene, enemy.position);
              if (drop) {
                room.pickups.push(drop);
              }
              // Vampiric relic check
              if (player.stats.vampiric && Math.random() < 0.2) {
                player.heal(1);
              }
            }
            break;
          }
        }

        // Check Boss
        if (!hitSomething && room.boss && !room.boss.isDead) {
          const bossDist = new THREE.Vector2(
            p.position.x - room.boss.position.x,
            p.position.z - room.boss.position.z
          ).length();

          if (bossDist < p.radius + room.boss.radius) {
            hitSomething = true;
            room.boss.takeDamage(p.damage);
            SoundManager.get().playEnemyHit();
            this.particles.createBloodSplatter(p.position, 8, 0xff0044);
          }
        }

        if (hitSomething) {
          p.impact();
          projectiles.splice(i, 1);
          continue;
        }
      } else {
        // Enemy bullet vs Player Orbital Wisp
        if (player.stats.hasOrbital && player.orbitalMesh) {
          const orbitalWorldPos = new THREE.Vector3();
          player.orbitalMesh.getWorldPosition(orbitalWorldPos);
          const distToOrbital = new THREE.Vector2(
            p.position.x - orbitalWorldPos.x,
            p.position.z - orbitalWorldPos.z
          ).length();

          if (distToOrbital < p.radius + 0.35) {
            this.particles.createSparkBurst(p.position, 8);
            SoundManager.get().playEnemyHit();
            p.impact();
            projectiles.splice(i, 1);
            continue;
          }
        }

        // Enemy bullet hitting Player
        const distToPlayer = new THREE.Vector2(
          p.position.x - player.position.x,
          p.position.z - player.position.z
        ).length();

        if (distToPlayer < p.radius + player.radius) {
          player.takeDamage(p.damage);
          p.impact();
          projectiles.splice(i, 1);
          continue;
        }
      }
    }
  }
}
