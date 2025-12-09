import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Store, AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { useStreetBySlug, useSpotsWithShops } from "@/hooks/useStreets";

type SpotStatus = "active" | "coming-soon" | "for-rent" | "taken";

const MerchantShops = () => {
  const { streetId } = useParams<{ streetId: string }>();
  const navigate = useNavigate();
  const { data: street, isLoading: streetLoading } = useStreetBySlug(streetId || "");
  const { data: spotsWithShops, isLoading: spotsLoading } = useSpotsWithShops(street?.id || "");

  const isLoading = streetLoading || spotsLoading;

  const getSpotStatus = (spot: any): SpotStatus => {
    if (!spot.shop) return "for-rent";
    if (spot.shop.status === "active") return "taken";
    if (spot.shop.status === "pending_review") return "coming-soon";
    return "for-rent";
  };

  if (!isLoading && (!street || !street.is_active)) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-secondary/10 border border-secondary/30 mb-6">
              <AlertCircle className="h-8 w-8 text-secondary" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-3">
              Street not available
            </h1>
            <p className="text-muted-foreground mb-8">
              This street is not yet available for merchants.
            </p>
            <Button variant="cyber" asChild>
              <Link to="/merchant/streets">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Streets
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const availableSpots = spotsWithShops?.filter(s => !s.shop) || [];

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/merchant/streets">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Store className="h-5 w-5 text-primary" />
                <h1 className="font-display text-3xl font-bold text-foreground">
                  {isLoading ? "Loading..." : `Shops in ${street?.name}`}
                </h1>
              </div>
              <p className="text-muted-foreground">
                {availableSpots.length} spots available for rent
              </p>
            </div>
          </div>
          
          {availableSpots.length > 0 && (
            <Button variant="cyber" onClick={() => navigate('/merchant/create-shop')}>
              <Plus className="mr-2 h-4 w-4" />
              Rent a Shop
            </Button>
          )}
        </div>

        {/* Shops Table */}
        {isLoading ? (
          <div className="cyber-card text-center py-12">
            <p className="text-muted-foreground animate-pulse">Loading spots...</p>
          </div>
        ) : (
          <div className="cyber-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-6 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
                      Spot
                    </th>
                    <th className="text-left py-4 px-6 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
                      Shop Name
                    </th>
                    <th className="text-left py-4 px-6 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
                      Status
                    </th>
                    <th className="text-right py-4 px-6 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {spotsWithShops?.map((spot) => {
                    const status = getSpotStatus(spot);
                    return (
                      <tr 
                        key={spot.id} 
                        className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <span className="font-display font-bold text-primary">{spot.spot_label}</span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/30">
                              <Store className="h-5 w-5 text-primary" />
                            </div>
                            <span className="font-medium text-foreground">
                              {spot.shop?.name || "Available"}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <StatusBadge status={status} />
                        </td>
                        <td className="py-4 px-6 text-right">
                          {status === "for-rent" ? (
                            <Button 
                              variant="cyber" 
                              size="sm"
                              onClick={() => navigate('/merchant/create-shop')}
                            >
                              Rent Shop
                            </Button>
                          ) : (
                            <Button variant="disabled" size="sm" disabled>
                              Occupied
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MerchantShops;
