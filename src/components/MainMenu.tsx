import { GameMode } from '../types';
import { Target, Crosshair, MousePointer2, Activity } from 'lucide-react';
import { ElementType } from 'react';

interface Props {
  onStart: (mode: GameMode) => void;
}

const MODES: { id: GameMode; name: string; description: string; icon: ElementType }[] = [
  {
    id: 'GRIDSHOT',
    name: 'Gridshot',
    description: 'Hit 3 targets that appear on a fixed grid. Classic flick training.',
    icon: Target,
  },
  {
    id: 'SPIDERSHOT',
    name: 'Spidershot',
    description: 'Flick from a center target to a random outer target and back.',
    icon: Crosshair,
  },
  {
    id: 'MICROFLICK',
    name: 'Microflick',
    description: 'Small targets appear near the center. Train your precision.',
    icon: MousePointer2,
  },
  {
    id: 'TRACKING',
    name: 'Tracking',
    description: 'Keep your crosshair on a moving target. Hold click to score.',
    icon: Activity,
  },
];

export default function MainMenu({ onStart }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-blue-600 mb-4">
          AIM TRAINER PRO
        </h1>
        <p className="text-zinc-400 text-lg max-w-md mx-auto">
          Improve your mouse control, flicking speed, and tracking precision.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
        {MODES.map((mode) => {
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              onClick={() => onStart(mode.id)}
              className="group relative flex flex-col items-start p-6 text-left bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:bg-zinc-800/80 hover:border-cyan-500/50 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="flex items-center gap-4 mb-3 relative z-10">
                <div className="p-3 bg-zinc-800 rounded-xl group-hover:bg-cyan-500/20 group-hover:text-cyan-400 transition-colors duration-300">
                  <Icon className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">{mode.name}</h2>
              </div>
              
              <p className="text-zinc-400 group-hover:text-zinc-300 transition-colors duration-300 relative z-10">
                {mode.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
