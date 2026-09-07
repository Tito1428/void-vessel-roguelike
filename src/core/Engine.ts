import * as THREE from 'three';
import { GameState, Direction, DIRECTION_OFFSETS, OPPOSITE_DIRECTION, RoomType } from './Types.ts';
import { InputManager } from './Input.ts';
import { SoundManager } from './Audio.ts';
import { DungeonGenerator, DungeonFloor } from '../dungeon/DungeonGenerator.ts';
import { Room } from '../dungeon/Room.ts';
import { Player } from '../entities/Player.ts';
import { Projectile } from '../entities/Projectile.ts';
import { CollisionSystem } from '../systems/CollisionSystem.ts';
import { ParticleSystem } from '../systems/ParticleSystem.ts';
import { LootSystem } from '../systems/LootSystem.ts';
import { Pickup } from '../entities/Pickup.ts';
import { HUD } from '../ui/HUD.ts';
import { Minimap } from '../dungeon/Minimap.ts';

export class Engine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public state: GameState = GameState.TITLE;

  private player!: Player;
  private currentRoom!: Room;
  private dungeonFloor!: DungeonFloor;
  private projectiles: Projectile[] = [];
  private collisionSystem: CollisionSystem;
  private particleSystem: ParticleSystem;
  private input: InputManager;
  private sound: SoundManager;
  private hud: HUD;
  private minimap: Minimap;

  // Camera settings
  private cameraTarget: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private cameraOffset: THREE.Vector3 = new THREE.Vector3(0, 18.5, 11.5);
  private isTransitioning: boolean = false;
  private transitionTimer: number = 0;
  private transitionDuration: number = 0.45;
  private transitionStartCam: THREE.Vector3 = new THREE.Vector3();
  private transitionEndCam: THREE.Vector3 = new THREE.Vector3();

  // Clock
  private clock: THREE.Clock = new THREE.Clock();
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. Three.js Scene & Renderer
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x06060c);
    this.scene.fog = new THREE.FogExp2(0x06060c, 0.025);

    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.copy(this.cameraOffset);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // 2. Systems
    this.input = InputManager.get();
    this.sound = SoundManager.get();
    this.particleSystem = ParticleSystem.get();
    this.particleSystem.init(this.scene);
    this.collisionSystem = new CollisionSystem(this.scene);

    // 3. UI
    this.hud = new HUD();
    this.minimap = new Minimap(this.container);

    this.hud.setCallbacks(
      () => this.startNewGame(),
      () => this.startNewGame()
    );

    // 4. Lighting
    this.setupLighting();

    // Resize listener
    window.addEventListener('resize', () => this.onWindowResize());
  }

  private setupLighting() {
    // Ambient light
    const ambient = new THREE.AmbientLight(0x334466, 0.9);
    this.scene.add(ambient);

    // Cavern moon/directional light
    const dirLight = new THREE.DirectionalLight(0xddeeff, 1.6);
    dirLight.position.set(10, 25, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 60;
    dirLight.shadow.camera.left = -16;
    dirLight.shadow.camera.right = 16;
    dirLight.shadow.camera.top = 16;
    dirLight.shadow.camera.bottom = -16;
    dirLight.shadow.bias = -0.0005;
    this.scene.add(dirLight);
  }

  public startNewGame() {
    this.sound.init();
    this.sound.resumeContext();

    // Clear previous entities
    this.projectiles.forEach((p) => p.destroy());
    this.projectiles = [];
    this.particleSystem.clear();

    if (this.currentRoom) {
      this.scene.remove(this.currentRoom.group);
    }
    if (this.player) {
      this.player.destroy();
    }

    // Generate Floor
    this.dungeonFloor = DungeonGenerator.generate(this.scene, 11);
    this.currentRoom = this.dungeonFloor.startRoom;
    this.scene.add(this.currentRoom.group);

    // Spawn Player
    this.player = new Player(this.scene, new THREE.Vector3(0, 0, 0));

    // Reset Camera
    this.cameraTarget.set(0, 0, 0);
    this.camera.position.set(0, this.cameraOffset.y, this.cameraOffset.z);
    this.camera.lookAt(this.cameraTarget);

    // UI
    this.hud.resetScreens();
    this.hud.updateStats(this.player.stats);
    this.hud.hideBossBar();

    this.state = GameState.PLAYING;
  }

  private transitionToRoom(dir: Direction) {
    const off = DIRECTION_OFFSETS[dir];
    const targetKey = `${this.currentRoom.gridX + off.x},${this.currentRoom.gridY + off.y}`;
    const targetRoom = this.dungeonFloor.rooms.get(targetKey);

    if (!targetRoom) return;

    this.isTransitioning = true;
    this.transitionTimer = 0;
    this.state = GameState.ROOM_TRANSITION;

    // Clear active room projectiles
    this.projectiles.forEach((p) => p.destroy());
    this.projectiles = [];

    // Remove old room from scene, add target room
    this.scene.remove(this.currentRoom.group);
    this.currentRoom = targetRoom;
    this.scene.add(this.currentRoom.group);

    // Position player cleanly inside the new room facing inwards
    const oppDir = OPPOSITE_DIRECTION[dir];
    const spawnMarginW = this.currentRoom.width / 2 - 2.8;
    const spawnMarginH = this.currentRoom.height / 2 - 2.8;

    switch (oppDir) {
      case Direction.NORTH:
        this.player.position.set(0, 0, -spawnMarginH);
        this.player.facingDirection.set(0, 1);
        break;
      case Direction.SOUTH:
        this.player.position.set(0, 0, spawnMarginH);
        this.player.facingDirection.set(0, -1);
        break;
      case Direction.EAST:
        this.player.position.set(spawnMarginW, 0, 0);
        this.player.facingDirection.set(-1, 0);
        break;
      case Direction.WEST:
        this.player.position.set(-spawnMarginW, 0, 0);
        this.player.facingDirection.set(1, 0);
        break;
    }

    // Mark visited & discovered
    this.currentRoom.isVisited = true;
    this.currentRoom.isDiscovered = true;

    // Discover adjacent neighbors
    [Direction.NORTH, Direction.SOUTH, Direction.EAST, Direction.WEST].forEach((d) => {
      const neighborOffset = DIRECTION_OFFSETS[d];
      const neighbor = this.dungeonFloor.rooms.get(
        `${this.currentRoom.gridX + neighborOffset.x},${this.currentRoom.gridY + neighborOffset.y}`
      );
      if (neighbor) {
        neighbor.isDiscovered = true;
      }
    });

    // If room is not cleared, lock doors!
    if (!this.currentRoom.isCleared) {
      this.currentRoom.lockDoors();
    }

    // Boss bar display
    if (this.currentRoom.type === RoomType.BOSS && this.currentRoom.boss && !this.currentRoom.boss.isDead) {
      this.hud.showBossBar(this.currentRoom.boss.health, this.currentRoom.boss.maxHealth);
    } else {
      this.hud.hideBossBar();
    }

    this.isTransitioning = false;
    this.state = GameState.PLAYING;
  }

  public update() {
    const dt = Math.min(this.clock.getDelta(), 0.1);

    if (this.state === GameState.PLAYING) {
      this.input.update(this.camera);

      // 1. Player Movement & Actions
      const moveDir = this.input.getMovementVector();
      this.player.move(moveDir, dt);

      if (this.input.consumeDash()) {
        this.player.dash(moveDir);
      }

      // 2. Player Shooting
      const shootDir = this.input.getShootingDirection(this.player.position);
      if (shootDir) {
        this.player.shoot(shootDir, this.projectiles, dt);
      }

      this.player.update(dt);

      // 3. Resolve Player Movement Collisions & Door Transitions
      const collisionResult = this.collisionSystem.resolvePlayerCollisions(
        this.player,
        this.currentRoom
      );

      if (collisionResult.transitionDirection) {
        this.transitionToRoom(collisionResult.transitionDirection);
        return;
      }

      // 4. Update Enemies
      for (let i = this.currentRoom.enemies.length - 1; i >= 0; i--) {
        const enemy = this.currentRoom.enemies[i];
        if (enemy.isDead) {
          enemy.destroy();
          this.currentRoom.enemies.splice(i, 1);
          continue;
        }

        enemy.updateAI(this.player.position, this.projectiles, dt);
        enemy.update(dt);
      }

      // 5. Update Boss
      if (this.currentRoom.boss) {
        const boss = this.currentRoom.boss;
        if (boss.isDead) {
          boss.destroy();
          this.currentRoom.boss = null;
          this.hud.hideBossBar();
          this.currentRoom.unlockDoors();
        } else {
          boss.updateBoss(
            this.player.position,
            this.projectiles,
            (minion) => {
              this.currentRoom.enemies.push(minion);
            },
            dt
          );
          boss.update(dt);
          this.hud.showBossBar(boss.health, boss.maxHealth);
        }
      }

      // 6. Check Room Clear
      if (
        !this.currentRoom.isCleared &&
        this.currentRoom.enemies.length === 0 &&
        (!this.currentRoom.boss || this.currentRoom.boss.isDead)
      ) {
        this.currentRoom.unlockDoors();
      }

      // 7. Enemy Collisions
      this.collisionSystem.resolveEnemyCollisions(
        this.currentRoom.enemies,
        this.player,
        this.currentRoom
      );

      // 8. Projectiles Collisions
      this.collisionSystem.updateProjectiles(
        this.projectiles,
        this.player,
        this.currentRoom.enemies,
        this.currentRoom,
        dt
      );

      // 9. Update Pickups
      for (let i = this.currentRoom.pickups.length - 1; i >= 0; i--) {
        const pickup = this.currentRoom.pickups[i];
        const res = pickup.update(this.player, dt);

        if (res.collected) {
          if (pickup.relicData) {
            this.hud.showItemPickup(pickup.relicData);
          }
          this.currentRoom.pickups.splice(i, 1);
        } else if (res.openedChest) {
          // Spawn loot from chest
          const chestDrops = LootSystem.get().spawnChestLoot(this.scene, pickup.position);
          chestDrops.forEach((d: Pickup) => this.currentRoom.pickups.push(d));
        } else if (res.isTrapdoor) {
          // Victory trigger!
          this.state = GameState.VICTORY;
          this.hud.showVictory();
          SoundManager.get().playItemJingle();
          return;
        }
      }

      // 10. Update Particles
      this.particleSystem.update(dt);

      // 11. Check Player Death
      if (this.player.isDead) {
        this.state = GameState.GAME_OVER;
        this.hud.showGameOver();
        return;
      }

      // 12. Update UI
      this.hud.updateStats(this.player.stats);
      this.minimap.render(this.dungeonFloor.rooms, this.currentRoom);

      // Camera smoothly tracks player within room boundaries
      const targetCamX = THREE.MathUtils.clamp(this.player.position.x * 0.35, -3, 3);
      const targetCamZ = THREE.MathUtils.clamp(this.player.position.z * 0.35, -2, 2) + this.cameraOffset.z;

      this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, targetCamX, dt * 6.0);
      this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, targetCamZ, dt * 6.0);
      this.camera.position.y = this.cameraOffset.y;
      this.camera.lookAt(targetCamX * 0.5, 0, (targetCamZ - this.cameraOffset.z) * 0.5);
    }

    this.renderer.render(this.scene, this.camera);
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public run() {
    const loop = () => {
      requestAnimationFrame(loop);
      this.update();
    };
    loop();
  }
}
