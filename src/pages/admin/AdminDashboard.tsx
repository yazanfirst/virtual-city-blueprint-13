import { useState } from "react";
import { Shield, Store, Clock, CheckCircle, XCircle, Trash2, PauseCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { createNotification } from "@/hooks/useNotifications";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("pending");
  
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
  const suspendedShops = shops?.filter(s => s.status === 'suspended') || [];
  const rejectedShops = shops?.filter(s => s.status === 'rejected') || [];

  const handleApprove = async (shopId: string) => {
    const shop = shops?.find(s => s.id === shopId);
    const { error } = await supabase
      .from('shops')
      .update({ status: 'active' })
      .eq('id', shopId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      // Create notification for merchant
      if (shop?.merchant_id) {
        await createNotification(
          shop.merchant_id,
          "Shop Approved! 🎉",
          `Your shop "${shop.name}" has been approved and is now live in the city!`,
          "success",
          "/merchant/shops"
        );
      }
      toast({ title: "Shop Approved", description: "The shop is now active." });
      refetch();
    }
  };

  const handleReject = async (shopId: string) => {
    const shop = shops?.find(s => s.id === shopId);
    const { error } = await supabase
      .from('shops')
      .update({ status: 'rejected' })
      .eq('id', shopId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      // Create notification for merchant
      if (shop?.merchant_id) {
        await createNotification(
          shop.merchant_id,
          "Shop Rejected",
          `Your shop "${shop.name}" was not approved. Please review our guidelines and try again.`,
          "error",
          "/merchant/shops"
        );
      }
      toast({ title: "Shop Rejected" });
      refetch();
    }
  };

  const handleSuspend = async (shopId: string) => {
    const shop = shops?.find(s => s.id === shopId);
    const { error } = await supabase
      .from('shops')
      .update({ status: 'suspended' })
      .eq('id', shopId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      // Create notification for merchant
      if (shop?.merchant_id) {
        await createNotification(
          shop.merchant_id,
          "Shop Suspended",
          `Your shop "${shop.name}" has been suspended by an administrator.`,
          "warning",
          "/merchant/shops"
        );
      }
      toast({ title: "Shop Suspended", description: "The shop has been suspended." });
      refetch();
    }
  };

  const handleReactivate = async (shopId: string) => {
    const shop = shops?.find(s => s.id === shopId);
    const { error } = await supabase
      .from('shops')
      .update({ status: 'active' })
      .eq('id', shopId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      // Create notification for merchant
      if (shop?.merchant_id) {
        await createNotification(
          shop.merchant_id,
          "Shop Reactivated! 🎉",
          `Your shop "${shop.name}" has been reactivated and is now live again!`,
          "success",
          "/merchant/shops"
        );
      }
      toast({ title: "Shop Reactivated", description: "The shop is now active again." });
      refetch();
    }
  };

  const handleDelete = async (shopId: string) => {
    const { error } = await supabase
      .from('shops')
      .delete()
      .eq('id', shopId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Shop Deleted", description: "The shop has been permanently deleted." });
      refetch();
    }
  };

  const ShopCard = ({ shop, actions }: { shop: any; actions: React.ReactNode }) => (
    <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-muted rounded-lg gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium">{shop.name}</p>
          {shop.logo_url && (
            <img src={shop.logo_url} alt="" className="w-6 h-6 rounded object-contain" />
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {(shop as any).shop_spots?.streets?.name} - Spot {(shop as any).shop_spots?.spot_label}
        </p>
        {shop.category && <p className="text-xs text-muted-foreground mt-1">{shop.category}</p>}
        {shop.external_link && (
          <a href={shop.external_link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
            {shop.external_link}
          </a>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {actions}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
            <PauseCircle className="h-6 w-6 text-orange-500 mb-2" />
            <p className="text-2xl font-bold">{suspendedShops.length}</p>
            <p className="text-muted-foreground text-sm">Suspended</p>
          </div>
          <div className="cyber-card">
            <Store className="h-6 w-6 text-primary mb-2" />
            <p className="text-2xl font-bold">{shops?.length || 0}</p>
            <p className="text-muted-foreground text-sm">Total Shops</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="cyber-card">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="pending">Pending ({pendingShops.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({activeShops.length})</TabsTrigger>
            <TabsTrigger value="suspended">Suspended ({suspendedShops.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejectedShops.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending">
            {isLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : pendingShops.length === 0 ? (
              <p className="text-muted-foreground">No shops pending review.</p>
            ) : (
              <div className="space-y-4">
                {pendingShops.map(shop => (
                  <ShopCard 
                    key={shop.id} 
                    shop={shop}
                    actions={
                      <>
                        <Button size="sm" variant="default" onClick={() => handleApprove(shop.id)}>
                          <CheckCircle className="h-4 w-4 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleReject(shop.id)}>
                          <XCircle className="h-4 w-4 mr-1" /> Reject
                        </Button>
                      </>
                    }
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="active">
            {activeShops.length === 0 ? (
              <p className="text-muted-foreground">No active shops.</p>
            ) : (
              <div className="space-y-4">
                {activeShops.map(shop => (
                  <ShopCard 
                    key={shop.id} 
                    shop={shop}
                    actions={
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleSuspend(shop.id)}>
                          <PauseCircle className="h-4 w-4 mr-1" /> Suspend
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="h-4 w-4 mr-1" /> Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Shop?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{shop.name}". This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(shop.id)} className="bg-destructive text-destructive-foreground">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    }
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="suspended">
            {suspendedShops.length === 0 ? (
              <p className="text-muted-foreground">No suspended shops.</p>
            ) : (
              <div className="space-y-4">
                {suspendedShops.map(shop => (
                  <ShopCard 
                    key={shop.id} 
                    shop={shop}
                    actions={
                      <>
                        <Button size="sm" variant="default" onClick={() => handleReactivate(shop.id)}>
                          <CheckCircle className="h-4 w-4 mr-1" /> Reactivate
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="h-4 w-4 mr-1" /> Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Shop?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{shop.name}". This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(shop.id)} className="bg-destructive text-destructive-foreground">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    }
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="rejected">
            {rejectedShops.length === 0 ? (
              <p className="text-muted-foreground">No rejected shops.</p>
            ) : (
              <div className="space-y-4">
                {rejectedShops.map(shop => (
                  <ShopCard 
                    key={shop.id} 
                    shop={shop}
                    actions={
                      <>
                        <Button size="sm" variant="default" onClick={() => handleApprove(shop.id)}>
                          <CheckCircle className="h-4 w-4 mr-1" /> Approve
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="h-4 w-4 mr-1" /> Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Shop?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{shop.name}". This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(shop.id)} className="bg-destructive text-destructive-foreground">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    }
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
