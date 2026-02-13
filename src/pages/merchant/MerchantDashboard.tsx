import { useState } from "react";
import { Link } from "react-router-dom";
import { LayoutDashboard, Store, Plus, Clock, CheckCircle, XCircle, Trash2, PauseCircle, PlayCircle, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMerchantShops, type ShopWithLocation } from "@/hooks/useMerchantShops";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const MerchantDashboard = () => {
  const { user } = useAuth();
  const { data: shops, isLoading, refetch } = useMerchantShops();
  const queryClient = useQueryClient();
  const [deleteShopId, setDeleteShopId] = useState<string | null>(null);

  const activeShops = shops?.filter(s => s.status === 'active') || [];
  const pendingShops = shops?.filter(s => s.status === 'pending_review') || [];
  const suspendedShops = shops?.filter(s => s.status === 'suspended') || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending_review': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'suspended': return <PauseCircle className="h-4 w-4 text-orange-500" />;
      default: return null;
    }
  };

  const handleSuspend = async (shopId: string) => {
    try {
      const { error } = await supabase
        .from('shops')
        .update({ status: 'suspended' })
        .eq('id', shopId);

      if (error) throw error;
      
      toast({ title: "Shop Suspended", description: "Your shop is now hidden from players." });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['active-shops'] });
    } catch (err) {
      console.error('Error suspending shop:', err);
      toast({ title: "Error", description: "Failed to suspend shop.", variant: "destructive" });
    }
  };

  const handleReactivate = async (shopId: string) => {
    try {
      const { error } = await supabase
        .from('shops')
        .update({ status: 'active' })
        .eq('id', shopId);

      if (error) throw error;
      
      toast({ title: "Shop Reactivated", description: "Your shop is now visible to players." });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['active-shops'] });
    } catch (err) {
      console.error('Error reactivating shop:', err);
      toast({ title: "Error", description: "Failed to reactivate shop.", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteShopId) return;
    
    try {
      const { error } = await supabase
        .from('shops')
        .delete()
        .eq('id', deleteShopId);

      if (error) throw error;
      
      toast({ title: "Shop Deleted", description: "Your shop has been permanently removed." });
      setDeleteShopId(null);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['active-shops'] });
      queryClient.invalidateQueries({ queryKey: ['spots-with-shops'] });
    } catch (err) {
      console.error('Error deleting shop:', err);
      toast({ title: "Error", description: "Failed to delete shop.", variant: "destructive" });
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
          <div className="cyber-card">
            <PauseCircle className="h-6 w-6 text-orange-500 mb-2" />
            <p className="text-2xl font-bold">{suspendedShops.length}</p>
            <p className="text-muted-foreground text-sm">Suspended</p>
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
              {shops.map((shop: ShopWithLocation) => (
                <div key={shop.id} className="flex items-center justify-between p-4 bg-muted rounded-lg gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center shrink-0">
                      <Store className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{shop.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {shop.shop_spots?.streets?.name} - Spot {shop.shop_spots?.spot_label}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    {getStatusIcon(shop.status || '')}
                    <span className="text-sm capitalize hidden sm:inline">{shop.status?.replace('_', ' ')}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Edit button for all shops except pending */}
                    {shop.status !== 'pending_review' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        asChild
                        className="text-primary border-primary/50 hover:bg-primary/10"
                      >
                        <Link to={`/merchant/edit-shop/${shop.id}`}>
                          <Edit className="h-4 w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Edit</span>
                        </Link>
                      </Button>
                    )}
                    
                    {/* Suspend/Reactivate button for active/suspended shops */}
                    {shop.status === 'active' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSuspend(shop.id)}
                        className="text-orange-500 border-orange-500/50 hover:bg-orange-500/10"
                      >
                        <PauseCircle className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Suspend</span>
                      </Button>
                    )}
                    {shop.status === 'suspended' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleReactivate(shop.id)}
                        className="text-green-500 border-green-500/50 hover:bg-green-500/10"
                      >
                        <PlayCircle className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Reactivate</span>
                      </Button>
                    )}
                    
                    {/* Delete button */}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setDeleteShopId(shop.id)}
                      className="text-destructive border-destructive/50 hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 sm:mr-1" />
                      <span className="hidden sm:inline">Delete</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteShopId} onOpenChange={(open) => !open && setDeleteShopId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shop?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Your shop will be permanently removed and the spot will become available for rent again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MerchantDashboard;
