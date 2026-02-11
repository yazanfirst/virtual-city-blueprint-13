import { useState } from "react";
import { Tag } from "lucide-react";
import { useShopOffers } from "@/hooks/useMerchantOffers";
import { useClaimOffer, useMyRedemptions } from "@/hooks/useRedemptions";
import { useAuth } from "@/hooks/useAuth";
import { useGameStore } from "@/stores/gameStore";
import ShopOfferCard from "@/components/3d/ShopOfferCard";
import RedemptionCodeModal from "@/components/mission/RedemptionCodeModal";
import { toast } from "@/hooks/use-toast";

interface ShopOffersSectionProps {
  shopId: string;
  externalLink?: string | null;
}

export default function ShopOffersSection({ shopId, externalLink }: ShopOffersSectionProps) {
  const { user } = useAuth();
  const { data: offers = [] } = useShopOffers(shopId);
  const { data: redemptions = [] } = useMyRedemptions();
  const { claimOffer, loading: claiming } = useClaimOffer();
  const coins = useGameStore((s) => s.coins);
  const level = useGameStore((s) => s.level);

  const [redemptionModal, setRedemptionModal] = useState<{
    code: string;
    couponCode?: string | null;
    coinsSpent: number;
    expiresAt: string;
  } | null>(null);

  if (!user || offers.length === 0) return null;

  const claimedOfferIds = new Set(redemptions.map((r) => r.offer_id));

  const handleClaim = async (offerId: string) => {
    const result = await claimOffer(offerId);
    if (result.success && result.redemption_code) {
      setRedemptionModal({
        code: result.redemption_code,
        couponCode: result.coupon_code,
        coinsSpent: result.coins_spent ?? 0,
        expiresAt: result.expires_at ?? new Date().toISOString(),
      });
    } else {
      toast({ title: "Claim Failed", description: result.error, variant: "destructive" });
    }
  };

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-sm text-foreground">Offers</h3>
        </div>
        <div className="space-y-2">
          {offers.map((offer) => (
            <ShopOfferCard
              key={offer.id}
              offer={offer}
              playerCoins={coins}
              playerLevel={level}
              alreadyClaimed={claimedOfferIds.has(offer.id)}
              onClaim={handleClaim}
              claiming={claiming}
            />
          ))}
        </div>
      </div>

      <RedemptionCodeModal
        isOpen={!!redemptionModal}
        code={redemptionModal?.code ?? ""}
        couponCode={redemptionModal?.couponCode}
        coinsSpent={redemptionModal?.coinsSpent ?? 0}
        expiresAt={redemptionModal?.expiresAt ?? new Date().toISOString()}
        externalLink={externalLink}
        onClose={() => setRedemptionModal(null)}
      />
    </>
  );
}
