import { Link } from "react-router-dom";
import { LayoutDashboard, MapPin, Store, Plus, Clock, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMerchantShops } from "@/hooks/useMerchantShops";
import { useAuth } from "@/hooks/useAuth";

const MerchantDashboard = () => {
  const { user } = useAuth();
  const { data: shops, isLoading } = useMerchantShops();

  const activeShops = shops?.filter(s => s.status === 'active') || [];
  const pendingShops = shops?.filter(s => s.status === 'pending_review') || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending_review': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <LayoutDashboard className="h-6 w-6 text-primary" />
              <h1 className="font-display text-3xl font-bold text-foreground">Merchant Dashboard</h1>
            </div>
            <p className="text-muted-foreground">Manage your virtual shops</p>
          </div>
          <Button variant="cyber" asChild>
            <Link to="/merchant/create-shop">
              <Plus className="mr-2 h-4 w-4" /> Create Shop
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="cyber-card">
            <Store className="h-6 w-6 text-primary mb-2" />
            <p className="text-2xl font-bold">{shops?.length || 0}</p>
            <p className="text-muted-foreground text-sm">Total Shops</p>
          </div>
          <div className="cyber-card">
            <CheckCircle className="h-6 w-6 text-green-500 mb-2" />
            <p className="text-2xl font-bold">{activeShops.length}</p>
            <p className="text-muted-foreground text-sm">Active</p>
          </div>
          <div className="cyber-card">
            <Clock className="h-6 w-6 text-yellow-500 mb-2" />
            <p className="text-2xl font-bold">{pendingShops.length}</p>
            <p className="text-muted-foreground text-sm">Pending Review</p>
          </div>
        </div>

        <div className="cyber-card">
          <h2 className="font-display text-lg font-bold mb-4">Your Shops</h2>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : !shops?.length ? (
            <div className="text-center py-8">
              <Store className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">You haven't created any shops yet.</p>
              <Button variant="cyber" asChild>
                <Link to="/merchant/create-shop">Create Your First Shop</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {shops.map(shop => (
                <div key={shop.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center">
                      <Store className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{shop.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(shop as any).shop_spots?.streets?.name} - Spot {(shop as any).shop_spots?.spot_label}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(shop.status || '')}
                    <span className="text-sm capitalize">{shop.status?.replace('_', ' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MerchantDashboard;
