import * as THREE from 'three';
import { GameSettings, GameStats, COLOR_SCHEMES, TARGET_SIZE_MULTIPLIERS } from '../types';

interface TargetEntry { group: THREE.Group; createdAt: number }
interface ParticleEntry { mesh: THREE.Mesh; velocity: THREE.Vector3; life: number }

export class FPS3DEngine {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock = new THREE.Clock(false);

  private targets: TargetEntry[] = [];
  private particles: ParticleEntry[] = [];
  private raycaster = new THREE.Raycaster();

  private yaw = 0;
  private pitch = 0;
  private sensitivity = 0.0015;

  private score = 0;
  private hits = 0;
  private misses = 0;
  private startTime = 0;
  private duration: number;
  private isRunning = false;
  private animId = 0;
  private missFlash = 0;

  private settings: GameSettings;
  private primaryColor: THREE.Color;
  private secondaryColor: THREE.Color;

  public onUpdateStats?: (s: Partial<GameStats> & { timeLeft: number }) => void;
  public onGameOver?: (s: GameStats) => void;
  public onPointerLockChange?: (locked: boolean) => void;

  constructor(private canvas: HTMLCanvasElement, settings: GameSettings) {
    this.settings = settings;
    this.duration = settings.duration * 1000;
    const c = COLOR_SCHEMES[settings.colorScheme];
    this.primaryColor = new THREE.Color(c.primary);
    this.secondaryColor = new THREE.Color(c.secondary);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x08080c);
    this.scene.fog = new THREE.FogExp2(0x08080c, 0.012);

