import { useEffect } from 'react';
import { Gift, Sparkles, X } from 'lucide-react';
import { useGameStore, BoxRarity } from '@/stores/gameStore';

const RARITY_CONFIG = {
  common: {
    title: 'Common Box!',
    bgClass: 'from-amber-900/90 to-amber-700/90',
    borderClass: 'border-amber-500',
    icon: '📦',
  },
  rare: {
    title: 'Rare Box!',
    bgClass: 'from-slate-600/90 to-slate-400/90',
    borderClass: 'border-slate-300',
    icon: '💎',
  },
  legendary: {
    title: 'LEGENDARY BOX!!!',
    bgClass: 'from-yellow-600/90 to-amber-400/90',
    borderClass: 'border-yellow-400',
    icon: '🌟',
  },
  decoy: {
    title: '',
    bgClass: '',
    borderClass: '',
    icon: '',
  },
};

export default function VoucherPopup() {
  const { showVoucherPopup, closeVoucherPopup } = useGameStore();

  useEffect(() => {
    if (showVoucherPopup) {
      const timer = setTimeout(() => {
        closeVoucherPopup();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showVoucherPopup, closeVoucherPopup]);

  if (!showVoucherPopup) return null;

  const config = RARITY_CONFIG[showVoucherPopup.boxType];
  const isFree = showVoucherPopup.discountPercent >= 100;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center pointer-events-auto"
      style={{ zIndex: 250 }}
      onClick={closeVoucherPopup}
    >
      <div 
        className={`relative bg-gradient-to-br ${config.bgClass} backdrop-blur-md border-2 ${config.borderClass} rounded-2xl p-6 max-w-sm w-[85vw] shadow-2xl animate-scale-in text-center`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button 
          onClick={closeVoucherPopup}
          className="absolute top-2 right-2 text-white/60 hover:text-white p-1"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Sparkle effects for legendary */}
        {showVoucherPopup.boxType === 'legendary' && (
          <div className="absolute inset-0 overflow-hidden rounded-2xl">
            {[...Array(12)].map((_, i) => (
              <Sparkles
                key={i}
                className="absolute text-yellow-300 animate-ping"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random()}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Icon */}
        <div className="text-6xl mb-2 animate-bounce">
          {config.icon}
        </div>

        {/* Title */}
        <h3 className={`font-display text-xl font-bold text-white mb-2 ${
          showVoucherPopup.boxType === 'legendary' ? 'animate-pulse text-2xl' : ''
        }`}>
          {config.title}
        </h3>

        {/* Reward */}
        <div className="bg-black/30 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Gift className="h-5 w-5 text-white" />
            <span className="text-white/80 text-sm">You got:</span>
          </div>
          <p className={`font-display text-3xl font-bold ${
            isFree ? 'text-green-400' : 'text-white'
          }`}>
            {isFree ? 'FREE ITEM!' : `${showVoucherPopup.discountPercent}% OFF`}
          </p>
          {showVoucherPopup.itemCategory && (
            <p className="text-white/60 text-sm mt-1">
              on {showVoucherPopup.itemCategory}
            </p>
          )}
        </div>

        {/* Expiration */}
        <p className="text-white/50 text-xs">
          Valid for 24 hours • Check your inventory
        </p>

        {/* Tap to dismiss hint */}
        <p className="text-white/30 text-xs mt-3 animate-pulse">
          Tap anywhere to dismiss
        </p>
      </div>
    </div>
  );
}
