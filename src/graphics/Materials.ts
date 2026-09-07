import * as THREE from 'three';

export class MaterialsManager {
  private static instance: MaterialsManager;
  private textureLoader: THREE.TextureLoader = new THREE.TextureLoader();

  public floorMaterial!: THREE.MeshStandardMaterial;
  public wallMaterial!: THREE.MeshStandardMaterial;
  public doorFrameMaterial!: THREE.MeshStandardMaterial;
  public ironBarsMaterial!: THREE.MeshStandardMaterial;
  public rockMaterial!: THREE.MeshStandardMaterial;
  public urnMaterial!: THREE.MeshStandardMaterial;
  public pedestalMaterial!: THREE.MeshStandardMaterial;
  public playerBodyMaterial!: THREE.MeshStandardMaterial;
  public playerEyeMaterial!: THREE.MeshBasicMaterial;
  public playerRuneMaterial!: THREE.MeshBasicMaterial;
  public tearMaterial!: THREE.MeshStandardMaterial;
  public enemyBulletMaterial!: THREE.MeshStandardMaterial;
  public coinMaterial!: THREE.MeshStandardMaterial;
  public heartMaterial!: THREE.MeshStandardMaterial;
  public bossBodyMaterial!: THREE.MeshStandardMaterial;
  public bossCoreMaterial!: THREE.MeshBasicMaterial;
  public shadowMaterial!: THREE.MeshBasicMaterial;

  private constructor() {
    this.initMaterials();
  }

  public static get(): MaterialsManager {
    if (!MaterialsManager.instance) {
      MaterialsManager.instance = new MaterialsManager();
    }
    return MaterialsManager.instance;
  }

  private initMaterials() {
    // Floor texture
    const floorTex = this.textureLoader.load(
      'assets/floor.jpg',
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(4, 3);
        tex.needsUpdate = true;
      },
      undefined,
      () => {
        console.warn('Fallback floor texture generated');
      }
    );

    // Wall texture
    const wallTex = this.textureLoader.load(
      'assets/wall.jpg',
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(3, 1);
        tex.needsUpdate = true;
      }
    );

    this.floorMaterial = new THREE.MeshStandardMaterial({
      map: floorTex,
      color: 0x8899aa,
      roughness: 0.75,
      metalness: 0.15
    });

    this.wallMaterial = new THREE.MeshStandardMaterial({
      map: wallTex,
      color: 0x667788,
      roughness: 0.85,
      metalness: 0.2
    });

    this.doorFrameMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a2e39,
      roughness: 0.6,
      metalness: 0.4
    });

    this.ironBarsMaterial = new THREE.MeshStandardMaterial({
      color: 0x1f2329,
      roughness: 0.4,
      metalness: 0.8
    });

    this.rockMaterial = new THREE.MeshStandardMaterial({
      color: 0x484e58,
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true
    });

    this.urnMaterial = new THREE.MeshStandardMaterial({
      color: 0x9c5c3d,
      roughness: 0.8,
      metalness: 0.05
    });

    this.pedestalMaterial = new THREE.MeshStandardMaterial({
      color: 0x22202a,
      roughness: 0.5,
      metalness: 0.5
    });

    // Player
    this.playerBodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xd8d3cd,
      roughness: 0.5,
      metalness: 0.1,
      flatShading: true
    });

    this.playerEyeMaterial = new THREE.MeshBasicMaterial({
      color: 0x00f3ff
    });

    this.playerRuneMaterial = new THREE.MeshBasicMaterial({
      color: 0x00e1ff
    });

    // Projectiles
    this.tearMaterial = new THREE.MeshStandardMaterial({
      color: 0x33b8ff,
      emissive: 0x0055aa,
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.92
    });

    this.enemyBulletMaterial = new THREE.MeshStandardMaterial({
      color: 0xff2255,
      emissive: 0xcc0033,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.1
    });

    // Pickups
    this.coinMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xaa7700,
      emissiveIntensity: 0.4,
      roughness: 0.25,
      metalness: 0.85
    });

    this.heartMaterial = new THREE.MeshStandardMaterial({
      color: 0xff1e46,
      emissive: 0x880022,
      emissiveIntensity: 0.4,
      roughness: 0.3,
      metalness: 0.3
    });

    // Boss
    this.bossBodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x2b2935,
      roughness: 0.9,
      metalness: 0.2,
      flatShading: true
    });

    this.bossCoreMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0055
    });

    // Shadows
    this.shadowMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45
    });
  }

  public createShadowMesh(radius: number): THREE.Mesh {
    const geo = new THREE.CircleGeometry(radius, 16);
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, this.shadowMaterial);
    mesh.position.y = 0.02;
    return mesh;
  }
}
