import React, { useEffect, useRef, ElementType } from 'react';
import { motion } from 'motion/react';
import { Target, Crosshair, MousePointer2, Activity, Settings } from 'lucide-react';
import { GameMode, GameSettings, COLOR_SCHEMES, hexToRgba } from '../types';

interface Props {
  onStart: (mode: GameMode) => void;
  settings: GameSettings;
  onOpenSettings: () => void;
}

const MODES: { id: GameMode; name: string; description: string; icon: ElementType }[] = [
  { id: 'GRIDSHOT', name: 'Gridshot', description: '命中网格上出现的3个目标，经典甩枪训练。', icon: Target },
  { id: 'SPIDERSHOT', name: 'Spidershot', description: '从中心目标甩向随机外围目标再返回。', icon: Crosshair },
  { id: 'MICROFLICK', name: 'Microflick', description: '小目标出现在屏幕中心附近，训练精准度。', icon: MousePointer2 },
  { id: 'TRACKING', name: 'Tracking', description: '追踪移动目标，按住鼠标左键得分。', icon: Activity },
];

export default function MainMenu({ onStart, settings, onOpenSettings }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = COLOR_SCHEMES[settings.colorScheme];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let w = 0, h = 0;
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const pts: { x: number; y: number; vx: number; vy: number; size: number }[] = [];
    for (let i = 0; i < 60; i++) {
      pts.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 1.5 + 0.5,
      });
    }

    let animId: number;
    const primary = colors.primary;

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(primary, 0.25);
        ctx.fill();
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = hexToRgba(primary, 0.12 * (1 - dist / 120));
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, [colors.primary]);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6">
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Settings Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={onOpenSettings}
        className="absolute top-6 right-6 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all backdrop-blur-sm z-10"
      >
        <Settings className="w-5 h-5" />
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12 relative z-10"
      >
        <div className="relative">
          <div
            className="absolute inset-0 text-6xl font-black tracking-tighter blur-xl opacity-40 select-none"
            aria-hidden="true"
            style={{ color: colors.primary }}
          >
            AIM TRAINER PRO
          </div>
          <h1
            className="relative text-6xl font-black tracking-tighter"
            style={{
              background: `linear-gradient(135deg, ${colors.secondary}, ${colors.primary})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            AIM TRAINER PRO
          </h1>
        </div>
        <p className="text-zinc-400 text-lg max-w-md mx-auto">
          提升你的鼠标控制、甩枪速度和追踪精度。
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl relative z-10">
        {MODES.map((mode, idx) => {
          const Icon = mode.icon;
          return (
            <motion.button
              key={mode.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.08, duration: 0.4 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onStart(mode.id)}
              className="group relative flex flex-col items-start p-6 text-left bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:bg-zinc-800/80 transition-all duration-300 overflow-hidden backdrop-blur-sm"
              style={{ '--hover-border': colors.primary } as React.CSSProperties}
              onMouseEnter={e => (e.currentTarget.style.borderColor = `${colors.primary}50`)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '')}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `linear-gradient(135deg, ${colors.bg}, transparent)` }}
              />

              <div className="flex items-center gap-4 mb-3 relative z-10">
                <div
                  className="p-3 rounded-xl transition-colors duration-300"
                  style={{ background: 'rgba(39,39,42,1)' }}
                >
                  <Icon className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" style={{ color: colors.primary }} />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">{mode.name}</h2>
              </div>

              <p className="text-zinc-400 group-hover:text-zinc-300 transition-colors duration-300 relative z-10">
                {mode.description}
              </p>
            </motion.button>
          );
        })}
      </div>

      {/* Settings Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8 flex items-center gap-3 text-xs text-zinc-500 relative z-10"
      >
        <span>{settings.duration}秒</span>
        <span className="w-1 h-1 rounded-full bg-zinc-700" />
        <span>大小: {settings.targetSize === 'small' ? '小' : settings.targetSize === 'medium' ? '中' : '大'}</span>
        <span className="w-1 h-1 rounded-full bg-zinc-700" />
        <span>速度: {settings.speed === 'slow' ? '慢' : settings.speed === 'normal' ? '正常' : '快'}</span>
      </motion.div>
    </div>
  );
}
