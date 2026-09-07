import * as THREE from 'three';
import { PickupType, RelicDef } from '../core/Types.ts';
import { MaterialsManager } from '../graphics/Materials.ts';
import { MeshFactory } from '../graphics/MeshFactory.ts';
import { SoundManager } from '../core/Audio.ts';
import { ParticleSystem } from '../systems/ParticleSystem.ts';
import { Player } from './Player.ts';

export class Pickup {
  public type: PickupType;
  public mesh: THREE.Group;
  public position: THREE.Vector3 = new THREE.Vector3();
  public radius: number = 0.45;
  public isCollected: boolean = false;
  public relicData?: RelicDef;
  public isOpened: boolean = false;

  private scene: THREE.Scene;
  private floatOffset: number = Math.random() * Math.PI * 2;
  private chestLid?: THREE.Group;
  private relicMesh?: THREE.Mesh;
  private vortexMesh?: THREE.Mesh;
  private particles: ParticleSystem;

  constructor(
    scene: THREE.Scene,
    type: PickupType,
    position: THREE.Vector3,
    relicData?: RelicDef
  ) {
    this.scene = scene;
    this.type = type;
    this.position.copy(position);
    this.relicData = relicData;
    this.particles = ParticleSystem.get();

    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);
    this.initMesh();
    this.scene.add(this.mesh);
  }

  private initMesh() {
    const mats = MaterialsManager.get();
    const factory = MeshFactory.get();

    switch (this.type) {
      case PickupType.COIN:
      case PickupType.COIN_GOLD: {
        const isGold = this.type === PickupType.COIN_GOLD;
        const radius = isGold ? 0.28 : 0.22;
        const geo = new THREE.CylinderGeometry(radius, radius, 0.08, 12);
        geo.rotateX(Math.PI / 2);
        const coin = new THREE.Mesh(geo, mats.coinMaterial);
        coin.position.y = 0.3;
        this.mesh.add(coin);
        this.radius = 0.4;
        break;
      }

      case PickupType.HEART_HALF:
      case PickupType.HEART_FULL: {
        const isFull = this.type === PickupType.HEART_FULL;
        const scale = isFull ? 0.28 : 0.2;
        const geo = new THREE.DodecahedronGeometry(scale, 1);
        geo.scale(1.2, 1.0, 0.7);
        const heart = new THREE.Mesh(geo, mats.heartMaterial);
        heart.position.y = 0.35;
        this.mesh.add(heart);
        this.radius = 0.45;
        break;
      }

      case PickupType.KEY: {
        const keyMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.9, roughness: 0.2 });
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.04, 6, 12), keyMat);
        ring.position.y = 0.4;
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.3, 6), keyMat);
        stem.position.set(0, 0.2, 0);
        this.mesh.add(ring);
        this.mesh.add(stem);
        this.radius = 0.4;
        break;
      }

      case PickupType.BOMB: {
        const bombMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.4, roughness: 0.5 });
        const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), bombMat);
        sphere.position.y = 0.25;
        const fuseMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
        const fuse = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.1, 4), fuseMat);
        fuse.position.set(0, 0.5, 0);
        this.mesh.add(sphere);
        this.mesh.add(fuse);
        this.radius = 0.4;
        break;
      }

      case PickupType.RELIC: {
        const relicColor = this.relicData ? this.relicData.color : 0x00ffff;
        const { root, relicMesh } = factory.createPedestalMesh(relicColor);
        this.mesh.add(root);
        this.relicMesh = relicMesh;
        this.radius = 0.85;
        break;
      }

      case PickupType.CHEST: {
        const { root, lid } = factory.createChestMesh(false);
        this.mesh.add(root);
        this.chestLid = lid;
        this.radius = 0.8;
        break;
      }

      case PickupType.TRAPDOOR: {
        const { root, vortex } = factory.createTrapdoorMesh();
        this.mesh.add(root);
        this.vortexMesh = vortex;
        this.radius = 1.0;
        break;
      }
    }
  }

  public update(player: Player, dt: number): { collected: boolean; openedChest?: boolean; isTrapdoor?: boolean } {
    if (this.isCollected) return { collected: false };

    // Floating / spinning animation
    const time = performance.now() * 0.003 + this.floatOffset;

    if (this.type === PickupType.COIN || this.type === PickupType.COIN_GOLD) {
      this.mesh.rotation.y += dt * 3.5;
      this.mesh.children[0].position.y = 0.3 + Math.sin(time * 2) * 0.08;

      // Magnetism towards player
      const dist = this.position.distanceTo(player.position);
      if (dist < 2.5) {
        const pullDir = new THREE.Vector3().subVectors(player.position, this.position).normalize();
        this.position.addScaledVector(pullDir, dt * 7.5);
        this.mesh.position.copy(this.position);
      }
    } else if (this.type === PickupType.HEART_HALF || this.type === PickupType.HEART_FULL) {
      this.mesh.rotation.y += dt * 2.0;
      const pulse = 1.0 + Math.sin(time * 3) * 0.12;
      this.mesh.scale.set(pulse, pulse, pulse);
    } else if (this.type === PickupType.RELIC && this.relicMesh) {
      this.relicMesh.rotation.y += dt * 2.0;
      this.relicMesh.rotation.x = Math.sin(time) * 0.2;
      this.relicMesh.position.y = 1.25 + Math.sin(time * 2) * 0.12;
    } else if (this.type === PickupType.TRAPDOOR && this.vortexMesh) {
      this.vortexMesh.rotation.z += dt * 3.0;
    }

    // Distance check to player
    const distToPlayer = new THREE.Vector2(
      this.position.x - player.position.x,
      this.position.z - player.position.z
    ).length();

    if (distToPlayer < this.radius + player.radius) {
      return this.handlePlayerContact(player);
    }

    return { collected: false };
  }

  private handlePlayerContact(player: Player): { collected: boolean; openedChest?: boolean; isTrapdoor?: boolean } {
    switch (this.type) {
      case PickupType.COIN:
        player.stats.coins += 1;
        SoundManager.get().playCoin();
        this.particles.createSparkBurst(this.position, 6);
        this.destroy();
        return { collected: true };

      case PickupType.COIN_GOLD:
        player.stats.coins += 5;
        SoundManager.get().playCoin();
        this.particles.createSparkBurst(this.position, 12);
        this.destroy();
        return { collected: true };

      case PickupType.HEART_HALF:
        if (player.stats.health < player.stats.maxHealth) {
          player.heal(1);
          this.destroy();
          return { collected: true };
        }
        break;

      case PickupType.HEART_FULL:
        if (player.stats.health < player.stats.maxHealth) {
          player.heal(2);
          this.destroy();
          return { collected: true };
        }
        break;

      case PickupType.KEY:
        player.stats.keys += 1;
        SoundManager.get().playCoin();
        this.particles.createSparkBurst(this.position, 6);
        this.destroy();
        return { collected: true };

      case PickupType.BOMB:
        player.stats.bombs += 1;
        SoundManager.get().playCoin();
        this.particles.createSparkBurst(this.position, 6);
        this.destroy();
        return { collected: true };

      case PickupType.RELIC:
        if (this.relicData) {
          player.addRelic(this.relicData);
          this.particles.createSparkBurst(this.position, 20);
          this.destroy();
          return { collected: true };
        }
        break;

      case PickupType.CHEST:
        if (!this.isOpened) {
          this.isOpened = true;
          if (this.chestLid) {
            // Animate open lid
            this.chestLid.rotation.x = -Math.PI / 1.6;
          }
          SoundManager.get().playDoorOpen();
          this.particles.createSparkBurst(this.position, 15);
          return { collected: false, openedChest: true };
        }
        break;

      case PickupType.TRAPDOOR:
        return { collected: false, isTrapdoor: true };
    }

    return { collected: false };
  }

  public destroy() {
    this.isCollected = true;
    this.scene.remove(this.mesh);
  }
}