    this.camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 500);
    this.camera.position.set(0, 4, 0);

    this.buildEnvironment();

    canvas.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('resize', this.handleResize);
    document.addEventListener('pointerlockchange', this.handlePointerLock);
  }

  // ─── Lifecycle ────────────────────────────────────────

  public start() {
    this.score = 0; this.hits = 0; this.misses = 0;
    this.targets.forEach(t => this.scene.remove(t.group));
    this.targets = [];
    this.particles.forEach(p => this.scene.remove(p.mesh));
    this.particles = [];
    this.startTime = performance.now();
    this.isRunning = true;
    this.clock.start();
    for (let i = 0; i < 3; i++) this.spawnTarget();
    this.loop();
  }

  public stop() {
    this.isRunning = false;
    cancelAnimationFrame(this.animId);
    this.clock.stop();
    if (document.pointerLockElement === this.canvas) document.exitPointerLock();
    this.cleanup();
  }

  public requestLock() {
    this.canvas.requestPointerLock();
  }

  private cleanup() {
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('pointerlockchange', this.handlePointerLock);
    document.removeEventListener('mousemove', this.handleMouseMove);
    this.scene.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
        else child.material.dispose();
      }
    });
    this.renderer.dispose();
  }

  // ─── Environment ──────────────────────────────────────

  private buildEnvironment() {
    this.scene.add(new THREE.AmbientLight(0x606070, 1.2));
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(10, 20, 10);
    this.scene.add(dir);

    const grid = new THREE.GridHelper(120, 60, this.primaryColor, this.primaryColor);
    (grid.material as THREE.Material).opacity = 0.07;
    (grid.material as THREE.Material).transparent = true;
    this.scene.add(grid);

    const dustCount = 300;
    const pos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 100;
      pos[i * 3 + 1] = Math.random() * 35;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const dustMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.06, transparent: true, opacity: 0.25 });
    this.scene.add(new THREE.Points(dustGeo, dustMat));
  }

  // ─── Targets ──────────────────────────────────────────

  private getRadius() {
    return (0.7 * TARGET_SIZE_MULTIPLIERS[this.settings.targetSize]);
  }

  private randomPosition(): THREE.Vector3 {
    const dist = 16 + Math.random() * 14;
    const theta = (Math.random() - 0.5) * Math.PI * 1.6;
    const phi = (Math.random() - 0.3) * 0.7;
    return new THREE.Vector3(
      Math.sin(theta) * dist,
      Math.sin(phi) * dist + 5,
      -Math.cos(theta) * dist,
    );
  }

  private spawnTarget() {
    const r = this.getRadius();
    const group = new THREE.Group();

    const glowGeo = new THREE.SphereGeometry(r * 1.4, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({ color: this.primaryColor, transparent: true, opacity: 0.1, side: THREE.BackSide });
    group.add(new THREE.Mesh(glowGeo, glowMat));

    const mainGeo = new THREE.SphereGeometry(r, 24, 24);
    const mainMat = new THREE.MeshStandardMaterial({
      color: this.primaryColor, emissive: this.primaryColor, emissiveIntensity: 0.35, metalness: 0.2, roughness: 0.4,
    });
    group.add(new THREE.Mesh(mainGeo, mainMat));

    const innerGeo = new THREE.SphereGeometry(r * 0.55, 16, 16);
    const innerMat = new THREE.MeshStandardMaterial({
      color: this.secondaryColor, emissive: this.secondaryColor, emissiveIntensity: 0.5, metalness: 0.1, roughness: 0.3,
    });
    group.add(new THREE.Mesh(innerGeo, innerMat));

    const dotGeo = new THREE.SphereGeometry(r * 0.15, 8, 8);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    group.add(new THREE.Mesh(dotGeo, dotMat));

    group.position.copy(this.randomPosition());
    group.scale.setScalar(0.01);
    this.scene.add(group);
    this.targets.push({ group, createdAt: performance.now() });
  }

  private removeTarget(entry: TargetEntry) {
    this.scene.remove(entry.group);
    entry.group.traverse(c => {
      if (c instanceof THREE.Mesh) {
        c.geometry.dispose();
        if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
        else c.material.dispose();
      }
    });
    this.targets = this.targets.filter(t => t !== entry);
  }

  // ─── Effects ──────────────────────────────────────────

  private spawnHitParticles(pos: THREE.Vector3) {
    const count = 14;
    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(0.08, 4, 4);
      const mat = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.5 ? this.primaryColor : this.secondaryColor,
        transparent: true,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      const v = new THREE.Vector3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
      this.scene.add(mesh);
      this.particles.push({ mesh, velocity: v, life: 1 });
    }
    if (this.particles.length > 120) {
      const excess = this.particles.splice(0, this.particles.length - 120);
      excess.forEach(p => { this.scene.remove(p.mesh); p.mesh.geometry.dispose(); (p.mesh.material as THREE.Material).dispose(); });
    }
  }

  // ─── Event Handlers ───────────────────────────────────

  private handleMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return;
    if (document.pointerLockElement !== this.canvas) {
      this.requestLock();
      return;
    }
    if (!this.isRunning) return;

    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const meshes: THREE.Mesh[] = [];
    this.targets.forEach(t => t.group.traverse(c => { if (c instanceof THREE.Mesh) meshes.push(c); }));
    const hits = this.raycaster.intersectObjects(meshes);

    if (hits.length > 0) {
      const hitObj = hits[0].object;
      const entry = this.targets.find(t => {
        let found = false;
        t.group.traverse(c => { if (c === hitObj) found = true; });
        return found;
      });
      if (entry) {
        this.spawnHitParticles(entry.group.position.clone());
        this.removeTarget(entry);
        this.hits++;
        this.score += 100;
        this.spawnTarget();
      }
    } else {
      this.misses++;
      this.score = Math.max(0, this.score - 20);
      this.missFlash = performance.now();
    }
    this.notifyStats();
  };

  private handleMouseMove = (e: MouseEvent) => {
    this.yaw -= e.movementX * this.sensitivity;
    this.pitch -= e.movementY * this.sensitivity;
    this.pitch = Math.max(-1.4, Math.min(1.4, this.pitch));
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  };

  private handleResize = () => {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private handlePointerLock = () => {
    const locked = document.pointerLockElement === this.canvas;
    if (locked) document.addEventListener('mousemove', this.handleMouseMove);
    else document.removeEventListener('mousemove', this.handleMouseMove);
    this.onPointerLockChange?.(locked);
  };

  // ─── Game Logic ───────────────────────────────────────

  private easeOutBack(x: number) {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  }

  private notifyStats() {
    const elapsed = performance.now() - this.startTime;
    this.onUpdateStats?.({ score: this.score, hits: this.hits, misses: this.misses, timeLeft: Math.max(0, this.duration - elapsed) });
  }

  private endGame() {
    this.isRunning = false;
    this.clock.stop();
    if (document.pointerLockElement === this.canvas) document.exitPointerLock();
    const total = this.hits + this.misses;
    this.onGameOver?.({ score: this.score, hits: this.hits, misses: this.misses, totalTime: this.duration, accuracy: total > 0 ? (this.hits / total) * 100 : 0 });
  }

  // ─── Render Loop ──────────────────────────────────────

  private loop = () => {
    if (!this.isRunning) return;
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = performance.now() - this.startTime;
    if (elapsed >= this.duration) { this.endGame(); return; }
    if (Math.floor(elapsed / 1000) > Math.floor((elapsed - dt * 1000) / 1000)) this.notifyStats();

    const now = performance.now();

    for (const t of this.targets) {
      const age = now - t.createdAt;
      const scale = age < 250 ? this.easeOutBack(Math.min(1, age / 250)) : 1;
      t.group.scale.setScalar(scale);
      t.group.rotation.y += dt * 0.3;
      t.group.position.y += Math.sin(now * 0.0015 + t.createdAt) * 0.002;
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.velocity.multiplyScalar(0.94);
      p.velocity.y -= 6 * dt;
      p.life -= dt * 3;
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, p.life);
      p.mesh.scale.setScalar(Math.max(0.01, p.life));
      if (p.life <= 0) {
        this.scene.remove(p.mesh); p.mesh.geometry.dispose(); (p.mesh.material as THREE.Material).dispose();
        this.particles.splice(i, 1);
      }
    }

    const missAge = now - this.missFlash;
    if (this.missFlash > 0 && missAge < 150) {
      const t = 1 - missAge / 150;
      (this.scene.background as THREE.Color).setRGB(0.08 + 0.12 * t, 0.03, 0.03);
    } else {
      (this.scene.background as THREE.Color).setRGB(0.031, 0.031, 0.047);
    }

    this.renderer.render(this.scene, this.camera);
    this.animId = requestAnimationFrame(this.loop);
  };
}
