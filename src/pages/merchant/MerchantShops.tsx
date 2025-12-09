import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Store, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { getStreetById, getShopsForStreet } from "@/lib/streets";

const MerchantShops = () => {
  const { streetId } = useParams<{ streetId: string }>();
  const street = getStreetById(streetId || "");
  const shops = getShopsForStreet(streetId || "");

  if (!street || !street.isActive) {
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

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/merchant/streets">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Store className="h-5 w-5 text-primary" />
              <h1 className="font-display text-3xl font-bold text-foreground">
                Shops in {street.name}
              </h1>
            </div>
            <p className="text-muted-foreground">
              {shops.filter(s => s.status === "for-rent").length} shops available for rent
            </p>
          </div>
        </div>

        {/* Shops Table */}
        <div className="cyber-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
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
                {shops.map((shop) => (
                  <tr 
                    key={shop.id} 
                    className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/30">
                          <Store className="h-5 w-5 text-primary" />
                        </div>
                        <span className="font-medium text-foreground">{shop.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={shop.status} />
                    </td>
                    <td className="py-4 px-6 text-right">
                      {shop.status === "for-rent" ? (
                        <Button variant="cyber" size="sm">
                          Rent Shop
                        </Button>
                      ) : (
                        <Button variant="disabled" size="sm" disabled>
                          Occupied
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantShops;
