import { GameMode, Target, GameStats, HitMarker } from '../types';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mode: GameMode;
  private targets: Target[] = [];
  private hitMarkers: HitMarker[] = [];
  private animationFrameId: number = 0;
  
  private score: number = 0;
  private hits: number = 0;
  private misses: number = 0;
  private startTime: number = 0;
  private duration: number = 60000; // 60 seconds
  private lastTime: number = 0;
  private isRunning: boolean = false;
  
  // Tracking mode specific
  private isTracking: boolean = false;
  private trackingScoreAccumulator: number = 0;
  private mouseX: number = 0;
  private mouseY: number = 0;

  // Callbacks
  public onUpdateStats?: (stats: Partial<GameStats> & { timeLeft: number }) => void;
  public onGameOver?: (stats: GameStats) => void;

  constructor(canvas: HTMLCanvasElement, mode: GameMode) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.mode = mode;
    
    // Bind events
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
    
    this.resize();
    window.addEventListener('resize', this.resize);
  }

  public start() {
    this.score = 0;
    this.hits = 0;
    this.misses = 0;
    this.targets = [];
    this.hitMarkers = [];
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
    if (parent) {
      this.canvas.width = parent.clientWidth;
      this.canvas.height = parent.clientHeight;
    }
  };

  private initTargets() {
    if (this.mode === 'GRIDSHOT') {
      for (let i = 0; i < 3; i++) {
        this.spawnGridTarget();
      }
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
    const cellW = this.canvas.width / cols;
    const cellH = this.canvas.height / rows;
    
    // Find an empty cell
    let attempts = 0;
    while (attempts < 50) {
      const col = Math.floor(Math.random() * cols);
      const row = Math.floor(Math.random() * rows);
      const x = col * cellW + cellW / 2;
      const y = row * cellH + cellH / 2;
      
      const isOccupied = this.targets.some(t => Math.abs(t.x - x) < 10 && Math.abs(t.y - y) < 10);
      if (!isOccupied) {
        this.targets.push({
          id: Math.random().toString(),
          x,
          y,
          radius: Math.min(cellW, cellH) * 0.25,
          createdAt: performance.now()
        });
        break;
      }
      attempts++;
    }
  }

  private spawnCenterTarget() {
    this.targets.push({
      id: 'center',
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      radius: 40,
      createdAt: performance.now()
    });
  }

  private spawnRandomTarget(minDistFromCenter: number, radius: number) {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    
    let x, y;
    let dist = 0;
    let attempts = 0;
    do {
      x = radius + Math.random() * (this.canvas.width - radius * 2);
      y = radius + Math.random() * (this.canvas.height - radius * 2);
      dist = Math.hypot(x - cx, y - cy);
      attempts++;
    } while (dist < minDistFromCenter && attempts < 100);

    this.targets.push({
      id: Math.random().toString(),
      x,
      y,
      radius,
      createdAt: performance.now()
    });
  }

  private spawnMicroTarget() {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    const angle = Math.random() * Math.PI * 2;
    const dist = 50 + Math.random() * 100;
    
    this.targets.push({
      id: Math.random().toString(),
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      radius: 15,
      createdAt: performance.now()
    });
  }

  private spawnTrackingTarget() {
    const radius = 30;
    this.targets.push({
      id: 'tracking',
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      radius,
      createdAt: performance.now(),
      vx: (Math.random() > 0.5 ? 1 : -1) * (150 + Math.random() * 100), // pixels per second
      vy: (Math.random() > 0.5 ? 1 : -1) * (150 + Math.random() * 100)
    });
  }

  private handleMouseDown = (e: MouseEvent) => {
    if (!this.isRunning) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (this.mode === 'TRACKING') {
      this.isTracking = true;
      return;
    }

    let hit = false;
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      const dist = Math.hypot(t.x - x, t.y - y);
      if (dist <= t.radius) {
        // Hit
        this.hitMarkers.push({ x: t.x, y: t.y, createdAt: performance.now() });
        this.targets.splice(i, 1);
        this.hits++;
        this.score += 100;
        hit = true;
        
        // Spawn new target based on mode
        if (this.mode === 'GRIDSHOT') {
          this.spawnGridTarget();
        } else if (this.mode === 'SPIDERSHOT') {
          if (t.id === 'center') {
            this.spawnRandomTarget(100, 35);
          } else {
            this.spawnCenterTarget();
          }
        } else if (this.mode === 'MICROFLICK') {
          this.spawnMicroTarget();
        }
        break; // Only hit one target per click
      }
    }

    if (!hit) {
      this.misses++;
      this.score = Math.max(0, this.score - 20); // Penalty for miss
    }
    
    this.notifyStats();
  };

  private handleMouseMove = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
    this.mouseY = e.clientY - rect.top;
  };

  private handleMouseUp = () => {
    if (this.mode === 'TRACKING') {
      this.isTracking = false;
    }
  };

  private updateTracking(dt: number) {
    if (this.targets.length === 0) return;
    
    const t = this.targets[0];
    
    // Move target
    t.x += (t.vx || 0) * dt;
    t.y += (t.vy || 0) * dt;
    
    // Bounce off walls
    if (t.x - t.radius < 0) { t.x = t.radius; t.vx = -t.vx!; }
    if (t.x + t.radius > this.canvas.width) { t.x = this.canvas.width - t.radius; t.vx = -t.vx!; }
    if (t.y - t.radius < 0) { t.y = t.radius; t.vy = -t.vy!; }
    if (t.y + t.radius > this.canvas.height) { t.y = this.canvas.height - t.radius; t.vy = -t.vy!; }
    
    // Randomly change direction slightly
    if (Math.random() < 0.02) {
      t.vx = (t.vx || 0) + (Math.random() - 0.5) * 100;
      t.vy = (t.vy || 0) + (Math.random() - 0.5) * 100;
      
      // Normalize speed to prevent it from getting too fast or slow
      const speed = Math.hypot(t.vx, t.vy);
      const targetSpeed = 250;
      t.vx = (t.vx / speed) * targetSpeed;
      t.vy = (t.vy / speed) * targetSpeed;
    }

    // Check tracking
    if (this.isTracking) {
      this.trackingScoreAccumulator += dt;
      if (this.trackingScoreAccumulator > 0.1) {
        const dist = Math.hypot(t.x - this.mouseX, t.y - this.mouseY);
        if (dist <= t.radius) {
          this.score += 10;
          this.hits++; // Count as hits for accuracy metric
        } else {
          // Missed tracking
          this.misses++;
        }
        this.trackingScoreAccumulator = 0;
        this.notifyStats();
      }
    }
  }

  private notifyStats() {
    if (!this.onUpdateStats) return;
    const now = performance.now();
    const elapsed = now - this.startTime;
    const timeLeft = Math.max(0, this.duration - elapsed);
    
    this.onUpdateStats({
      score: this.score,
      hits: this.hits,
      misses: this.misses,
      timeLeft
    });
  }

  private loop = (time: number) => {
    if (!this.isRunning) return;
    
    const dt = (time - this.lastTime) / 1000; // in seconds
    this.lastTime = time;
    
    const elapsed = time - this.startTime;
    const timeLeft = Math.max(0, this.duration - elapsed);
    
    if (timeLeft <= 0) {
      this.endGame();
      return;
    }

    if (this.mode === 'TRACKING') {
      this.updateTracking(dt);
    }

    this.draw();
    
    // Only notify stats occasionally if not tracking to save renders, or just let React handle it.
    // We already notify on click. For time, we can notify every second.
    if (Math.floor(elapsed / 1000) > Math.floor((elapsed - dt * 1000) / 1000)) {
      this.notifyStats();
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private draw() {
    // Clear
    this.ctx.fillStyle = '#18181b'; // zinc-900
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw crosshair
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width / 2, 0);
    this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
    this.ctx.moveTo(0, this.canvas.height / 2);
    this.ctx.lineTo(this.canvas.width, this.canvas.height / 2);
    this.ctx.stroke();

    // Draw targets
    for (const t of this.targets) {
      this.ctx.beginPath();
      this.ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = '#06b6d4'; // cyan-500
      this.ctx.fill();
      
      // Inner highlight
      this.ctx.beginPath();
      this.ctx.arc(t.x, t.y, t.radius * 0.6, 0, Math.PI * 2);
      this.ctx.fillStyle = '#22d3ee'; // cyan-400
      this.ctx.fill();
      
      // Center dot
      this.ctx.beginPath();
      this.ctx.arc(t.x, t.y, t.radius * 0.2, 0, Math.PI * 2);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fill();
    }

    // Draw hit markers
    const now = performance.now();
    for (let i = this.hitMarkers.length - 1; i >= 0; i--) {
      const hm = this.hitMarkers[i];
      const age = now - hm.createdAt;
      if (age > 300) {
        this.hitMarkers.splice(i, 1);
        continue;
      }
      const alpha = 1 - age / 300;
      this.ctx.beginPath();
      this.ctx.arc(hm.x, hm.y, 20 + age * 0.1, 0, Math.PI * 2);
      this.ctx.strokeStyle = `rgba(34, 197, 94, ${alpha})`; // green-500
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
    
    // Draw tracking cursor feedback
    if (this.mode === 'TRACKING' && this.isTracking) {
      const t = this.targets[0];
      if (t) {
        const dist = Math.hypot(t.x - this.mouseX, t.y - this.mouseY);
        this.ctx.beginPath();
        this.ctx.arc(this.mouseX, this.mouseY, 5, 0, Math.PI * 2);
        this.ctx.fillStyle = dist <= t.radius ? '#22c55e' : '#ef4444'; // green or red
        this.ctx.fill();
      }
    }
  }

  private endGame() {
    this.isRunning = false;
    this.ctx.fillStyle = '#18181b';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    if (this.onGameOver) {
      const totalShots = this.hits + this.misses;
      const accuracy = totalShots > 0 ? (this.hits / totalShots) * 100 : 0;
      
      this.onGameOver({
        score: this.score,
        hits: this.hits,
        misses: this.misses,
        totalTime: this.duration,
        accuracy
      });
    }
  }
}
