import { Coins, Lock, CheckCircle, Tag, Percent } from 'lucide-react';
import { MerchantOffer } from '@/hooks/useMerchantOffers';

interface ShopOfferCardProps {
  offer: MerchantOffer;
  playerCoins: number;
  playerLevel: number;
  alreadyClaimed: boolean;
  onClaim: (offerId: string) => void;
  claiming: boolean;
}

export default function ShopOfferCard({
  offer,
  playerCoins,
  playerLevel,
  alreadyClaimed,
  onClaim,
  claiming,
}: ShopOfferCardProps) {
  const hasEnoughCoins = playerCoins >= offer.coin_price;
  const meetsLevel = playerLevel >= offer.min_player_level;
  const canClaim = hasEnoughCoins && meetsLevel && !alreadyClaimed && !claiming;

  const discountLabel =
    offer.discount_type === 'percentage'
      ? `${offer.discount_value}% OFF`
      : `$${Number(offer.discount_value).toFixed(0)} OFF`;

  return (
    <div className="rounded-lg border border-border/60 bg-card/80 p-3 space-y-2">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="font-bold text-sm text-foreground truncate">{offer.title}</h4>
          {offer.description && (
            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{offer.description}</p>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 border border-primary/30">
          {offer.discount_type === 'percentage' ? (
            <Percent className="h-3 w-3 text-primary" />
          ) : (
            <Tag className="h-3 w-3 text-primary" />
          )}
          <span className="text-xs font-bold text-primary">{discountLabel}</span>
        </div>
      </div>

      {/* Info row */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Coins className="h-3 w-3 text-yellow-500" />
          {offer.coin_price} coins
        </span>
        {offer.min_player_level > 1 && (
          <span className="flex items-center gap-1">
            <Lock className="h-3 w-3" />
            Level {offer.min_player_level}+
          </span>
        )}
        {offer.min_order_value && (
          <span>Min order: ${Number(offer.min_order_value).toFixed(0)}</span>
        )}
      </div>

      {/* Action */}
      {alreadyClaimed ? (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground py-1">
          <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
          Already Claimed
        </div>
      ) : (
        <button
          type="button"
          disabled={!canClaim}
          onPointerDown={(e) => {
            e.stopPropagation();
            if (canClaim) onClaim(offer.id);
          }}
          className={`w-full py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all touch-manipulation active:scale-[0.98] ${
            canClaim
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          {!hasEnoughCoins
            ? `Need ${offer.coin_price - playerCoins} more coins`
            : !meetsLevel
              ? `Requires Level ${offer.min_player_level}`
              : claiming
                ? 'Claiming...'
                : `Claim for ${offer.coin_price} coins`}
        </button>
      )}
    </div>
  );
}
