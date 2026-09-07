import * as THREE from 'three';

export class InputManager {
  private static instance: InputManager;
  public keys: Set<string> = new Set();
  public mouseScreen: THREE.Vector2 = new THREE.Vector2();
  public mouseWorld: THREE.Vector3 = new THREE.Vector3();
  public isMouseDown: boolean = false;
  public isDashRequested: boolean = false;
  public isInteractRequested: boolean = false;
  public isBombRequested: boolean = false;

  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private groundPlane: THREE.Plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  private constructor() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (e.code === 'Space') {
        this.isDashRequested = true;
      }
      if (e.code === 'KeyE' || e.code === 'KeyF') {
        this.isInteractRequested = true;
      }
      if (e.code === 'KeyQ' || e.code === 'ShiftLeft') {
        this.isBombRequested = true;
      }
      // Prevent default scrolling for arrows and space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });

    window.addEventListener('mousemove', (e) => {
      this.mouseScreen.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouseScreen.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.isMouseDown = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.isMouseDown = false;
      }
    });
  }

  public static get(): InputManager {
    if (!InputManager.instance) {
      InputManager.instance = new InputManager();
    }
    return InputManager.instance;
  }

  public update(camera: THREE.Camera) {
    // Project mouse coordinates to ground plane (Y=0)
    this.raycaster.setFromCamera(this.mouseScreen, camera);
    const hitPoint = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.groundPlane, hitPoint);
    if (hitPoint) {
      this.mouseWorld.copy(hitPoint);
    }
  }

  public getMovementVector(): THREE.Vector2 {
    const move = new THREE.Vector2(0, 0);

    // WASD controls
    if (this.keys.has('KeyW')) move.y -= 1;
    if (this.keys.has('KeyS')) move.y += 1;
    if (this.keys.has('KeyA')) move.x -= 1;
    if (this.keys.has('KeyD')) move.x += 1;

    if (move.lengthSq() > 0) {
      move.normalize();
    }
    return move;
  }

  /**
   * Returns shooting direction vector if player is shooting, or null if not shooting.
   * Prioritizes Arrow Keys (Isaac-style 4-way), fallback to Mouse Aiming if held down.
   */
  public getShootingDirection(playerPosition: THREE.Vector3): THREE.Vector2 | null {
    // Check Arrow keys (4-way cardinal)
    const arrowDir = new THREE.Vector2(0, 0);
    if (this.keys.has('ArrowUp') || this.keys.has('KeyI')) arrowDir.y -= 1;
    if (this.keys.has('ArrowDown') || this.keys.has('KeyK')) arrowDir.y += 1;
    if (this.keys.has('ArrowLeft') || this.keys.has('KeyJ')) arrowDir.x -= 1;
    if (this.keys.has('ArrowRight') || this.keys.has('KeyL')) arrowDir.x += 1;

    if (arrowDir.lengthSq() > 0) {
      arrowDir.normalize();
      return arrowDir;
    }

    // Mouse shooting (360 twin-stick)
    if (this.isMouseDown) {
      const mouseDir = new THREE.Vector2(
        this.mouseWorld.x - playerPosition.x,
        this.mouseWorld.z - playerPosition.z
      );
      if (mouseDir.lengthSq() > 0.05) {
        mouseDir.normalize();
        return mouseDir;
      }
    }

    return null;
  }

  public consumeDash(): boolean {
    const res = this.isDashRequested;
    this.isDashRequested = false;
    return res;
  }

  public consumeInteract(): boolean {
    const res = this.isInteractRequested;
    this.isInteractRequested = false;
    return res;
  }

  public consumeBomb(): boolean {
    const res = this.isBombRequested;
    this.isBombRequested = false;
    return res;
  }
}
