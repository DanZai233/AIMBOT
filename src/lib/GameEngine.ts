import {
  GameMode, Target, GameStats, HitMarker, Particle, ScorePopup,
  GameSettings, SchemeColors, COLOR_SCHEMES, TARGET_SIZE_MULTIPLIERS, SPEED_MULTIPLIERS, hexToRgba,
} from '../types';

interface Star {
  x: number; y: number; size: number;
  twinklePhase: number; twinkleSpeed: number;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mode: GameMode;
  private settings: GameSettings;
  private dpr: number;
  private logicalWidth = 0;
  private logicalHeight = 0;

  private targets: Target[] = [];
  private hitMarkers: HitMarker[] = [];
  private particles: Particle[] = [];
  private scorePopups: ScorePopup[] = [];

  private score = 0;
  private hits = 0;
  private misses = 0;
  private startTime = 0;
  private duration: number;
  private lastTime = 0;
  private isRunning = false;
  private animationFrameId = 0;

  private isTracking = false;
  private trackingScoreAccumulator = 0;
  private mouseX = 0;
  private mouseY = 0;

  private missFlashTime = 0;
  private stars: Star[] = [];

  public onUpdateStats?: (stats: Partial<GameStats> & { timeLeft: number }) => void;
  public onGameOver?: (stats: GameStats) => void;

