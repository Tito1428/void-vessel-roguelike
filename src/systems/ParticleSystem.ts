import * as THREE from 'three';

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  scaleDown: boolean;
  gravity: number;
}

export class ParticleSystem {
  private static instance: ParticleSystem;
  private scene!: THREE.Scene;
  private particles: Particle[] = [];

  // Reusable materials & geometries for zero garbage collection
  private tearParticleGeo = new THREE.SphereGeometry(0.08, 4, 4);
  private bloodParticleGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
  private sparkGeo = new THREE.DodecahedronGeometry(0.07, 0);

  private cyanMat = new THREE.MeshBasicMaterial({ color: 0x44ddff });
  private redMat = new THREE.MeshBasicMaterial({ color: 0xcc1122 });
  private goldMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
  private dustMat = new THREE.MeshBasicMaterial({ color: 0x777788, transparent: true, opacity: 0.6 });
  private purpleMat = new THREE.MeshBasicMaterial({ color: 0xaa22ff });

  private constructor() {}

  public static get(): ParticleSystem {
    if (!ParticleSystem.instance) {
      ParticleSystem.instance = new ParticleSystem();
    }
    return ParticleSystem.instance;
  }

  public init(scene: THREE.Scene) {
    this.scene = scene;
  }

  public createMagicBurst(position: THREE.Vector3, count = 10, color = 0x00f3ff) {
    const mat = color === 0xa855f7 ? this.purpleMat : this.cyanMat;
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.sparkGeo, mat);
      mesh.position.copy(position);
      this.scene.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const speed = 2.0 + Math.random() * 3.5;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        1.5 + Math.random() * 2.5,
        Math.sin(angle) * speed
      );

      this.particles.push({
        mesh,
        velocity,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.25,
        scaleDown: true,
        gravity: 4.0
      });
    }
  }

  public createMagicTrail(position: THREE.Vector3) {
    const mesh = new THREE.Mesh(this.sparkGeo, this.cyanMat);
    mesh.position.copy(position);
    this.scene.add(mesh);

    this.particles.push({
      mesh,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * 0.4
      ),
      life: 0,
      maxLife: 0.2,
      scaleDown: true,
      gravity: 0.5
    });
  }

  public createTearSplash(position: THREE.Vector3, count = 6) {
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.tearParticleGeo, this.cyanMat);
      mesh.position.copy(position);
      this.scene.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 2.5;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        2.0 + Math.random() * 2.0,
        Math.sin(angle) * speed
      );

      this.particles.push({
        mesh,
        velocity,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.2,
        scaleDown: true,
        gravity: 9.8
      });
    }
  }

  public createBloodSplatter(position: THREE.Vector3, count = 8, color = 0xcc1122) {
    const mat = color === 0xaa22ff ? this.purpleMat : this.redMat;
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.bloodParticleGeo, mat);
      mesh.position.copy(position);
      this.scene.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const speed = 1.0 + Math.random() * 3.0;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        2.5 + Math.random() * 2.5,
        Math.sin(angle) * speed
      );

      this.particles.push({
        mesh,
        velocity,
        life: 0,
        maxLife: 0.4 + Math.random() * 0.3,
        scaleDown: true,
        gravity: 12.0
      });
    }
  }

  public createDustPuff(position: THREE.Vector3, count = 4) {
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.sparkGeo, this.dustMat);
      mesh.position.copy(position);
      this.scene.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 1.2;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        0.5 + Math.random() * 1.0,
        Math.sin(angle) * speed
      );

      this.particles.push({
        mesh,
        velocity,
        life: 0,
        maxLife: 0.3 + Math.random() * 0.2,
        scaleDown: true,
        gravity: 2.0
      });
    }
  }

  public createSparkBurst(position: THREE.Vector3, count = 10) {
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.sparkGeo, this.goldMat);
      mesh.position.copy(position);
      this.scene.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const speed = 2.0 + Math.random() * 3.5;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        2.0 + Math.random() * 3.0,
        Math.sin(angle) * speed
      );

      this.particles.push({
        mesh,
        velocity,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.3,
        scaleDown: true,
        gravity: 8.0
      });
    }
  }

  public update(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;

      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }

      // Physics
      p.velocity.y -= p.gravity * dt;
      p.mesh.position.addScaledVector(p.velocity, dt);

      // Floor clamp
      if (p.mesh.position.y < 0.05) {
        p.mesh.position.y = 0.05;
        p.velocity.x *= 0.5;
        p.velocity.z *= 0.5;
      }

      // Scale down over life
      if (p.scaleDown) {
        const progress = p.life / p.maxLife;
        const s = Math.max(0.01, 1.0 - progress);
        p.mesh.scale.set(s, s, s);
      }
    }
  }

  public clear() {
    this.particles.forEach((p) => this.scene.remove(p.mesh));
    this.particles = [];
  }
}
