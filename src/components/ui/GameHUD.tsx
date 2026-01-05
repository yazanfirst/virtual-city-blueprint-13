import { useGameStore } from '@/stores/gameStore';
import { Coins, Gem, Star, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

type GameHUDProps = {
  combo?: number;
  className?: string;
};

export default function GameHUD({ combo = 1, className = '' }: GameHUDProps) {
  const { coins, xp, level } = useGameStore();
  const gems = useGameStore((state) => (state as any).gems ?? 0);
  
  const [animatedCoins, setAnimatedCoins] = useState(coins);
  const [animatedGems, setAnimatedGems] = useState(gems);
  const [coinPulse, setCoinPulse] = useState(false);
  const [gemPulse, setGemPulse] = useState(false);

  // Animate coin count changes
  useEffect(() => {
    if (coins !== animatedCoins) {
      setCoinPulse(true);
      const timer = setTimeout(() => {
        setAnimatedCoins(coins);
        setCoinPulse(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [coins, animatedCoins]);

  // Animate gem count changes
  useEffect(() => {
    if (gems !== animatedGems) {
      setGemPulse(true);
      const timer = setTimeout(() => {
        setAnimatedGems(gems);
        setGemPulse(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [gems, animatedGems]);

  const xpForNextLevel = 200;
  const currentLevelXp = xp % xpForNextLevel;
  const xpProgress = (currentLevelXp / xpForNextLevel) * 100;

  return (
    <div className={`pointer-events-none absolute left-4 top-4 z-50 flex flex-col gap-2 ${className}`}>
      {/* Coins */}
      <div
        className={`
          flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-900/80 to-yellow-800/80 
          px-4 py-2 backdrop-blur-sm transition-transform
          ${coinPulse ? 'scale-110' : 'scale-100'}
        `}
        style={{
          boxShadow: coinPulse ? '0 0 20px #FFD700' : '0 4px 12px rgba(0,0,0,0.3)',
        }}
      >
        <div className="rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 p-1.5">
          <Coins className="h-4 w-4 text-amber-900" />
        </div>
        <span className="min-w-[60px] font-bold text-yellow-300">
          {animatedCoins.toLocaleString()}
        </span>
      </div>

      {/* Gems */}
      <div
        className={`
          flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-900/80 to-fuchsia-800/80 
          px-4 py-2 backdrop-blur-sm transition-transform
          ${gemPulse ? 'scale-110' : 'scale-100'}
        `}
        style={{
          boxShadow: gemPulse ? '0 0 20px #FF00FF' : '0 4px 12px rgba(0,0,0,0.3)',
        }}
      >
        <div className="rounded-full bg-gradient-to-br from-fuchsia-400 to-purple-500 p-1.5">
          <Gem className="h-4 w-4 text-purple-900" />
        </div>
        <span className="min-w-[40px] font-bold text-fuchsia-300">
          {animatedGems.toLocaleString()}
        </span>
      </div>

      {/* Level & XP */}
      <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-900/80 to-teal-800/80 px-4 py-2 backdrop-blur-sm">
        <div className="rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 p-1.5">
          <Star className="h-4 w-4 text-emerald-900" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-emerald-300">LVL {level}</span>
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-emerald-900/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-300"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Combo indicator */}
      {combo > 1 && (
        <div
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600/90 to-red-500/90 px-4 py-2 backdrop-blur-sm animate-pulse"
          style={{ boxShadow: '0 0 20px rgba(255,100,0,0.5)' }}
        >
          <Zap className="h-5 w-5 text-yellow-300" />
          <span className="font-black text-white">x{combo} COMBO!</span>
        </div>
      )}
    </div>
  );
}
