import * as THREE from 'three';
import { MaterialsManager } from './Materials.ts';
import { EnemyType } from '../core/Types.ts';

export class MeshFactory {
  private static instance: MeshFactory;
  private mats: MaterialsManager;

  private constructor() {
    this.mats = MaterialsManager.get();
  }

  public static get(): MeshFactory {
    if (!MeshFactory.instance) {
      MeshFactory.instance = new MeshFactory();
    }
    return MeshFactory.instance;
  }

  /**
   * Builds the 3D Player Character (The Void Vessel)
   */
  public createPlayerMesh(): {
    root: THREE.Group;
    head: THREE.Group;
    body: THREE.Group;
    leftFoot: THREE.Mesh;
    rightFoot: THREE.Mesh;
    leftHand: THREE.Mesh;
    rightHand: THREE.Mesh;
    shadow: THREE.Mesh;
  } {
    const root = new THREE.Group();

    // Shadow
    const shadow = this.mats.createShadowMesh(0.65);
    root.add(shadow);

    // Body group
    const body = new THREE.Group();
    body.position.y = 0.55;

    // Torso
    const torsoGeo = new THREE.CylinderGeometry(0.35, 0.28, 0.5, 7);
    const torso = new THREE.Mesh(torsoGeo, this.mats.playerBodyMaterial);
    torso.castShadow = true;
    body.add(torso);

    // Chest rune (glowing core)
    const runeGeo = new THREE.BoxGeometry(0.14, 0.18, 0.05);
    const rune = new THREE.Mesh(runeGeo, this.mats.playerRuneMaterial);
    rune.position.set(0, 0.05, 0.32);
    body.add(rune);

    // Feet
    const footGeo = new THREE.SphereGeometry(0.14, 6, 6);
    footGeo.scale(1, 0.7, 1.4);
    const leftFoot = new THREE.Mesh(footGeo, this.mats.playerBodyMaterial);
    leftFoot.position.set(-0.25, -0.32, 0);
    body.add(leftFoot);

    const rightFoot = new THREE.Mesh(footGeo, this.mats.playerBodyMaterial);
    rightFoot.position.set(0.25, -0.32, 0);
    body.add(rightFoot);

    // Floating Hands
    const handGeo = new THREE.SphereGeometry(0.12, 6, 6);
    const leftHand = new THREE.Mesh(handGeo, this.mats.playerBodyMaterial);
    leftHand.position.set(-0.48, 0.05, 0.1);
    body.add(leftHand);

    const rightHand = new THREE.Mesh(handGeo, this.mats.playerBodyMaterial);
    rightHand.position.set(0.48, 0.05, 0.1);
    body.add(rightHand);

    root.add(body);

    // Head group (floating above torso)
    const head = new THREE.Group();
    head.position.y = 1.18;

    // Head base (rounded stone cranium)
    const headGeo = new THREE.DodecahedronGeometry(0.55, 1);
    headGeo.scale(1.05, 1.0, 0.95);
    const headMesh = new THREE.Mesh(headGeo, this.mats.playerBodyMaterial);
    headMesh.castShadow = true;
    head.add(headMesh);

    // Big expressive glowing cyan eyes
    const eyeGeo = new THREE.SphereGeometry(0.15, 8, 8);
    eyeGeo.scale(0.85, 1.15, 0.5);

    const leftEye = new THREE.Mesh(eyeGeo, this.mats.playerEyeMaterial);
    leftEye.position.set(-0.22, 0.02, 0.46);
    head.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, this.mats.playerEyeMaterial);
    rightEye.position.set(0.22, 0.02, 0.46);
    head.add(rightEye);

    // Tear drop channels / markings under eyes
    const tearDropGeo = new THREE.BoxGeometry(0.08, 0.22, 0.04);
    const leftTear = new THREE.Mesh(tearDropGeo, this.mats.playerRuneMaterial);
    leftTear.position.set(-0.22, -0.18, 0.47);
    head.add(leftTear);

    const rightTear = new THREE.Mesh(tearDropGeo, this.mats.playerRuneMaterial);
    rightTear.position.set(0.22, -0.18, 0.47);
    head.add(rightTear);

    root.add(head);