  constructor(canvas: HTMLCanvasElement, mode: GameMode, settings: GameSettings) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.mode = mode;
    this.settings = settings;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.duration = settings.duration * 1000;

    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);

    this.resize();
    window.addEventListener('resize', this.resize);

    if (settings.background === 'stars') this.initStars();
  }

  public start() {
    this.score = 0;
    this.hits = 0;
    this.misses = 0;
    this.targets = [];
    this.hitMarkers = [];
    this.particles = [];
    this.scorePopups = [];
    this.startTime = performance.now();
    this.lastTime = this.startTime;
    this.isRunning = true;
    this.initTargets();
    this.loop(this.startTime);
  }

  public stop() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationFrameId);
    this.cleanup();
  }

  private cleanup() {
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('resize', this.resize);
  }

  private resize = () => {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    this.logicalWidth = parent.clientWidth;
    this.logicalHeight = parent.clientHeight;
    this.canvas.width = this.logicalWidth * this.dpr;
    this.canvas.height = this.logicalHeight * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  };

  // ─── Target Spawning ───────────────────────────────────

  private sizeMul() { return TARGET_SIZE_MULTIPLIERS[this.settings.targetSize]; }
  private speedMul() { return SPEED_MULTIPLIERS[this.settings.speed]; }

  private initTargets() {
    if (this.mode === 'GRIDSHOT') {
      for (let i = 0; i < 3; i++) this.spawnGridTarget();
    } else if (this.mode === 'SPIDERSHOT') {
      this.spawnCenterTarget();
    } else if (this.mode === 'MICROFLICK') {
      this.spawnMicroTarget();
    } else if (this.mode === 'TRACKING') {
      this.spawnTrackingTarget();
    }
  }

  private spawnGridTarget() {
    const cols = 4;
    const rows = 3;
    const cellW = this.logicalWidth / cols;
    const cellH = this.logicalHeight / rows;
    let attempts = 0;
    while (attempts < 50) {
      const col = Math.floor(Math.random() * cols);
      const row = Math.floor(Math.random() * rows);
      const x = col * cellW + cellW / 2;
      const y = row * cellH + cellH / 2;
      const isOccupied = this.targets.some(t => Math.abs(t.x - x) < 10 && Math.abs(t.y - y) < 10);
      if (!isOccupied) {
        this.targets.push({
          id: Math.random().toString(36),
          x, y,
          radius: Math.min(cellW, cellH) * 0.25 * this.sizeMul(),
          createdAt: performance.now(),
        });
        break;
      }
      attempts++;
    }
  }

  private spawnCenterTarget() {
    this.targets.push({
      id: 'center',
      x: this.logicalWidth / 2,
      y: this.logicalHeight / 2,
      radius: 40 * this.sizeMul(),
      createdAt: performance.now(),
    });
  }

  private spawnRandomTarget(minDistFromCenter: number, radius: number) {
    const cx = this.logicalWidth / 2;
    const cy = this.logicalHeight / 2;
    let x = 0, y = 0, dist = 0, attempts = 0;
    do {
      x = radius + Math.random() * (this.logicalWidth - radius * 2);
      y = radius + Math.random() * (this.logicalHeight - radius * 2);
      dist = Math.hypot(x - cx, y - cy);
      attempts++;
    } while (dist < minDistFromCenter && attempts < 100);
    this.targets.push({
      id: Math.random().toString(36),
      x, y, radius,
      createdAt: performance.now(),
    });
  }

  private spawnMicroTarget() {
    const cx = this.logicalWidth / 2;
    const cy = this.logicalHeight / 2;
    const angle = Math.random() * Math.PI * 2;
    const dist = 50 + Math.random() * 100;
    this.targets.push({
      id: Math.random().toString(36),
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      radius: 15 * this.sizeMul(),
      createdAt: performance.now(),
    });
  }

  private spawnTrackingTarget() {
    const r = 30 * this.sizeMul();
    const sm = this.speedMul();
    this.targets.push({
      id: 'tracking',
      x: this.logicalWidth / 2,
      y: this.logicalHeight / 2,
      radius: r,
      createdAt: performance.now(),
      vx: (Math.random() > 0.5 ? 1 : -1) * (150 + Math.random() * 100) * sm,
      vy: (Math.random() > 0.5 ? 1 : -1) * (150 + Math.random() * 100) * sm,
    });
  }

  // ─── Event Handlers ────────────────────────────────────

  private handleMouseDown = (e: MouseEvent) => {
    if (!this.isRunning) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (this.mode === 'TRACKING') { this.isTracking = true; return; }

    let hit = false;
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      const scale = this.getTargetScale(t);
      const dist = Math.hypot(t.x - x, t.y - y);
      if (dist <= t.radius * scale) {
        this.hitMarkers.push({ x: t.x, y: t.y, createdAt: performance.now() });
        this.spawnHitParticles(t.x, t.y);
        this.scorePopups.push({ x: t.x, y: t.y - t.radius, value: 100, createdAt: performance.now() });
        this.targets.splice(i, 1);
        this.hits++;
        this.score += 100;
        hit = true;

        if (this.mode === 'GRIDSHOT') {
          this.spawnGridTarget();
        } else if (this.mode === 'SPIDERSHOT') {
          if (t.id === 'center') this.spawnRandomTarget(100, 35 * this.sizeMul());
          else this.spawnCenterTarget();
        } else if (this.mode === 'MICROFLICK') {
          this.spawnMicroTarget();
        }
        break;
      }
    }

    if (!hit) {
      this.misses++;
      this.score = Math.max(0, this.score - 20);
      this.missFlashTime = performance.now();
      this.scorePopups.push({ x, y: y - 10, value: -20, createdAt: performance.now() });
    }
    this.notifyStats();
  };

  private handleMouseMove = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
    this.mouseY = e.clientY - rect.top;
  };

  private handleMouseUp = () => {
    if (this.mode === 'TRACKING') this.isTracking = false;
  };

  // ─── Game Logic ────────────────────────────────────────

  private updateTracking(dt: number) {
    if (this.targets.length === 0) return;
    const t = this.targets[0];
    const sm = this.speedMul();

    t.x += (t.vx || 0) * dt;
    t.y += (t.vy || 0) * dt;

    if (t.x - t.radius < 0) { t.x = t.radius; t.vx = -t.vx!; }
    if (t.x + t.radius > this.logicalWidth) { t.x = this.logicalWidth - t.radius; t.vx = -t.vx!; }
    if (t.y - t.radius < 0) { t.y = t.radius; t.vy = -t.vy!; }
    if (t.y + t.radius > this.logicalHeight) { t.y = this.logicalHeight - t.radius; t.vy = -t.vy!; }

    if (Math.random() < 0.02) {
      t.vx = (t.vx || 0) + (Math.random() - 0.5) * 100;
      t.vy = (t.vy || 0) + (Math.random() - 0.5) * 100;
      const speed = Math.hypot(t.vx, t.vy);
      const targetSpeed = 250 * sm;
      t.vx = (t.vx / speed) * targetSpeed;
      t.vy = (t.vy / speed) * targetSpeed;
    }

    if (this.isTracking) {
      this.trackingScoreAccumulator += dt;
      if (this.trackingScoreAccumulator > 0.1) {
        const dist = Math.hypot(t.x - this.mouseX, t.y - this.mouseY);
        if (dist <= t.radius) {
          this.score += 10;
          this.hits++;
        } else {
          this.misses++;
        }
        this.trackingScoreAccumulator = 0;
        this.notifyStats();
      }
    }
  }

  private getTargetScale(t: Target): number {
    const age = performance.now() - t.createdAt;
    return age < 200 ? this.easeOutBack(Math.min(1, age / 200)) : 1;
  }

  private easeOutBack(x: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
  }

  private notifyStats() {
    if (!this.onUpdateStats) return;
    const elapsed = performance.now() - this.startTime;
    this.onUpdateStats({
      score: this.score,
      hits: this.hits,
      misses: this.misses,
      timeLeft: Math.max(0, this.duration - elapsed),
    });
  }

  private endGame() {
    this.isRunning = false;
    if (this.onGameOver) {
      const totalShots = this.hits + this.misses;
      this.onGameOver({
        score: this.score,
        hits: this.hits,
        misses: this.misses,
        totalTime: this.duration,
        accuracy: totalShots > 0 ? (this.hits / totalShots) * 100 : 0,
      });
    }
  }

  // ─── Particles & Effects ───────────────────────────────

  private spawnHitParticles(x: number, y: number) {
    const colors = COLOR_SCHEMES[this.settings.colorScheme];
    const count = 10 + Math.floor(Math.random() * 5);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 100 + Math.random() * 200;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 0.3 + Math.random() * 0.3,
        size: 2 + Math.random() * 3,
        color: Math.random() > 0.5 ? colors.primary : colors.secondary,
      });
    }
    if (this.particles.length > 150) this.particles.splice(0, this.particles.length - 150);
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.vy += 200 * dt;
      p.life -= dt / p.maxLife;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  private initStars() {
    for (let i = 0; i < 150; i++) {
      this.stars.push({
        x: Math.random(), y: Math.random(),
        size: Math.random() * 1.5 + 0.5,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.5 + Math.random() * 2,
      });
    }
  }

  // ─── Main Loop ─────────────────────────────────────────

  private loop = (time: number) => {
    if (!this.isRunning) return;
    const dt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;

    const elapsed = time - this.startTime;
    if (this.duration - elapsed <= 0) { this.endGame(); return; }

    if (this.mode === 'TRACKING') this.updateTracking(dt);
    this.updateParticles(dt);
    this.draw(time);

    if (Math.floor(elapsed / 1000) > Math.floor((elapsed - dt * 1000) / 1000)) {
      this.notifyStats();
    }
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  // ─── Drawing ───────────────────────────────────────────

  private draw(time: number) {
    this.ctx.save();
    this.drawBackground(time);
    this.drawCrosshairLines();
    for (const t of this.targets) this.drawTarget(t);
    this.drawParticlesFx();
    this.drawHitMarkers();
    this.drawScorePopups();
    this.drawMissVignette();
    this.drawTrackingFeedback();
    this.drawCursor();
    this.ctx.restore();
  }

  // ─── Backgrounds ───────────────────────────────────────

  private drawBackground(time: number) {
    switch (this.settings.background) {
      case 'grid': this.drawGridBg(); break;
      case 'gradient': this.drawGradientBg(time); break;
      case 'stars': this.drawStarsBg(time); break;
      default: this.drawDarkBg();
    }
  }

  private drawDarkBg() {
    this.ctx.fillStyle = '#18181b';
    this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
  }

  private drawGridBg() {
    this.ctx.fillStyle = '#111114';
    this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
    const sp = 50;
    this.ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    this.ctx.lineWidth = 1;
    for (let x = 0; x <= this.logicalWidth; x += sp) {
      this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, this.logicalHeight); this.ctx.stroke();
    }
    for (let y = 0; y <= this.logicalHeight; y += sp) {
      this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(this.logicalWidth, y); this.ctx.stroke();
    }
  }

  private drawGradientBg(time: number) {
    this.ctx.fillStyle = '#0a0a0f';
    this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
    const t = time / 8000;
    const cx = this.logicalWidth / 2;
    const cy = this.logicalHeight / 2;
    const r = Math.max(this.logicalWidth, this.logicalHeight);
    const colors = COLOR_SCHEMES[this.settings.colorScheme];

    const x1 = cx + Math.cos(t) * r * 0.3;
    const y1 = cy + Math.sin(t) * r * 0.3;
    const g1 = this.ctx.createRadialGradient(x1, y1, 0, x1, y1, r * 0.6);
    g1.addColorStop(0, colors.bg);
    g1.addColorStop(1, 'rgba(0,0,0,0)');
    this.ctx.fillStyle = g1;
    this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);

    const x2 = cx + Math.cos(t + 2.5) * r * 0.25;
    const y2 = cy + Math.sin(t + 2.5) * r * 0.25;
    const g2 = this.ctx.createRadialGradient(x2, y2, 0, x2, y2, r * 0.4);
    g2.addColorStop(0, 'rgba(88,28,135,0.08)');
    g2.addColorStop(1, 'rgba(0,0,0,0)');
    this.ctx.fillStyle = g2;
    this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
  }

  private drawStarsBg(time: number) {
    this.ctx.fillStyle = '#0a0a0f';
    this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
    const t = time / 1000;
    for (const s of this.stars) {
      const alpha = 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(t * s.twinkleSpeed + s.twinklePhase));
      this.ctx.beginPath();
      this.ctx.arc(s.x * this.logicalWidth, s.y * this.logicalHeight, s.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      this.ctx.fill();
    }
  }

  private drawCrosshairLines() {
    const colors = COLOR_SCHEMES[this.settings.colorScheme];
    this.ctx.strokeStyle = hexToRgba(colors.primary, 0.08);
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(this.logicalWidth / 2, 0);
    this.ctx.lineTo(this.logicalWidth / 2, this.logicalHeight);
    this.ctx.moveTo(0, this.logicalHeight / 2);
    this.ctx.lineTo(this.logicalWidth, this.logicalHeight / 2);
    this.ctx.stroke();
  }

  // ─── Target Drawing ────────────────────────────────────

  private drawTarget(t: Target) {
    const scale = this.getTargetScale(t);
    const r = t.radius * scale;
    if (r < 0.5) return;
    const colors = COLOR_SCHEMES[this.settings.colorScheme];
    this.ctx.save();
    this.ctx.shadowColor = colors.glow;
    this.ctx.shadowBlur = 15 * scale;
    switch (this.settings.targetShape) {
      case 'circle':   this.drawCircle(t.x, t.y, r, colors); break;
      case 'diamond':  this.drawDiamond(t.x, t.y, r, colors); break;
      case 'star':     this.drawStar(t.x, t.y, r, colors); break;
      case 'hexagon':  this.drawHexagon(t.x, t.y, r, colors); break;
      case 'triangle': this.drawTriangle(t.x, t.y, r, colors); break;
    }
    this.ctx.restore();
  }

  private drawCircle(x: number, y: number, r: number, c: SchemeColors) {
    this.ctx.beginPath(); this.ctx.arc(x, y, r, 0, Math.PI * 2);
    this.ctx.fillStyle = c.primary; this.ctx.fill();
    this.ctx.beginPath(); this.ctx.arc(x, y, r * 0.6, 0, Math.PI * 2);
    this.ctx.fillStyle = c.secondary; this.ctx.fill();
    this.ctx.beginPath(); this.ctx.arc(x, y, r * 0.2, 0, Math.PI * 2);
    this.ctx.fillStyle = '#fff'; this.ctx.fill();
  }

  private drawDiamond(x: number, y: number, r: number, c: SchemeColors) {
    this.ctx.beginPath();
    this.ctx.moveTo(x, y - r); this.ctx.lineTo(x + r, y);
    this.ctx.lineTo(x, y + r); this.ctx.lineTo(x - r, y); this.ctx.closePath();
    this.ctx.fillStyle = c.primary; this.ctx.fill();
    const ir = r * 0.55;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y - ir); this.ctx.lineTo(x + ir, y);
    this.ctx.lineTo(x, y + ir); this.ctx.lineTo(x - ir, y); this.ctx.closePath();
    this.ctx.fillStyle = c.secondary; this.ctx.fill();
    this.ctx.beginPath(); this.ctx.arc(x, y, r * 0.15, 0, Math.PI * 2);
    this.ctx.fillStyle = '#fff'; this.ctx.fill();
  }

  private drawStar(x: number, y: number, r: number, c: SchemeColors) {
    const star = (cx: number, cy: number, rad: number) => {
      this.ctx.beginPath();
      for (let i = 0; i <= 10; i++) {
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        const d = i % 2 === 0 ? rad : rad * 0.4;
        const px = cx + Math.cos(angle) * d;
        const py = cy + Math.sin(angle) * d;
        if (i === 0) this.ctx.moveTo(px, py); else this.ctx.lineTo(px, py);
      }
      this.ctx.closePath();
    };
    star(x, y, r); this.ctx.fillStyle = c.primary; this.ctx.fill();
    star(x, y, r * 0.55); this.ctx.fillStyle = c.secondary; this.ctx.fill();
    this.ctx.beginPath(); this.ctx.arc(x, y, r * 0.15, 0, Math.PI * 2);
    this.ctx.fillStyle = '#fff'; this.ctx.fill();
  }

  private drawHexagon(x: number, y: number, r: number, c: SchemeColors) {
    const hex = (cx: number, cy: number, rad: number) => {
      this.ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3 - Math.PI / 6;
        const px = cx + Math.cos(a) * rad;
        const py = cy + Math.sin(a) * rad;
        if (i === 0) this.ctx.moveTo(px, py); else this.ctx.lineTo(px, py);
      }
      this.ctx.closePath();
    };
    hex(x, y, r); this.ctx.fillStyle = c.primary; this.ctx.fill();
    hex(x, y, r * 0.6); this.ctx.fillStyle = c.secondary; this.ctx.fill();
    this.ctx.beginPath(); this.ctx.arc(x, y, r * 0.15, 0, Math.PI * 2);
    this.ctx.fillStyle = '#fff'; this.ctx.fill();
  }

  private drawTriangle(x: number, y: number, r: number, c: SchemeColors) {
    const tri = (cx: number, cy: number, rad: number) => {
      this.ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = (i * 2 * Math.PI) / 3 - Math.PI / 2;
        const px = cx + Math.cos(a) * rad;
        const py = cy + Math.sin(a) * rad;
        if (i === 0) this.ctx.moveTo(px, py); else this.ctx.lineTo(px, py);
      }
      this.ctx.closePath();
    };
    tri(x, y, r); this.ctx.fillStyle = c.primary; this.ctx.fill();
    tri(x, y, r * 0.55); this.ctx.fillStyle = c.secondary; this.ctx.fill();
    this.ctx.beginPath(); this.ctx.arc(x, y, r * 0.12, 0, Math.PI * 2);
    this.ctx.fillStyle = '#fff'; this.ctx.fill();
  }

  // ─── Effects Drawing ───────────────────────────────────

  private drawParticlesFx() {
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life);
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;
  }

  private drawHitMarkers() {
    const now = performance.now();
    for (let i = this.hitMarkers.length - 1; i >= 0; i--) {
      const hm = this.hitMarkers[i];
      const age = now - hm.createdAt;
      if (age > 300) { this.hitMarkers.splice(i, 1); continue; }
      const alpha = 1 - age / 300;
      const colors = COLOR_SCHEMES[this.settings.colorScheme];
      this.ctx.beginPath();
      this.ctx.arc(hm.x, hm.y, 20 + age * 0.15, 0, Math.PI * 2);
      this.ctx.strokeStyle = hexToRgba(colors.secondary, alpha);
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
  }

  private drawScorePopups() {
    const now = performance.now();
    const colors = COLOR_SCHEMES[this.settings.colorScheme];
    for (let i = this.scorePopups.length - 1; i >= 0; i--) {
      const sp = this.scorePopups[i];
      const age = (now - sp.createdAt) / 1000;
      if (age > 0.8) { this.scorePopups.splice(i, 1); continue; }
      const progress = age / 0.8;
      const alpha = 1 - progress;
      const yOff = progress * 40;
      this.ctx.globalAlpha = alpha;
      this.ctx.font = 'bold 16px ui-monospace, monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = sp.value > 0 ? colors.text : '#ef4444';
      this.ctx.fillText(sp.value > 0 ? `+${sp.value}` : `${sp.value}`, sp.x, sp.y - yOff);
      this.ctx.globalAlpha = 1;
    }
  }

  private drawMissVignette() {
    const age = performance.now() - this.missFlashTime;
    if (age > 200 || this.missFlashTime === 0) return;
    const alpha = 0.25 * (1 - age / 200);
    const grd = this.ctx.createRadialGradient(
      this.logicalWidth / 2, this.logicalHeight / 2, this.logicalWidth * 0.3,
      this.logicalWidth / 2, this.logicalHeight / 2, this.logicalWidth * 0.7,
    );
    grd.addColorStop(0, 'rgba(239,68,68,0)');
    grd.addColorStop(1, `rgba(239,68,68,${alpha})`);
    this.ctx.fillStyle = grd;
    this.ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
  }

  private drawTrackingFeedback() {
    if (this.mode !== 'TRACKING' || !this.isTracking) return;
    const t = this.targets[0];
    if (!t) return;
    const dist = Math.hypot(t.x - this.mouseX, t.y - this.mouseY);
    this.ctx.beginPath();
    this.ctx.arc(this.mouseX, this.mouseY, 5, 0, Math.PI * 2);
    this.ctx.fillStyle = dist <= t.radius ? '#22c55e' : '#ef4444';
    this.ctx.fill();
  }

  // ─── Custom Cursor ─────────────────────────────────────

  private drawCursor() {
    const x = this.mouseX;
    const y = this.mouseY;
    if (x === 0 && y === 0) return;
    const colors = COLOR_SCHEMES[this.settings.colorScheme];

    this.ctx.save();
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;

    switch (this.settings.cursorStyle) {
      case 'crosshair': {
        const gap = 5;
        const len = 14;
        this.ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - gap); this.ctx.lineTo(x, y - gap - len);
        this.ctx.moveTo(x, y + gap); this.ctx.lineTo(x, y + gap + len);
        this.ctx.moveTo(x - gap, y); this.ctx.lineTo(x - gap - len, y);
        this.ctx.moveTo(x + gap, y); this.ctx.lineTo(x + gap + len, y);
        this.ctx.stroke();
        this.ctx.beginPath(); this.ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        this.ctx.fillStyle = colors.primary; this.ctx.fill();
        break;
      }
      case 'dot': {
        this.ctx.beginPath(); this.ctx.arc(x, y, 4, 0, Math.PI * 2);
        this.ctx.fillStyle = colors.primary; this.ctx.fill();
        break;
      }
      case 'ring': {
        this.ctx.beginPath(); this.ctx.arc(x, y, 12, 0, Math.PI * 2);
        this.ctx.strokeStyle = colors.primary; this.ctx.lineWidth = 1.5; this.ctx.stroke();
        this.ctx.beginPath(); this.ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        this.ctx.fillStyle = '#fff'; this.ctx.fill();
        break;
      }
      case 'precise': {
        const len = 8;
        this.ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(x - len, y); this.ctx.lineTo(x + len, y);
        this.ctx.moveTo(x, y - len); this.ctx.lineTo(x, y + len);
        this.ctx.stroke();
        this.ctx.beginPath(); this.ctx.arc(x, y, 2, 0, Math.PI * 2);
        this.ctx.fillStyle = colors.primary; this.ctx.fill();
        break;
      }
    }
    this.ctx.restore();
  }
}
