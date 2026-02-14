import { useState } from 'react';
import { Copy, CheckCircle, Clock, XCircle, ExternalLink, Ticket } from 'lucide-react';
import { format } from 'date-fns';
import { useMyRedemptions } from '@/hooks/useRedemptions';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function MyCoupons() {
  const { user } = useAuth();
  const { data: redemptions = [], isLoading } = useMyRedemptions();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch offer details (title, coupon_code, shop_id) for all redeemed offers
  const offerIds = [...new Set(redemptions.map((r) => r.offer_id))];
  const { data: offers = [] } = useQuery({
    queryKey: ['redeemed-offer-details', offerIds],
    queryFn: async () => {
      if (offerIds.length === 0) return [];
      const { data, error } = await supabase
        .from('merchant_offers')
        .select('id, title, coupon_code, shop_id')
        .in('id', offerIds);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user && offerIds.length > 0,
  });

  // Fetch shop names
  const shopIds = [...new Set(offers.map((o) => o.shop_id))];
  const { data: shops = [] } = useQuery({
    queryKey: ['redeemed-shop-names', shopIds],
    queryFn: async () => {
      if (shopIds.length === 0) return [];
      const { data, error } = await supabase
        .rpc('get_active_or_suspended_public_shops_for_spots', { _spot_ids: [] });
      // Fallback: query shops directly via offer relationship isn't possible without merchant access
      // Instead, just return empty — we'll show offer title only
      return [];
    },
    enabled: false, // disabled — we show offer title instead
  });

  const offerMap = new Map(offers.map((o) => [o.id, o]));

  const handleCopy = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const el = document.createElement('textarea');
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatus = (r: typeof redemptions[0]) => {
    const now = new Date();
    const expires = new Date(r.expires_at);
    if (r.status === 'used') return 'used';
    if (expires < now) return 'expired';
    return 'active';
  };

  if (isLoading) {
    return (
      <div className="cyber-card">
        <h3 className="font-display text-lg font-bold mb-4">My Coupons</h3>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (redemptions.length === 0) {
    return (
      <div className="cyber-card">
        <h3 className="font-display text-lg font-bold mb-4">My Coupons</h3>
        <div className="text-center py-8 space-y-2">
          <Ticket className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <p className="text-sm text-muted-foreground">No coupons claimed yet.</p>
          <p className="text-xs text-muted-foreground">Visit shops in the city and claim offers to see them here!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cyber-card">
      <h3 className="font-display text-lg font-bold mb-4">My Coupons</h3>
      <div className="space-y-3">
        {redemptions.map((r) => {
          const offer = offerMap.get(r.offer_id);
          const status = getStatus(r);
          const displayCode = offer?.coupon_code || r.redemption_code;

          return (
            <div
              key={r.id}
              className={`rounded-lg border p-3 sm:p-4 space-y-2 ${
                status === 'active'
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-border/40 bg-muted/30 opacity-70'
              }`}
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-foreground truncate">
                    {offer?.title ?? 'Offer'}
                  </h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Claimed {format(new Date(r.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <StatusBadge status={status} />
              </div>

              {/* Code */}
              <div className="flex items-center gap-2 bg-background/80 rounded-md px-3 py-2">
                <span className="font-mono text-sm sm:text-base font-bold text-foreground tracking-wider flex-1 truncate">
                  {displayCode}
                </span>
                {status === 'active' && (
                  <button
                    type="button"
                    onClick={() => handleCopy(displayCode, r.id)}
                    className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded bg-primary text-primary-foreground text-xs font-bold transition-all active:scale-95"
                  >
                    {copiedId === r.id ? (
                      <>
                        <CheckCircle className="h-3 w-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>
                  {status === 'expired'
                    ? `Expired ${format(new Date(r.expires_at), 'MMM d, yyyy')}`
                    : `Expires ${format(new Date(r.expires_at), 'MMM d, yyyy')}`}
                </span>
                <span>{r.coins_spent} coins spent</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: 'active' | 'expired' | 'used' }) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 text-[10px] font-bold">
        <CheckCircle className="h-3 w-3" /> Active
      </span>
    );
  }
  if (status === 'expired') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-500 text-[10px] font-bold">
        <Clock className="h-3 w-3" /> Expired
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold">
      <XCircle className="h-3 w-3" /> Used
    </span>
  );
}
