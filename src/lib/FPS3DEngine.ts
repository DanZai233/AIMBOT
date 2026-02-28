import * as THREE from 'three';
import { GameSettings, GameStats, COLOR_SCHEMES, TARGET_SIZE_MULTIPLIERS, SPEED_MULTIPLIERS, FPS3DMap, FPS3DSubMode } from '../types';

interface TargetEntry { group: THREE.Group; createdAt: number; velocity?: THREE.Vector3 }
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

  private subMode: FPS3DSubMode = 'GRIDSHOT';
  private spidershotAtCenter = true;
  private isTracking = false;
  private trackAccumulator = 0;

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
  private baseBg = new THREE.Color();

  public onUpdateStats?: (s: Partial<GameStats> & { timeLeft: number }) => void;
  public onGameOver?: (s: GameStats) => void;
  public onPointerLockChange?: (locked: boolean) => void;

  constructor(private canvas: HTMLCanvasElement, settings: GameSettings) {
    this.settings = settings;
    this.duration = settings.duration * 1000;
    const c = COLOR_SCHEMES[settings.colorScheme];
    this.primaryColor = new THREE.Color(c.primary);
    this.secondaryColor = new THREE.Color(c.secondary);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 600);
    this.camera.position.set(0, 4, 0);

    this.buildMap(settings.fps3d.map);

    canvas.addEventListener('mousedown', this.handleMouseDown);
    canvas.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('resize', this.handleResize);
    document.addEventListener('pointerlockchange', this.handlePointerLock);
  }

  // ═══════════════════════ MAP ENVIRONMENTS ═══════════════════════

  private buildMap(map: FPS3DMap) {
    switch (map) {
      case 'arena': this.buildArena(); break;
      case 'cyber': this.buildCyber(); break;
      case 'outdoor': this.buildOutdoor(); break;
      case 'neon': this.buildNeon(); break;
      default: this.buildVoid();
    }
  }

  private addDust(count: number, spread: number, height: number, opacity: number) {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 1] = Math.random() * height;
      pos[i * 3 + 2] = (Math.random() - 0.5) * spread;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.06, transparent: true, opacity })));
  }

  // ── Void ──
  private buildVoid() {
    this.baseBg.set(0x08080c);
    this.scene.background = this.baseBg.clone();
    this.scene.fog = new THREE.FogExp2(0x08080c, 0.012);
    this.scene.add(new THREE.AmbientLight(0x606070, 1.2));
    const d = new THREE.DirectionalLight(0xffffff, 0.6); d.position.set(10, 20, 10); this.scene.add(d);
    const grid = new THREE.GridHelper(120, 60, this.primaryColor, this.primaryColor);
    (grid.material as THREE.Material).opacity = 0.07; (grid.material as THREE.Material).transparent = true;
    this.scene.add(grid);
    this.addDust(300, 100, 35, 0.25);
  }

  // ── Arena ──
  private buildArena() {
    this.baseBg.set(0x0c0c14);
    this.scene.background = this.baseBg.clone();
    this.scene.fog = new THREE.FogExp2(0x0c0c14, 0.008);
    this.scene.add(new THREE.AmbientLight(0x404060, 1.0));
    const d = new THREE.DirectionalLight(0xeeeeff, 0.7); d.position.set(5, 15, 5); this.scene.add(d);

    const floorMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.8 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), floorMat);
    floor.rotation.x = -Math.PI / 2; this.scene.add(floor);

    const grid = new THREE.GridHelper(80, 40, this.primaryColor, this.primaryColor);
    (grid.material as THREE.Material).opacity = 0.05; (grid.material as THREE.Material).transparent = true;
    this.scene.add(grid);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x16213e, roughness: 0.6 });
    const wg = new THREE.PlaneGeometry(80, 20);
    const positions: [number, number, number, number][] = [[0, 10, -40, 0], [0, 10, 40, Math.PI], [-40, 10, 0, Math.PI / 2], [40, 10, 0, -Math.PI / 2]];
    for (const [x, y, z, ry] of positions) {
      const w = new THREE.Mesh(wg, wallMat); w.position.set(x, y, z); w.rotation.y = ry; this.scene.add(w);
    }

    const ceilGeo = new THREE.PlaneGeometry(80, 80);
    const ceil = new THREE.Mesh(ceilGeo, new THREE.MeshStandardMaterial({ color: 0x121228, roughness: 0.9 }));
    ceil.position.y = 20; ceil.rotation.x = Math.PI / 2; this.scene.add(ceil);

    const pillarGeo = new THREE.CylinderGeometry(0.8, 1, 20, 8);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x0f3460 });
    for (const [px, pz] of [[-35, -35], [35, -35], [-35, 35], [35, 35], [0, -38], [0, 38]]) {
      const p = new THREE.Mesh(pillarGeo, pillarMat); p.position.set(px, 10, pz); this.scene.add(p);
    }

    const stripMat = new THREE.MeshBasicMaterial({ color: this.primaryColor });
    for (const z of [-39.9, 39.9]) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(80, 0.08, 0.08), stripMat);
      s.position.set(0, 0.5, z); this.scene.add(s);
    }
    this.addDust(150, 70, 18, 0.15);
  }

  // ── Cyber ──
  private buildCyber() {
    this.baseBg.set(0x050510);
    this.scene.background = this.baseBg.clone();
    this.scene.fog = new THREE.FogExp2(0x050510, 0.01);
    this.scene.add(new THREE.AmbientLight(0x303050, 0.8));
    const d = new THREE.DirectionalLight(0x8888ff, 0.4); d.position.set(-10, 20, 5); this.scene.add(d);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({ color: 0x0a0a14, roughness: 0.3, metalness: 0.5 }),
    );
    floor.rotation.x = -Math.PI / 2; this.scene.add(floor);

    const grid = new THREE.GridHelper(200, 100, 0x00aaff, 0x00aaff);
    (grid.material as THREE.Material).opacity = 0.04; (grid.material as THREE.Material).transparent = true;
    this.scene.add(grid);

    const bMat = new THREE.MeshStandardMaterial({ color: 0x0a0a1a, roughness: 0.7 });
    for (let i = 0; i < 25; i++) {
      const w = 3 + Math.random() * 10, h = 8 + Math.random() * 35, dep = 3 + Math.random() * 10;
      const geo = new THREE.BoxGeometry(w, h, dep);
      const m = new THREE.Mesh(geo, bMat);
      const angle = Math.random() * Math.PI * 2, dist = 45 + Math.random() * 60;
      m.position.set(Math.sin(angle) * dist, h / 2, Math.cos(angle) * dist);
      this.scene.add(m);
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: this.primaryColor, transparent: true, opacity: 0.12 }),
      );
      edges.position.copy(m.position); this.scene.add(edges);
    }
    this.addDust(200, 120, 30, 0.2);
  }

  // ── Outdoor ──
  private buildOutdoor() {
    this.baseBg.set(0x6baed6);
    this.scene.background = this.baseBg.clone();
    this.scene.fog = new THREE.FogExp2(0x8ec8e8, 0.006);
    this.scene.add(new THREE.AmbientLight(0x88aacc, 0.9));
    this.scene.add(new THREE.HemisphereLight(0x87ceeb, 0x445522, 0.6));
    const sun = new THREE.DirectionalLight(0xffeedd, 1.2); sun.position.set(50, 40, 30); this.scene.add(sun);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      new THREE.MeshStandardMaterial({ color: 0x4a7c3f, roughness: 0.95 }),
    );
    floor.rotation.x = -Math.PI / 2; this.scene.add(floor);

    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.7 });
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2, dist = 28 + Math.random() * 8, h = 3 + Math.random() * 5;
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, h, 6), pillarMat);
      p.position.set(Math.sin(angle) * dist, h / 2, Math.cos(angle) * dist); this.scene.add(p);
    }

    const mtMat = new THREE.MeshStandardMaterial({ color: 0x556b4f, roughness: 1 });
    for (let i = 0; i < 12; i++) {
      const r = 8 + Math.random() * 14, h = 15 + Math.random() * 25;
      const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 5 + Math.floor(Math.random() * 3)), mtMat);
      const angle = Math.random() * Math.PI * 2, dist = 90 + Math.random() * 60;
      m.position.set(Math.sin(angle) * dist, h / 2 - 3, Math.cos(angle) * dist); this.scene.add(m);
    }
  }

  // ── Neon ──
  private buildNeon() {
    this.baseBg.set(0x020205);
    this.scene.background = this.baseBg.clone();
    this.scene.fog = new THREE.FogExp2(0x020205, 0.018);
    this.scene.add(new THREE.AmbientLight(0x202030, 0.6));

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshStandardMaterial({ color: 0x050508, metalness: 0.85, roughness: 0.15 }),
    );
    floor.rotation.x = -Math.PI / 2; this.scene.add(floor);

    const neonPalette = [0xff00ff, 0x00ffff, 0xff0066, 0x00ff66, 0xffaa00];
    for (let i = 0; i < 20; i++) {
      const len = 4 + Math.random() * 18;
      const color = neonPalette[Math.floor(Math.random() * neonPalette.length)];
      const tube = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.08, len),
        new THREE.MeshBasicMaterial({ color }),
      );
      const angle = Math.random() * Math.PI * 2, dist = 12 + Math.random() * 40;
      tube.position.set(Math.sin(angle) * dist, 1 + Math.random() * 14, Math.cos(angle) * dist);
      tube.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.3);
      this.scene.add(tube);
      const pt = new THREE.PointLight(color, 0.25, 12);
      pt.position.copy(tube.position); this.scene.add(pt);
    }
    this.addDust(100, 60, 15, 0.12);
  }

  // ═══════════════════════ LIFECYCLE ═══════════════════════

  public start(mode: FPS3DSubMode = 'GRIDSHOT') {
    this.subMode = mode;
    this.score = 0; this.hits = 0; this.misses = 0;
    this.spidershotAtCenter = true;
    this.isTracking = false;
    this.trackAccumulator = 0;
    this.targets.forEach(t => this.scene.remove(t.group)); this.targets = [];
    this.particles.forEach(p => this.scene.remove(p.mesh)); this.particles = [];
    this.startTime = performance.now();
    this.isRunning = true;
    this.clock.start();
    this.initTargets();
    this.loop();
  }

  public stopGame() {
    this.isRunning = false;
    cancelAnimationFrame(this.animId);
    this.clock.stop();
    if (document.pointerLockElement === this.canvas) document.exitPointerLock();
    this.targets.forEach(t => {
      this.scene.remove(t.group);
      t.group.traverse(c => {
        if (c instanceof THREE.Mesh) { c.geometry.dispose(); if (Array.isArray(c.material)) c.material.forEach(m => m.dispose()); else c.material.dispose(); }
      });
    });
    this.targets = [];
    this.particles.forEach(p => { this.scene.remove(p.mesh); p.mesh.geometry.dispose(); (p.mesh.material as THREE.Material).dispose(); });
    this.particles = [];
  }

  public stop() {
    this.stopGame();
    this.cleanup();
  }

  public requestLock() { this.canvas.requestPointerLock(); }

  private cleanup() {
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('pointerlockchange', this.handlePointerLock);
    document.removeEventListener('mousemove', this.handleMouseMove);
    this.scene.traverse(c => {
      if (c instanceof THREE.Mesh) {
        c.geometry.dispose();
        if (Array.isArray(c.material)) c.material.forEach(m => m.dispose()); else c.material.dispose();
      }
    });
    this.renderer.dispose();
  }

  // ═══════════════════════ TARGETS ═══════════════════════

  private getRadius() { return 0.7 * TARGET_SIZE_MULTIPLIERS[this.settings.targetSize]; }

  private initTargets() {
    if (this.subMode === 'GRIDSHOT') {
      for (let i = 0; i < 3; i++) this.spawnTarget();
    } else if (this.subMode === 'SPIDERSHOT') {
      this.spawnCenterTarget();
    } else if (this.subMode === 'MICROFLICK' || this.subMode === 'TRACKING') {
      this.spawnTarget();
    }
  }

  private centerPosition(): THREE.Vector3 {
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    const dist = 18;
    return this.camera.position.clone().add(dir.multiplyScalar(dist));
  }

  private randomPosition(): THREE.Vector3 {
    const dist = 16 + Math.random() * 14;
    const theta = (Math.random() - 0.5) * Math.PI * 1.6;
    const phi = (Math.random() - 0.3) * 0.7;
    const baseY = this.settings.fps3d.map === 'outdoor' ? 6 : 5;
    return new THREE.Vector3(Math.sin(theta) * dist, Math.sin(phi) * dist + baseY, -Math.cos(theta) * dist);
  }

  private microPosition(): THREE.Vector3 {
    const dist = 8 + Math.random() * 6;
    const theta = (Math.random() - 0.5) * Math.PI * 1.2;
    const phi = (Math.random() - 0.2) * 0.4;
    const baseY = this.settings.fps3d.map === 'outdoor' ? 6 : 5;
    return new THREE.Vector3(Math.sin(theta) * dist, Math.sin(phi) * dist + baseY, -Math.cos(theta) * dist);
  }

  private spawnCenterTarget() {
    const pos = this.centerPosition();
    this.spawnTargetAt(pos);
  }

  private spawnTarget() {
    let pos: THREE.Vector3;
    let radiusMul = 1;
    let velocity: THREE.Vector3 | undefined;

    if (this.subMode === 'GRIDSHOT') {
      pos = this.randomPosition();
    } else if (this.subMode === 'SPIDERSHOT') {
      pos = this.spidershotAtCenter ? this.centerPosition() : this.randomPosition();
    } else if (this.subMode === 'MICROFLICK') {
      pos = this.microPosition();
      radiusMul = 0.5;
    } else if (this.subMode === 'TRACKING') {
      pos = this.randomPosition();
      const sm = SPEED_MULTIPLIERS[this.settings.speed];
      velocity = new THREE.Vector3(
        (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 3) * sm,
        (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random() * 2) * sm,
        (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random() * 2) * sm,
      );
    } else {
      pos = this.randomPosition();
    }
    this.spawnTargetAt(pos, radiusMul, velocity);
  }

  private spawnTargetAt(pos: THREE.Vector3, radiusMul = 1, velocity?: THREE.Vector3) {
    const r = this.getRadius() * radiusMul;
    const group = new THREE.Group();
    group.add(new THREE.Mesh(
      new THREE.SphereGeometry(r * 1.4, 16, 16),
      new THREE.MeshBasicMaterial({ color: this.primaryColor, transparent: true, opacity: 0.1, side: THREE.BackSide }),
    ));
    group.add(new THREE.Mesh(
      new THREE.SphereGeometry(r, 24, 24),
      new THREE.MeshStandardMaterial({ color: this.primaryColor, emissive: this.primaryColor, emissiveIntensity: 0.35, metalness: 0.2, roughness: 0.4 }),
    ));
    group.add(new THREE.Mesh(
      new THREE.SphereGeometry(r * 0.55, 16, 16),
      new THREE.MeshStandardMaterial({ color: this.secondaryColor, emissive: this.secondaryColor, emissiveIntensity: 0.5, metalness: 0.1, roughness: 0.3 }),
    ));
    group.add(new THREE.Mesh(new THREE.SphereGeometry(r * 0.15, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff })));
    group.position.copy(pos);
    group.scale.setScalar(0.01);
    this.scene.add(group);
    this.targets.push({ group, createdAt: performance.now(), velocity });
  }

  private removeTarget(entry: TargetEntry) {
    this.scene.remove(entry.group);
    entry.group.traverse(c => {
      if (c instanceof THREE.Mesh) { c.geometry.dispose(); if (Array.isArray(c.material)) c.material.forEach(m => m.dispose()); else c.material.dispose(); }
    });
    this.targets = this.targets.filter(t => t !== entry);
  }

  // ═══════════════════════ EFFECTS ═══════════════════════

  private spawnHitParticles(pos: THREE.Vector3) {
    for (let i = 0; i < 14; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: Math.random() > 0.5 ? this.primaryColor : this.secondaryColor, transparent: true });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.08, 4, 4), mat);
      mesh.position.copy(pos);
      this.scene.add(mesh);
      this.particles.push({ mesh, velocity: new THREE.Vector3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10), life: 1 });
    }
    if (this.particles.length > 120) {
      const excess = this.particles.splice(0, this.particles.length - 120);
      excess.forEach(p => { this.scene.remove(p.mesh); p.mesh.geometry.dispose(); (p.mesh.material as THREE.Material).dispose(); });
    }
  }

  // ═══════════════════════ EVENT HANDLERS ═══════════════════════

  private handleMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return;
    if (document.pointerLockElement !== this.canvas) { this.requestLock(); return; }
    if (!this.isRunning) return;

    if (this.subMode === 'TRACKING') { this.isTracking = true; return; }

    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const meshes: THREE.Mesh[] = [];
    this.targets.forEach(t => t.group.traverse(c => { if (c instanceof THREE.Mesh) meshes.push(c); }));
    const hits = this.raycaster.intersectObjects(meshes);

    if (hits.length > 0) {
      const hitObj = hits[0].object;
      const entry = this.targets.find(t => { let f = false; t.group.traverse(c => { if (c === hitObj) f = true; }); return f; });
      if (entry) {
        this.spawnHitParticles(entry.group.position.clone());
        this.removeTarget(entry);
        this.hits++;
        this.score += 100;
        if (this.subMode === 'SPIDERSHOT') this.spidershotAtCenter = !this.spidershotAtCenter;
        this.spawnTarget();
      }
    } else { this.misses++; this.score = Math.max(0, this.score - 20); this.missFlash = performance.now(); }
    this.notifyStats();
  };

  private handleMouseUp = () => {
    if (this.subMode === 'TRACKING') this.isTracking = false;
  };

  private handleMouseMove = (e: MouseEvent) => {
    const sens = 0.0015 * this.settings.fps3d.sensitivity;
    this.yaw -= e.movementX * sens;
    this.pitch -= e.movementY * sens;
    this.pitch = Math.max(-1.4, Math.min(1.4, this.pitch));
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  };

  private handleResize = () => {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.renderer.setSize(w, h);
  };

  private handlePointerLock = () => {
    const locked = document.pointerLockElement === this.canvas;
    if (locked) document.addEventListener('mousemove', this.handleMouseMove);
    else document.removeEventListener('mousemove', this.handleMouseMove);
    this.onPointerLockChange?.(locked);
  };

  // ═══════════════════════ GAME LOGIC ═══════════════════════

  private easeOutBack(x: number) { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }

  private notifyStats() {
    const elapsed = performance.now() - this.startTime;
    this.onUpdateStats?.({ score: this.score, hits: this.hits, misses: this.misses, timeLeft: Math.max(0, this.duration - elapsed) });
  }

  private endGame() {
    this.isRunning = false; this.clock.stop();
    if (document.pointerLockElement === this.canvas) document.exitPointerLock();
    const total = this.hits + this.misses;
    this.onGameOver?.({ score: this.score, hits: this.hits, misses: this.misses, totalTime: this.duration, accuracy: total > 0 ? (this.hits / total) * 100 : 0 });
  }

  // ═══════════════════════ RENDER LOOP ═══════════════════════

  private updateTrackingTarget(dt: number) {
    const t = this.targets[0];
    if (!t || !t.velocity) return;
    t.group.position.addScaledVector(t.velocity, dt);
    const p = t.group.position;
    const lo = 8, hi = 35, yLo = 3, yHi = 12;
    if (p.x < -hi) { p.x = -hi; t.velocity!.x = Math.abs(t.velocity!.x); }
    if (p.x > hi) { p.x = hi; t.velocity!.x = -Math.abs(t.velocity!.x); }
    if (p.z < -hi) { p.z = -hi; t.velocity!.z = Math.abs(t.velocity!.z); }
    if (p.z > hi) { p.z = hi; t.velocity!.z = -Math.abs(t.velocity!.z); }
    if (p.y < yLo) { p.y = yLo; t.velocity!.y = Math.abs(t.velocity!.y); }
    if (p.y > yHi) { p.y = yHi; t.velocity!.y = -Math.abs(t.velocity!.y); }
  }

  private loop = () => {
    if (!this.isRunning) return;
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = performance.now() - this.startTime;
    if (elapsed >= this.duration) { this.endGame(); return; }
    if (Math.floor(elapsed / 1000) > Math.floor((elapsed - dt * 1000) / 1000)) this.notifyStats();
    const now = performance.now();

    if (this.subMode === 'TRACKING') {
      this.updateTrackingTarget(dt);
      if (this.isTracking && this.targets.length > 0) {
        this.trackAccumulator += dt;
        if (this.trackAccumulator >= 0.1) {
          this.trackAccumulator = 0;
          this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
          const meshes: THREE.Mesh[] = [];
          this.targets.forEach(t => t.group.traverse(c => { if (c instanceof THREE.Mesh) meshes.push(c); }));
          const hits = this.raycaster.intersectObjects(meshes);
          if (hits.length > 0) { this.hits++; this.score += 10; }
          else { this.misses++; }
          this.notifyStats();
        }
      }
    }

    for (const t of this.targets) {
      const age = now - t.createdAt;
      t.group.scale.setScalar(age < 250 ? this.easeOutBack(Math.min(1, age / 250)) : 1);
      if (this.subMode !== 'TRACKING') {
        t.group.rotation.y += dt * 0.3;
        t.group.position.y += Math.sin(now * 0.0015 + t.createdAt) * 0.002;
      } else {
        t.group.rotation.y += dt * 0.5;
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.velocity.multiplyScalar(0.94); p.velocity.y -= 6 * dt;
      p.life -= dt * 3;
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, p.life);
      p.mesh.scale.setScalar(Math.max(0.01, p.life));
      if (p.life <= 0) { this.scene.remove(p.mesh); p.mesh.geometry.dispose(); (p.mesh.material as THREE.Material).dispose(); this.particles.splice(i, 1); }
    }

    const missAge = now - this.missFlash;
    const bg = this.scene.background as THREE.Color;
    if (this.missFlash > 0 && missAge < 150) {
      const f = 1 - missAge / 150;
      bg.setRGB(this.baseBg.r + 0.12 * f, this.baseBg.g, this.baseBg.b);
    } else { bg.copy(this.baseBg); }

    this.renderer.render(this.scene, this.camera);
    this.animId = requestAnimationFrame(this.loop);
  };
}
