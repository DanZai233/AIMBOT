import { useEffect, useRef, useState } from 'react';
import { GameMode, GameStats } from '../types';
import { GameEngine } from '../lib/GameEngine';
import { ArrowLeft } from 'lucide-react';

interface Props {
  mode: GameMode;
  onGameOver: (stats: GameStats) => void;
  onQuit: () => void;
}

export default function GameScreen({ mode, onGameOver, onQuit }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  
  const [stats, setStats] = useState({
    score: 0,
    hits: 0,
    misses: 0,
    timeLeft: 60000,
  });

  const [hasStarted, setHasStarted] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const engine = new GameEngine(canvasRef.current, mode);
    engineRef.current = engine;
    
    engine.onUpdateStats = (newStats) => {
      setStats(prev => ({ ...prev, ...newStats }));
    };
    
    engine.onGameOver = (finalStats) => {
      onGameOver(finalStats);
    };

    return () => {
      engine.stop();
    };
  }, [mode, onGameOver]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !hasStarted) {
      setHasStarted(true);
      engineRef.current?.start();
    }
  }, [countdown, hasStarted]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-zinc-900 cursor-crosshair">
      {/* HUD */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-10 pointer-events-none">
        <div className="flex flex-col gap-2">
          <div className="text-4xl font-mono font-bold text-cyan-400 drop-shadow-md">
            {stats.score.toLocaleString()}
          </div>
          <div className="text-zinc-400 font-mono text-sm uppercase tracking-widest">
            Score
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="text-4xl font-mono font-bold text-white drop-shadow-md">
            {formatTime(stats.timeLeft)}
          </div>
          <div className="text-zinc-400 font-mono text-sm uppercase tracking-widest">
            Time Remaining
          </div>
        </div>
      </div>

      {/* Quit Button */}
      <button 
        onClick={onQuit}
        className="absolute bottom-6 left-6 p-3 bg-zinc-800/50 hover:bg-zinc-700/80 rounded-full text-zinc-400 hover:text-white transition-colors z-20"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      {/* Game Canvas */}
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block"
      />

      {/* Countdown Overlay */}
      {!hasStarted && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 z-30 backdrop-blur-sm">
          <div className="text-9xl font-black text-cyan-500 animate-pulse drop-shadow-[0_0_30px_rgba(6,182,212,0.5)]">
            {countdown > 0 ? countdown : 'GO!'}
          </div>
        </div>
      )}
    </div>
  );
}
