import * as THREE from 'three';
import { RoomType, Direction, OPPOSITE_DIRECTION, AABB, EnemyType, PickupType } from '../core/Types.ts';
import { MaterialsManager } from '../graphics/Materials.ts';
import { MeshFactory } from '../graphics/MeshFactory.ts';
import { Enemy } from '../entities/Enemy.ts';
import { Boss } from '../entities/Boss.ts';
import { Pickup } from '../entities/Pickup.ts';
import { LootSystem } from '../systems/LootSystem.ts';
import { SoundManager } from '../core/Audio.ts';
import { ParticleSystem } from '../systems/ParticleSystem.ts';

export interface DoorData {
  direction: Direction;
  isConnected: boolean;
  isOpen: boolean;
  mesh: THREE.Group;
  barsMesh: THREE.Mesh;
  light: THREE.PointLight;
}

export interface Obstacle {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  radius: number;
  isRock: boolean;
  isDestroyed: boolean;
}

export class Room {
  public gridX: number;
  public gridY: number;
  public type: RoomType;
  public width: number = 24;
  public height: number = 15;
  public isCleared: boolean = false;
  public isDiscovered: boolean = false;
  public isVisited: boolean = false;

  public group: THREE.Group = new THREE.Group();
  public doors: Map<Direction, DoorData> = new Map();
  public obstacles: Obstacle[] = [];
  public enemies: Enemy[] = [];
  public boss: Boss | null = null;
  public pickups: Pickup[] = [];
  public wallColliders: AABB[] = [];

  private scene: THREE.Scene;
  private mats: MaterialsManager;
  private factory: MeshFactory;

  constructor(scene: THREE.Scene, gridX: number, gridY: number, type: RoomType) {
    this.scene = scene;
    this.gridX = gridX;
    this.gridY = gridY;
    this.type = type;
    this.mats = MaterialsManager.get();
    this.factory = MeshFactory.get();

    if (type === RoomType.SPAWN || type === RoomType.TREASURE || type === RoomType.SHOP) {
      this.isCleared = true;
    }

    this.buildRoomGeometry();
  }

  private buildRoomGeometry() {
    // Floor
    const floorGeo = new THREE.PlaneGeometry(this.width, this.height);
    floorGeo.rotateX(-Math.PI / 2);
    const floor = new THREE.Mesh(floorGeo, this.mats.floorMaterial);
    floor.receiveShadow = true;
    this.group.add(floor);

    // Bounding walls
    this.buildWalls();

    // Corner decorative gothic pillars
    const corners = [
      [-this.width / 2 + 1, -this.height / 2 + 1],
      [this.width / 2 - 1, -this.height / 2 + 1],
      [-this.width / 2 + 1, this.height / 2 - 1],
      [this.width / 2 - 1, this.height / 2 - 1]
    ];

    corners.forEach(([cx, cz]) => {
      const pillarGeo = new THREE.CylinderGeometry(0.7, 0.85, 4.0, 8);
      const pillar = new THREE.Mesh(pillarGeo, this.mats.wallMaterial);
      pillar.position.set(cx, 2.0, cz);
      this.group.add(pillar);

      // Flickering torch on each pillar
      const torchLight = new THREE.PointLight(0xff9933, 1.2, 10);
      torchLight.position.set(cx, 2.8, cz);
      this.group.add(torchLight);

      this.obstacles.push({
        mesh: pillar,
        position: new THREE.Vector3(cx, 0, cz),
        radius: 1.05,
        isRock: true,
        isDestroyed: false
      });
    });

    // Populate interior based on room type
    this.populateInterior();
  }

  private buildWalls() {
    const wallThickness = 1.0;
    const wallHeight = 4.0;
    const halfW = this.width / 2;
    const halfH = this.height / 2;
    const doorOpening = 3.2;

    // North Wall segments
    this.createWallSegment(-halfW + (halfW - doorOpening / 2) / 2, -halfH, halfW - doorOpening / 2, wallThickness);
    this.createWallSegment(halfW - (halfW - doorOpening / 2) / 2, -halfH, halfW - doorOpening / 2, wallThickness);

    // South Wall segments
    this.createWallSegment(-halfW + (halfW - doorOpening / 2) / 2, halfH, halfW - doorOpening / 2, wallThickness);
    this.createWallSegment(halfW - (halfW - doorOpening / 2) / 2, halfH, halfW - doorOpening / 2, wallThickness);

    // West Wall segments
    this.createWallSegment(-halfW, -halfH + (halfH - doorOpening / 2) / 2, wallThickness, halfH - doorOpening / 2);
    this.createWallSegment(-halfW, halfH - (halfH - doorOpening / 2) / 2, wallThickness, halfH - doorOpening / 2);

    // East Wall segments
    this.createWallSegment(halfW, -halfH + (halfH - doorOpening / 2) / 2, wallThickness, halfH - doorOpening / 2);
    this.createWallSegment(halfW, halfH - (halfH - doorOpening / 2) / 2, wallThickness, halfH - doorOpening / 2);
  }

