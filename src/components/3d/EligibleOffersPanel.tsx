import { useMemo, useState } from 'react';
import { Tag, Coins, Lock, Sparkles, ChevronDown, ChevronUp, Store, ExternalLink, Gift } from 'lucide-react';
import { OfferWithShop } from '@/hooks/useAllActiveOffers';
import { useMyRedemptions, useClaimOffer } from '@/hooks/useRedemptions';
import RedemptionCodeModal from '@/components/mission/RedemptionCodeModal';
import { toast } from '@/hooks/use-toast';

interface EligibleOffersPanelProps {
  offers: OfferWithShop[];
  playerCoins: number;
  playerLevel: number;
  loading: boolean;
}

export default function EligibleOffersPanel({
  offers,
  playerCoins,
  playerLevel,
  loading,
}: EligibleOffersPanelProps) {
  const { data: redemptions = [] } = useMyRedemptions();
  const { claimOffer, loading: claiming } = useClaimOffer();
  const [expanded, setExpanded] = useState(true);
  const [redemptionModal, setRedemptionModal] = useState<{
    code: string;
    couponCode?: string | null;
    coinsSpent: number;
    expiresAt: string;
    externalLink?: string | null;
  } | null>(null);

  const claimedOfferIds = useMemo(
    () => new Set(redemptions.map((r) => r.offer_id)),
    [redemptions]
  );

  // Filter to only eligible offers (player meets conditions)
  const eligibleOffers = useMemo(() => {
    return offers.filter((offer) => {
      const meetsLevel = playerLevel >= offer.min_player_level;
      const hasCoins = playerCoins >= offer.coin_price;
      const notClaimed = !claimedOfferIds.has(offer.id);
      return meetsLevel && hasCoins && notClaimed;
    });
  }, [offers, playerCoins, playerLevel, claimedOfferIds]);

  // Group by shop
  const groupedOffers = useMemo(() => {
    const groups = new Map<string, { shopName: string; logoUrl: string | null; offers: OfferWithShop[] }>();
    for (const offer of eligibleOffers) {
      if (!groups.has(offer.shop_id)) {
        groups.set(offer.shop_id, {
          shopName: offer.shop_name,
          logoUrl: offer.shop_logo_url,
          offers: [],
        });
      }
      groups.get(offer.shop_id)!.offers.push(offer);
    }
    return groups;
  }, [eligibleOffers]);

  const handleClaim = async (offer: OfferWithShop) => {
    const result = await claimOffer(offer.id);
    if (result.success && result.redemption_code) {
      setRedemptionModal({
        code: result.redemption_code,
        couponCode: result.coupon_code,
        coinsSpent: result.coins_spent ?? 0,
        expiresAt: result.expires_at ?? new Date().toISOString(),
        externalLink: offer.shop_external_link,
      });
    } else {
      toast({ title: 'Claim Failed', description: result.error, variant: 'destructive' });
    }
  };

  const totalEligible = eligibleOffers.length;

  return (
    <>
      <div className="cyber-card h-full">
        {/* Header */}
        <button
          type="button"
          className="flex items-center justify-between w-full gap-3 mb-4 pb-4 border-b border-border cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 relative">
              <Gift className="h-4 w-4 text-primary" />
              {totalEligible > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                  {totalEligible}
                </span>
              )}
            </div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
              Offers For You
            </h3>
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {/* Content */}
        {expanded && (
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : totalEligible === 0 ? (
              <div className="text-center py-4 space-y-2">
                <Sparkles className="h-8 w-8 mx-auto text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">
                  No eligible offers right now. Keep earning coins and leveling up!
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                {Array.from(groupedOffers.entries()).map(([shopId, group]) => (
                  <div key={shopId} className="space-y-2">
                    {/* Shop header */}
                    <div className="flex items-center gap-2">
                      {group.logoUrl ? (
                        <img
                          src={group.logoUrl}
                          alt={group.shopName}
                          className="h-5 w-5 rounded-md object-cover border border-border/50"
                        />
                      ) : (
                        <Store className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-xs font-semibold text-foreground truncate">
                        {group.shopName}
                      </span>
                    </div>

                    {/* Offers for this shop */}
                    {group.offers.map((offer) => (
                      <OfferRow
                        key={offer.id}
                        offer={offer}
                        claiming={claiming}
                        onClaim={() => handleClaim(offer)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <RedemptionCodeModal
        isOpen={!!redemptionModal}
        code={redemptionModal?.code ?? ''}
        couponCode={redemptionModal?.couponCode}
        coinsSpent={redemptionModal?.coinsSpent ?? 0}
        expiresAt={redemptionModal?.expiresAt ?? new Date().toISOString()}
        externalLink={redemptionModal?.externalLink}
        onClose={() => setRedemptionModal(null)}
      />
    </>
  );
}

/* ─── Single offer row ─── */
function OfferRow({
  offer,
  claiming,
  onClaim,
}: {
  offer: OfferWithShop;
  claiming: boolean;
  onClaim: () => void;
}) {
  const discountLabel =
    offer.discount_type === 'percentage'
      ? `${offer.discount_value}% OFF`
      : `$${Number(offer.discount_value).toFixed(0)} OFF`;

  return (
    <div className="rounded-lg border border-border/40 bg-card/60 backdrop-blur-sm p-2.5 space-y-2 transition-all hover:border-primary/30 hover:shadow-[0_0_12px_rgba(45,212,191,0.06)]">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-bold text-foreground truncate">{offer.title}</h4>
          {offer.description && (
            <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
              {offer.description}
            </p>
          )}
        </div>
        <span className="shrink-0 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-[10px] font-bold text-primary">
          {discountLabel}
        </span>
      </div>

      {/* Claim button */}
      <button
        type="button"
        disabled={claiming}
        onPointerDown={(e) => {
          e.stopPropagation();
          if (!claiming) onClaim();
        }}
        className="w-full py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all touch-manipulation active:scale-[0.98] bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-1.5"
      >
        <Coins className="h-3 w-3" />
        {claiming ? 'Claiming...' : `Claim · ${offer.coin_price} coins`}
      </button>
    </div>
  );
}
