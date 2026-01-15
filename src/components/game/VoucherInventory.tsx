import { useState } from 'react';
import { Gift, Clock, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useGameStore, Voucher } from '@/stores/gameStore';
import { Button } from '@/components/ui/button';

export default function VoucherInventory() {
  const { vouchers, useVoucher } = useGameStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const activeVouchers = vouchers.filter(v => !v.isUsed && v.expiresAt > Date.now());
  const usedVouchers = vouchers.filter(v => v.isUsed);

  const formatTimeLeft = (expiresAt: number) => {
    const diff = expiresAt - Date.now();
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'text-yellow-400 border-yellow-400/50 bg-yellow-400/10';
      case 'rare': return 'text-slate-300 border-slate-300/50 bg-slate-300/10';
      default: return 'text-amber-600 border-amber-600/50 bg-amber-600/10';
    }
  };

  if (vouchers.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        <Gift className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p>No vouchers yet!</p>
        <p className="text-xs mt-1">Find Mystery Boxes to earn discounts</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Active Vouchers */}
      <div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-sm font-medium text-foreground mb-2"
        >
          <span className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-primary" />
            Active Vouchers ({activeVouchers.length})
          </span>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {isExpanded && (
          <div className="space-y-2">
            {activeVouchers.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">
                No active vouchers
              </p>
            ) : (
              activeVouchers.map((voucher) => (
                <VoucherCard key={voucher.id} voucher={voucher} onUse={useVoucher} />
              ))
            )}
          </div>
        )}
      </div>

      {/* Used Vouchers (collapsed summary) */}
      {usedVouchers.length > 0 && (
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Check className="h-3 w-3" />
          {usedVouchers.length} voucher{usedVouchers.length !== 1 ? 's' : ''} used
        </div>
      )}
    </div>
  );
}

function VoucherCard({ voucher, onUse }: { voucher: Voucher; onUse: (id: string) => void }) {
  const isFree = voucher.discountPercent >= 100;
  
  const getRarityLabel = () => {
    switch (voucher.boxType) {
      case 'legendary': return '⭐ Legendary';
      case 'rare': return '💎 Rare';
      default: return '📦 Common';
    }
  };

  const getRarityBg = () => {
    switch (voucher.boxType) {
      case 'legendary': return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30';
      case 'rare': return 'bg-gradient-to-r from-slate-400/20 to-slate-300/20 border-slate-400/30';
      default: return 'bg-gradient-to-r from-amber-700/20 to-amber-600/20 border-amber-700/30';
    }
  };

  const timeLeft = voucher.expiresAt - Date.now();
  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const isExpiringSoon = hours < 2;

  return (
    <div className={`rounded-lg border p-3 ${getRarityBg()}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs opacity-70">{getRarityLabel()}</span>
          </div>
          
          <p className={`font-bold ${isFree ? 'text-green-400' : 'text-foreground'}`}>
            {isFree ? 'FREE ITEM' : `${voucher.discountPercent}% OFF`}
          </p>
          
          {voucher.itemCategory && (
            <p className="text-xs text-muted-foreground">
              on {voucher.itemCategory}
            </p>
          )}
        </div>

        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={() => onUse(voucher.id)}
        >
          Use
        </Button>
      </div>

      {/* Expiration */}
      <div className={`flex items-center gap-1 mt-2 text-xs ${isExpiringSoon ? 'text-destructive' : 'text-muted-foreground'}`}>
        <Clock className="h-3 w-3" />
        <span>
          {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`} left
        </span>
        {isExpiringSoon && <span className="animate-pulse">⚠️</span>}
      </div>
    </div>
  );
}