  private createWallSegment(x: number, z: number, w: number, d: number) {
    const wallGeo = new THREE.BoxGeometry(w, 4.0, d);
    const wall = new THREE.Mesh(wallGeo, this.mats.wallMaterial);
    wall.position.set(x, 2.0, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    this.group.add(wall);

    // Add collider AABB
    this.wallColliders.push({
      minX: x - w / 2,
      maxX: x + w / 2,
      minZ: z - d / 2,
      maxZ: z + d / 2
    });
  }

  public addDoor(dir: Direction) {
    const halfW = this.width / 2;
    const halfH = this.height / 2;
    const doorGroup = new THREE.Group();

    // Open Archway: Left post, Right post, Top lintel (Passage remains fully OPEN)
    const postGeo = new THREE.BoxGeometry(0.5, 3.8, 0.8);
    
    // Left post
    const leftPost = new THREE.Mesh(postGeo, this.mats.doorFrameMaterial);
    leftPost.position.set(-1.6, 1.9, 0);
    leftPost.castShadow = true;
    doorGroup.add(leftPost);

    // Right post
    const rightPost = new THREE.Mesh(postGeo, this.mats.doorFrameMaterial);
    rightPost.position.set(1.6, 1.9, 0);
    rightPost.castShadow = true;
    doorGroup.add(rightPost);

    // Top lintel
    const lintelGeo = new THREE.BoxGeometry(3.7, 0.6, 0.9);
    const topLintel = new THREE.Mesh(lintelGeo, this.mats.doorFrameMaterial);
    topLintel.position.set(0, 3.8, 0);
    topLintel.castShadow = true;
    doorGroup.add(topLintel);

    // Glowing mystical floor threshold rune mat
    const runeColor = this.type === RoomType.BOSS ? 0xff0044 : (this.type === RoomType.TREASURE ? 0xffd700 : 0x00e1ff);
    const threshGeo = new THREE.PlaneGeometry(2.7, 1.2);
    threshGeo.rotateX(-Math.PI / 2);
    const threshMat = new THREE.MeshBasicMaterial({
      color: runeColor,
      transparent: true,
      opacity: 0.65
    });
    const runeThresh = new THREE.Mesh(threshGeo, threshMat);
    runeThresh.position.set(0, 0.03, 0);
    doorGroup.add(runeThresh);

    // Retractable Iron Bars (visible only when locked)
    const barsGeo = new THREE.BoxGeometry(2.7, 3.4, 0.2);
    const barsMesh = new THREE.Mesh(barsGeo, this.mats.ironBarsMaterial);
    barsMesh.position.y = this.isCleared ? 5.2 : 1.7;
    barsMesh.visible = !this.isCleared;
    doorGroup.add(barsMesh);

    // Ambient door rune light
    const light = new THREE.PointLight(runeColor, 1.6, 8);
    light.position.set(0, 2.6, 0);
    doorGroup.add(light);

    // Position and rotate door according to direction
    switch (dir) {
      case Direction.NORTH:
        doorGroup.position.set(0, 0, -halfH);
        break;
      case Direction.SOUTH:
        doorGroup.position.set(0, 0, halfH);
        doorGroup.rotation.y = Math.PI;
        break;
      case Direction.EAST:
        doorGroup.position.set(halfW, 0, 0);
        doorGroup.rotation.y = -Math.PI / 2;
        break;
      case Direction.WEST:
        doorGroup.position.set(-halfW, 0, 0);
        doorGroup.rotation.y = Math.PI / 2;
        break;
    }

    this.group.add(doorGroup);
    this.doors.set(dir, {
      direction: dir,
      isConnected: true,
      isOpen: this.isCleared,
      mesh: doorGroup,
      barsMesh,
      light
    });
  }

  private populateInterior() {
    const halfW = this.width / 2 - 3;
    const halfH = this.height / 2 - 3;

    switch (this.type) {
      case RoomType.SPAWN: {
        // Safe room with a welcoming chest
        const spawnChest = new Pickup(this.scene, PickupType.CHEST, new THREE.Vector3(0, 0, -2.5));
        this.pickups.push(spawnChest);
        this.obstacles.push({
          mesh: spawnChest.mesh as unknown as THREE.Mesh,
          position: new THREE.Vector3(0, 0, -2.5),
          radius: 0.75,
          isRock: true,
          isDestroyed: false
        });
        break;
      }

      case RoomType.TREASURE: {
        // Central Golden Pedestal with a powerful Relic
        const relic = LootSystem.get().getRandomRelic();
        const pedestal = new Pickup(this.scene, PickupType.RELIC, new THREE.Vector3(0, 0, 0), relic);
        this.pickups.push(pedestal);
        this.obstacles.push({
          mesh: pedestal.mesh as unknown as THREE.Mesh,
          position: new THREE.Vector3(0, 0, 0),
          radius: 1.05,
          isRock: true,
          isDestroyed: false
        });
        break;
      }

      case RoomType.BOSS: {
        // Boss Room: Place Malakor in the center!
        this.boss = new Boss(this.scene, new THREE.Vector3(0, 0, -1.0));
        break;
      }

      case RoomType.COMBAT: {
        // Randomized obstacle pattern (rocks and urns)
        const pattern = Math.floor(Math.random() * 4);
        if (pattern === 0) {
          // 4 Inner mini-pillars
          [-4, 4].forEach((px) => {
            [-2.5, 2.5].forEach((pz) => {
              this.createObstacle(px, pz, true);
            });
          });
        } else if (pattern === 1) {
          // Cross of rocks & urns
          this.createObstacle(-3, 0, true);
          this.createObstacle(3, 0, true);
          this.createObstacle(0, -2, false);
          this.createObstacle(0, 2, false);
        } else if (pattern === 2) {
          // Cluster of urns
          [-2, 0, 2].forEach((x) => {
            this.createObstacle(x, -3, false);
            this.createObstacle(x, 3, false);
          });
        }

        // Spawn 3 - 6 randomized enemies
        const enemyCount = 3 + Math.floor(Math.random() * 4);
        const types = [
          EnemyType.VOID_SPIDER,
          EnemyType.VOID_SPIDER,
          EnemyType.WEEPING_SPECTER,
          EnemyType.BILE_SPITTER,
          EnemyType.GRAVE_CHARGER
        ];

        for (let i = 0; i < enemyCount; i++) {
          const type = types[Math.floor(Math.random() * types.length)];
          const rx = (Math.random() - 0.5) * (halfW * 1.6);
          const rz = (Math.random() - 0.5) * (halfH * 1.4);
          // Keep away from center spawn
          if (Math.abs(rx) < 2 && Math.abs(rz) < 2) continue;

          this.enemies.push(new Enemy(this.scene, type, new THREE.Vector3(rx, 0, rz)));
        }
        break;
      }
    }
  }

  private createObstacle(x: number, z: number, isRock: boolean) {
    const mesh = this.factory.createPropMesh(isRock);
    mesh.position.set(x, isRock ? 0.45 : 0.4, z);
    this.group.add(mesh);
    this.obstacles.push({
      mesh,
      position: new THREE.Vector3(x, 0, z),
      radius: isRock ? 0.85 : 0.65,
      isRock,
      isDestroyed: false
    });
  }

  public lockDoors() {
    this.doors.forEach((door) => {
      door.isOpen = false;
      door.barsMesh.position.y = 1.7; // Lower iron bars
      door.barsMesh.visible = true;
    });
    SoundManager.get().playDoorLock();
  }

  public unlockDoors() {
    if (this.isCleared) return;
    this.isCleared = true;

    this.doors.forEach((door) => {
      door.isOpen = true;
      door.barsMesh.position.y = 5.2; // Raise iron bars
      door.barsMesh.visible = false;
    });

    SoundManager.get().playDoorOpen();

    // Reward for clearing combat room
    if (this.type === RoomType.COMBAT) {
      // Spawn chest or coins in room center
      if (Math.random() < 0.65) {
        const rewardChest = LootSystem.get().spawnChest(this.scene, new THREE.Vector3(0, 0, 0));
        this.pickups.push(rewardChest);
        this.obstacles.push({
          mesh: rewardChest.mesh as unknown as THREE.Mesh,
          position: new THREE.Vector3(0, 0, 0),
          radius: 0.75,
          isRock: true,
          isDestroyed: false
        });
      } else {
        const coin = new Pickup(this.scene, PickupType.COIN_GOLD, new THREE.Vector3(0, 0, 0));
        this.pickups.push(coin);
      }
    } else if (this.type === RoomType.BOSS) {
      // Spawn victory trapdoor in center!
      this.pickups.push(new Pickup(this.scene, PickupType.TRAPDOOR, new THREE.Vector3(0, 0, 0)));
      // Also spawn golden reward chest with solid collision
      const bossChest = new Pickup(this.scene, PickupType.CHEST, new THREE.Vector3(0, 0, -3.0));
      this.pickups.push(bossChest);
      this.obstacles.push({
        mesh: bossChest.mesh as unknown as THREE.Mesh,
        position: new THREE.Vector3(0, 0, -3.0),
        radius: 0.75,
        isRock: true,
        isDestroyed: false
      });
    }
  }

  public updateObstacles(dt: number) {
    // Check breakable urns hit by tears or explosions
  }
}
