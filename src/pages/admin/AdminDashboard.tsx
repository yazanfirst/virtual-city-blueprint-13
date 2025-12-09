import { Link } from "react-router-dom";
import { Shield, Store, Clock, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const { data: shops, isLoading, refetch } = useQuery({
    queryKey: ['admin-all-shops'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shops')
        .select(`
          *,
          shop_spots (
            spot_label,
            streets (name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const pendingShops = shops?.filter(s => s.status === 'pending_review') || [];
  const activeShops = shops?.filter(s => s.status === 'active') || [];

  const handleApprove = async (shopId: string) => {
    const { error } = await supabase
      .from('shops')
      .update({ status: 'active' })
      .eq('id', shopId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Shop Approved", description: "The shop is now active." });
      refetch();
    }
  };

  const handleReject = async (shopId: string) => {
    const { error } = await supabase
      .from('shops')
      .update({ status: 'rejected' })
      .eq('id', shopId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Shop Rejected" });
      refetch();
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="cyber-card">
            <Clock className="h-6 w-6 text-yellow-500 mb-2" />
            <p className="text-2xl font-bold">{pendingShops.length}</p>
            <p className="text-muted-foreground text-sm">Pending Review</p>
          </div>
          <div className="cyber-card">
            <CheckCircle className="h-6 w-6 text-green-500 mb-2" />
            <p className="text-2xl font-bold">{activeShops.length}</p>
            <p className="text-muted-foreground text-sm">Active Shops</p>
          </div>
          <div className="cyber-card">
            <Store className="h-6 w-6 text-primary mb-2" />
            <p className="text-2xl font-bold">{shops?.length || 0}</p>
            <p className="text-muted-foreground text-sm">Total Shops</p>
          </div>
        </div>

        <div className="cyber-card">
          <h2 className="font-display text-xl font-bold mb-4">Pending Review</h2>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : pendingShops.length === 0 ? (
            <p className="text-muted-foreground">No shops pending review.</p>
          ) : (
            <div className="space-y-4">
              {pendingShops.map(shop => (
                <div key={shop.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{shop.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(shop as any).shop_spots?.streets?.name} - Spot {(shop as any).shop_spots?.spot_label}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="default" onClick={() => handleApprove(shop.id)}>
                      <CheckCircle className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleReject(shop.id)}>
                      <XCircle className="h-4 w-4 mr-1" /> Reject
                    </Button>
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

export default AdminDashboard;