    return { root, head, body, leftFoot, rightFoot, leftHand, rightHand, shadow };
  }

  /**
   * Builds an Enemy 3D Model based on type
   */
  public createEnemyMesh(type: EnemyType): {
    root: THREE.Group;
    parts: Record<string, THREE.Object3D>;
    shadow: THREE.Mesh;
  } {
    const root = new THREE.Group();
    const parts: Record<string, THREE.Object3D> = {};

    switch (type) {
      case EnemyType.VOID_SPIDER: {
        const shadow = this.mats.createShadowMesh(0.5);
        root.add(shadow);

        const bodyMat = new THREE.MeshStandardMaterial({
          color: 0x1a1528,
          roughness: 0.6,
          metalness: 0.3,
          flatShading: true
        });

        // Abdomen
        const abdomenGeo = new THREE.SphereGeometry(0.35, 7, 7);
        abdomenGeo.scale(1, 0.8, 1.2);
        const abdomen = new THREE.Mesh(abdomenGeo, bodyMat);
        abdomen.position.set(0, 0.35, -0.2);
        root.add(abdomen);
        parts.abdomen = abdomen;

        // Cephalothorax (Head)
        const headGeo = new THREE.SphereGeometry(0.25, 6, 6);
        const head = new THREE.Mesh(headGeo, bodyMat);
        head.position.set(0, 0.3, 0.2);
        root.add(head);
        parts.head = head;

        // Glowing red spider eyes
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff1133 });
        const eyeGeo = new THREE.SphereGeometry(0.06, 5, 5);
        for (let i = -1; i <= 1; i += 2) {
          const eye = new THREE.Mesh(eyeGeo, eyeMat);
          eye.position.set(i * 0.1, 0.34, 0.42);
          root.add(eye);
        }

        // 6 Animated legs
        const legMat = new THREE.MeshStandardMaterial({ color: 0x2d1f3b });
        const legs: THREE.Group[] = [];
        for (let side = -1; side <= 1; side += 2) {
          for (let l = 0; l < 3; l++) {
            const legRoot = new THREE.Group();
            legRoot.position.set(side * 0.25, 0.3, -0.1 + l * 0.2);

            const femurGeo = new THREE.CylinderGeometry(0.04, 0.03, 0.38, 5);
            const femur = new THREE.Mesh(femurGeo, legMat);
            femur.position.set(side * 0.16, 0.12, 0);
            femur.rotation.z = side * 0.8;
            legRoot.add(femur);

            const tibiaGeo = new THREE.CylinderGeometry(0.03, 0.02, 0.4, 5);
            const tibia = new THREE.Mesh(tibiaGeo, legMat);
            tibia.position.set(side * 0.32, -0.12, 0);
            tibia.rotation.z = -side * 0.7;
            legRoot.add(tibia);

            root.add(legRoot);
            legs.push(legRoot);
          }
        }
        parts.legs = legs as unknown as THREE.Object3D;
        return { root, parts, shadow };
      }

      case EnemyType.WEEPING_SPECTER: {
        const shadow = this.mats.createShadowMesh(0.55);
        root.add(shadow);

        const specterMat = new THREE.MeshStandardMaterial({
          color: 0x4466aa,
          roughness: 0.3,
          metalness: 0.1,
          transparent: true,
          opacity: 0.88
        });

        // Hovering cowl
        const cowlGeo = new THREE.ConeGeometry(0.48, 1.1, 8);
        cowlGeo.rotateX(Math.PI);
        const cowl = new THREE.Mesh(cowlGeo, specterMat);
        cowl.position.y = 1.0;
        root.add(cowl);
        parts.cowl = cowl;

        // Dark hollow face
        const faceHollowMat = new THREE.MeshBasicMaterial({ color: 0x070914 });
        const face = new THREE.Mesh(new THREE.SphereGeometry(0.26, 7, 7), faceHollowMat);
        face.position.set(0, 1.05, 0.18);
        root.add(face);

        // Glowing weeping tear tracks
        const tearMat = new THREE.MeshBasicMaterial({ color: 0x88ddff });
        const tearGeo = new THREE.BoxGeometry(0.06, 0.28, 0.05);
        for (let s = -1; s <= 1; s += 2) {
          const t = new THREE.Mesh(tearGeo, tearMat);
          t.position.set(s * 0.12, 0.96, 0.4);
          root.add(t);
        }

        // Spectral ribbons
        const ribbonGeo = new THREE.CylinderGeometry(0.35, 0.05, 0.8, 6);
        const ribbons = new THREE.Mesh(ribbonGeo, specterMat);
        ribbons.position.y = 0.45;
        root.add(ribbons);
        parts.ribbons = ribbons;

        return { root, parts, shadow };
      }

      case EnemyType.BILE_SPITTER: {
        const shadow = this.mats.createShadowMesh(0.7);
        root.add(shadow);

        const bileMat = new THREE.MeshStandardMaterial({
          color: 0x3d6628,
          roughness: 0.7,
          metalness: 0.1,
          flatShading: true
        });

        // Bloated body
        const bodyGeo = new THREE.DodecahedronGeometry(0.65, 1);
        bodyGeo.scale(1.2, 0.9, 1.1);
        const body = new THREE.Mesh(bodyGeo, bileMat);
        body.position.y = 0.65;
        root.add(body);
        parts.body = body;

        // Toxic pustules on back
        const pustuleMat = new THREE.MeshBasicMaterial({ color: 0xaaff22 });
        const pustules: THREE.Mesh[] = [];
        const pPositions = [
          [-0.25, 1.05, -0.2],
          [0.2, 1.15, -0.15],
          [0.0, 1.0, -0.35]
        ];
        pPositions.forEach(([px, py, pz]) => {
          const p = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), pustuleMat);
          p.position.set(px, py, pz);
          root.add(p);
          pustules.push(p);
        });
        parts.pustules = pustules as unknown as THREE.Object3D;

        // Huge gaping mouth
        const mouthMat = new THREE.MeshBasicMaterial({ color: 0x1f330a });
        const mouth = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.3, 6), mouthMat);
        mouth.position.set(0, 0.65, 0.6);
        mouth.rotation.x = Math.PI / 2;
        root.add(mouth);
        parts.mouth = mouth;

        return { root, parts, shadow };
      }

      case EnemyType.GRAVE_CHARGER: {
        const shadow = this.mats.createShadowMesh(0.75);
        root.add(shadow);

        const armorMat = new THREE.MeshStandardMaterial({
          color: 0x3a3f4a,
          roughness: 0.6,
          metalness: 0.5,
          flatShading: true
        });

        // Armored skull body
        const skullGeo = new THREE.BoxGeometry(0.8, 0.7, 1.0);
        const skull = new THREE.Mesh(skullGeo, armorMat);
        skull.position.y = 0.65;
        root.add(skull);
        parts.body = skull;

        // Massive ramming stone horns
        const hornMat = new THREE.MeshStandardMaterial({ color: 0x6a2c20, roughness: 0.8 });
        const hornGeo = new THREE.ConeGeometry(0.18, 0.7, 5);
        hornGeo.rotateX(Math.PI / 3);

        for (let s = -1; s <= 1; s += 2) {
          const horn = new THREE.Mesh(hornGeo, hornMat);
          horn.position.set(s * 0.42, 0.85, 0.45);
          horn.rotation.z = -s * 0.35;
          root.add(horn);
        }

        // Burning red eyes
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });
        for (let s = -1; s <= 1; s += 2) {
          const eye = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.08), eyeMat);
          eye.position.set(s * 0.25, 0.7, 0.54);
          root.add(eye);
        }

        return { root, parts, shadow };
      }

      case EnemyType.BOSS_MALAKOR: {
        const shadow = this.mats.createShadowMesh(2.2);
        root.add(shadow);

        // Huge stone torso
        const bossMat = this.mats.bossBodyMaterial;
        const torsoGeo = new THREE.DodecahedronGeometry(1.6, 1);
        torsoGeo.scale(1.2, 1.4, 1.1);
        const torso = new THREE.Mesh(torsoGeo, bossMat);
        torso.position.y = 2.4;
        root.add(torso);
        parts.torso = torso;

        // Exposed glowing pulsating void core
        const coreGeo = new THREE.SphereGeometry(0.65, 8, 8);
        const core = new THREE.Mesh(coreGeo, this.mats.bossCoreMaterial);
        core.position.set(0, 2.3, 1.1);
        root.add(core);
        parts.core = core;

        // Horned stone head
        const headGeo = new THREE.BoxGeometry(1.1, 1.1, 1.0);
        const head = new THREE.Mesh(headGeo, bossMat);
        head.position.set(0, 3.8, 0.3);
        root.add(head);
        parts.head = head;

        // Big fiery eye slit
        const bossEye = new THREE.Mesh(
          new THREE.BoxGeometry(0.7, 0.16, 0.2),
          new THREE.MeshBasicMaterial({ color: 0xff0044 })
        );
        bossEye.position.set(0, 3.9, 0.8);
        root.add(bossEye);

        // Massive floating fists
        const fistGeo = new THREE.DodecahedronGeometry(0.85, 0);
        fistGeo.scale(1.1, 1.0, 1.3);

        const leftFist = new THREE.Mesh(fistGeo, bossMat);
        leftFist.position.set(-2.2, 2.0, 0.5);
        root.add(leftFist);
        parts.leftFist = leftFist;

        const rightFist = new THREE.Mesh(fistGeo, bossMat);
        rightFist.position.set(2.2, 2.0, 0.5);
        root.add(rightFist);
        parts.rightFist = rightFist;

        return { root, parts, shadow };
      }
    }
  }

  /**
   * Builds an Item Pedestal with 3D Relic Floating above it
   */
  public createPedestalMesh(relicColor = 0x00ffff): {
    root: THREE.Group;
    relicMesh: THREE.Mesh;
  } {
    const root = new THREE.Group();

    // Stone base
    const baseGeo = new THREE.CylinderGeometry(0.75, 0.95, 0.45, 8);
    const base = new THREE.Mesh(baseGeo, this.mats.pedestalMaterial);
    base.position.y = 0.225;
    base.castShadow = true;
    base.receiveShadow = true;
    root.add(base);

    // Golden cupola ring
    const ringGeo = new THREE.TorusGeometry(0.55, 0.08, 6, 16);
    ringGeo.rotateX(Math.PI / 2);
    const ring = new THREE.Mesh(ringGeo, this.mats.coinMaterial);
    ring.position.y = 0.48;
    root.add(ring);

    // Floating 3D relic crystal
    const relicGeo = new THREE.OctahedronGeometry(0.38, 0);
    const relicMat = new THREE.MeshStandardMaterial({
      color: relicColor,
      emissive: relicColor,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8
    });
    const relicMesh = new THREE.Mesh(relicGeo, relicMat);
    relicMesh.position.y = 1.25;
    root.add(relicMesh);

    return { root, relicMesh };
  }

  /**
   * Creates an interactive Treasure Chest (base + hinged lid)
   */
  public createChestMesh(isGolden = false): {
    root: THREE.Group;
    lid: THREE.Group;
  } {
    const root = new THREE.Group();

    const chestMat = isGolden
      ? this.mats.coinMaterial
      : new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.7 });

    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.4,
      metalness: 0.7
    });

    // Box base
    const baseGeo = new THREE.BoxGeometry(0.9, 0.4, 0.65);
    const base = new THREE.Mesh(baseGeo, chestMat);
    base.position.y = 0.2;
    root.add(base);

    // Iron corners
    const rimGeo = new THREE.BoxGeometry(0.94, 0.08, 0.69);
    const rim = new THREE.Mesh(rimGeo, trimMat);
    rim.position.y = 0.38;
    root.add(rim);

    // Hinged lid
    const lid = new THREE.Group();
    lid.position.set(0, 0.4, -0.32); // hinge at back

    const lidGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.92, 12, 1, false, 0, Math.PI);
    lidGeo.rotateZ(Math.PI / 2);
    const lidMesh = new THREE.Mesh(lidGeo, chestMat);
    lidMesh.position.set(0, 0, 0.32);
    lid.add(lidMesh);

    root.add(lid);
    return { root, lid };
  }

  /**
   * Creates a breakable stone/urn
   */
  public createPropMesh(isRock: boolean): THREE.Mesh {
    if (isRock) {
      const geo = new THREE.DodecahedronGeometry(0.55, 1);
      geo.scale(1.0, 0.85, 1.1);
      const mesh = new THREE.Mesh(geo, this.mats.rockMaterial);
      mesh.position.y = 0.45;
      mesh.castShadow = true;
      return mesh;
    } else {
      const geo = new THREE.CylinderGeometry(0.3, 0.4, 0.8, 8);
      const mesh = new THREE.Mesh(geo, this.mats.urnMaterial);
      mesh.position.y = 0.4;
      mesh.castShadow = true;
      return mesh;
    }
  }

  /**
   * Creates the victory trapdoor / abyssal vortex
   */
  public createTrapdoorMesh(): { root: THREE.Group; vortex: THREE.Mesh } {
    const root = new THREE.Group();

    // Stone square frame
    const frameGeo = new THREE.BoxGeometry(2.0, 0.1, 2.0);
    const frame = new THREE.Mesh(frameGeo, this.mats.rockMaterial);
    frame.position.y = 0.05;
    root.add(frame);

    // Swirling void vortex
    const vortexGeo = new THREE.CircleGeometry(0.85, 24);
    vortexGeo.rotateX(-Math.PI / 2);
    const vortexMat = new THREE.MeshBasicMaterial({
      color: 0x9900ff,
      side: THREE.DoubleSide
    });
    const vortex = new THREE.Mesh(vortexGeo, vortexMat);
    vortex.position.y = 0.06;
    root.add(vortex);

    return { root, vortex };
  }
}
