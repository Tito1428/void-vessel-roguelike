import * as THREE from 'three';

export abstract class Entity {
  public mesh: THREE.Group;
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public radius: number = 0.5;
  public height: number = 1.0;
  public health: number = 3;
  public maxHealth: number = 3;
  public invulnerableTimer: number = 0;
  public isDead: boolean = false;
  protected scene: THREE.Scene;

  // Flash damage materials cache
  private originalMaterials: Map<THREE.Mesh, THREE.Material | THREE.Material[]> = new Map();
  private static flashMat = new THREE.MeshBasicMaterial({ color: 0xff3333 });

  constructor(scene: THREE.Scene, mesh: THREE.Group, radius: number, health: number) {
    this.scene = scene;
    this.mesh = mesh;
    this.radius = radius;
    this.health = health;
    this.maxHealth = health;
    this.scene.add(this.mesh);

    // Cache mesh materials for damage flashing
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        this.originalMaterials.set(child, child.material);
      }
    });
  }

  public get position(): THREE.Vector3 {
    return this.mesh.position;
  }

  public takeDamage(amount: number): boolean {
    if (this.invulnerableTimer > 0 || this.isDead) return false;

    this.health -= amount;
    this.invulnerableTimer = 0.35;

    if (this.health <= 0) {
      this.health = 0;
      this.isDead = true;
      this.onDeath();
    }
    return true;
  }

  public applyKnockback(dir: THREE.Vector2, force: number) {
    this.velocity.x += dir.x * force;
    this.velocity.z += dir.y * force;
  }

  public update(dt: number) {
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
      this.handleDamageFlash(true);
      if (this.invulnerableTimer <= 0) {
        this.handleDamageFlash(false);
      }
    }

    // Apply friction to velocity
    this.velocity.x *= Math.pow(0.001, dt);
    this.velocity.z *= Math.pow(0.001, dt);

    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.z * dt;
  }

  protected handleDamageFlash(flash: boolean) {
    this.originalMaterials.forEach((origMat, mesh) => {
      if (flash) {
        mesh.material = Entity.flashMat;
      } else {
        mesh.material = origMat;
      }
    });
  }

  public destroy() {
    this.scene.remove(this.mesh);
  }

  protected abstract onDeath(): void;
}
