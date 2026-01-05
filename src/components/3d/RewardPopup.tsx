import { useEffect, useState } from 'react';
import { Reward, BoxRarity, RARITY_CONFIG } from '@/config/mysteryBoxes.config';
import { Sparkles, Star, Gem, Coins, Gift } from 'lucide-react';

type RewardPopupProps = {
  reward: Reward | null;
  rarity: BoxRarity;
  onComplete: () => void;
};

export default function RewardPopup({ reward, rarity, onComplete }: RewardPopupProps) {
  const [stage, setStage] = useState<'enter' | 'show' | 'exit'>('enter');
  const config = RARITY_CONFIG[rarity];
  
  useEffect(() => {
    if (!reward) return;
    
    setStage('enter');
    
    const showTimer = setTimeout(() => setStage('show'), 100);
    const exitTimer = setTimeout(() => setStage('exit'), 2000);
    const completeTimer = setTimeout(onComplete, 2500);
    
    return () => {
      clearTimeout(showTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [reward, onComplete]);

  if (!reward) return null;

  const getIcon = () => {
    switch (reward.type) {
      case 'coins': return <Coins className="h-8 w-8" />;
      case 'gems': return <Gem className="h-8 w-8" />;
      case 'xp': return <Star className="h-8 w-8" />;
      case 'mystery': return <Gift className="h-8 w-8" />;
    }
  };

  const getRarityLabel = () => {
    switch (rarity) {
      case 'common': return 'COMMON';
      case 'rare': return 'RARE';
      case 'epic': return 'EPIC!';
      case 'legendary': return '★ LEGENDARY ★';
    }
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
      <div
        className={`
          flex flex-col items-center gap-2 rounded-2xl border-2 px-8 py-6 backdrop-blur-lg
          transition-all duration-300 ease-out
          ${stage === 'enter' ? 'scale-0 opacity-0' : ''}
          ${stage === 'show' ? 'scale-100 opacity-100' : ''}
          ${stage === 'exit' ? 'translate-y-[-50px] scale-110 opacity-0' : ''}
        `}
        style={{
          background: `linear-gradient(135deg, ${config.color}33, ${config.glowColor}22)`,
          borderColor: config.glowColor,
          boxShadow: `0 0 30px ${config.glowColor}66, 0 0 60px ${config.particleColor}33`,
        }}
      >
        {/* Rarity badge */}
        <div
          className="mb-1 rounded-full px-3 py-1 text-xs font-bold tracking-wider"
          style={{
            background: config.color,
            color: rarity === 'legendary' ? '#000' : '#fff',
          }}
        >
          {getRarityLabel()}
        </div>
        
        {/* Icon and sparkles */}
        <div className="relative">
          <Sparkles
            className="absolute -left-4 -top-2 h-5 w-5 animate-pulse"
            style={{ color: config.glowColor }}
          />
          <div
            className="rounded-full p-4"
            style={{
              background: `linear-gradient(135deg, ${config.color}, ${config.glowColor})`,
              boxShadow: `0 0 20px ${config.glowColor}`,
            }}
          >
            <div className="text-white">{getIcon()}</div>
          </div>
          <Sparkles
            className="absolute -bottom-2 -right-4 h-5 w-5 animate-pulse"
            style={{ color: config.particleColor }}
          />
        </div>
        
        {/* Reward text */}
        <div
          className="mt-2 text-2xl font-black"
          style={{
            color: config.glowColor,
            textShadow: `0 0 10px ${config.glowColor}88`,
          }}
        >
          {reward.label}
        </div>
      </div>
    </div>
  );
}
