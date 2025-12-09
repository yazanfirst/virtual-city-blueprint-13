import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, ExternalLink, Store, MapPin, Palette, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShopBranding } from "@/hooks/use3DShops";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ShopDetailModalProps {
  shop: ShopBranding | null;
  onClose: () => void;
}

const templateLabels: Record<string, string> = {
  modern_neon: "Modern Neon",
  minimal_white: "Minimal White",
  classic_brick: "Classic Brick",
  cyber_tech: "Cyber Tech",
  luxury_gold: "Luxury Gold",
  urban_industrial: "Urban Industrial",
  retro_vintage: "Retro Vintage",
  nature_organic: "Nature Organic",
};

const ShopDetailModal = ({ shop, onClose }: ShopDetailModalProps) => {
  const navigate = useNavigate();
  const { user, isMerchant } = useAuth();
  const [upgrading, setUpgrading] = useState(false);

  if (!shop) return null;

  const handleBecomeMerchant = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please sign in to become a merchant.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setUpgrading(true);
    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: user.id, role: "merchant" });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already a Merchant",
            description: "You already have merchant access!",
          });
          navigate("/merchant/create-shop");
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Welcome, Merchant!",
          description: "You can now rent shop spots.",
        });
        // Force page reload to refresh auth context
        window.location.href = "/merchant/create-shop";
      }
    } catch (err) {
      console.error("Error upgrading to merchant:", err);
      toast({
        title: "Error",
        description: "Failed to upgrade account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpgrading(false);
    }
  };

  const handleRentSpot = () => {
    navigate("/merchant/create-shop");
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-md bg-background border border-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          borderColor: shop.hasShop ? shop.primaryColor : undefined,
          boxShadow: shop.hasShop 
            ? `0 0 40px ${shop.primaryColor}30, 0 25px 50px -12px rgba(0, 0, 0, 0.5)` 
            : undefined,
        }}
      >
        {/* Header with gradient */}
        <div 
          className="relative h-24 flex items-center justify-center"
          style={{
            background: shop.hasShop 
              ? `linear-gradient(135deg, ${shop.primaryColor}, ${shop.accentColor})`
              : 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))',
          }}
        >
          {/* Logo or Icon */}
          {shop.hasShop && shop.logoUrl ? (
            <img 
              src={shop.logoUrl} 
              alt={shop.shopName}
              className="h-16 w-16 object-contain rounded-xl bg-background/20 p-2 backdrop-blur-sm"
            />
          ) : (
            <div className="h-16 w-16 rounded-xl bg-background/20 backdrop-blur-sm flex items-center justify-center">
              {shop.hasShop ? (
                <Store className="h-8 w-8 text-white" />
              ) : (
                <MapPin className="h-8 w-8 text-white" />
              )}
            </div>
          )}
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-background/40 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {shop.hasShop ? (
            <>
              {/* Shop Name */}
              <h2 className="text-2xl font-display font-bold text-foreground text-center mb-2">
                {shop.shopName}
              </h2>
              
              {/* Category */}
              {shop.category && (
                <p className="text-center text-muted-foreground mb-4">
                  {shop.category}
                </p>
              )}
              
              {/* Details */}
              <div className="space-y-3 mb-6">
                {/* Template Badge */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Style
                  </span>
                  <span 
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{ 
                      backgroundColor: `${shop.primaryColor}20`,
                      color: shop.primaryColor,
                    }}
                  >
                    {templateLabels[shop.facadeTemplate] || shop.facadeTemplate}
                  </span>
                </div>
                
                {/* Color Preview */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Brand Colors</span>
                  <div className="flex gap-2">
                    <div 
                      className="h-6 w-6 rounded-full border-2 border-background shadow-sm"
                      style={{ backgroundColor: shop.primaryColor }}
                      title="Primary Color"
                    />
                    <div 
                      className="h-6 w-6 rounded-full border-2 border-background shadow-sm"
                      style={{ backgroundColor: shop.accentColor }}
                      title="Accent Color"
                    />
                  </div>
                </div>
                
                {/* Spot Label */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </span>
                  <span className="text-foreground">{shop.spotLabel}</span>
                </div>
              </div>
              
              {/* Visit Store Button */}
              {shop.externalLink && (
                <Button 
                  className="w-full"
                  style={{
                    backgroundColor: shop.primaryColor,
                    color: '#FFFFFF',
                  }}
                  asChild
                >
                  <a 
                    href={shop.externalLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Visit Store
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              )}
            </>
          ) : (
            <>
              {/* Empty Spot */}
              <h2 className="text-2xl font-display font-bold text-foreground text-center mb-2">
                Spot Available!
              </h2>
              
              <p className="text-center text-muted-foreground mb-2">
                Location: <span className="text-foreground font-medium">{shop.spotLabel}</span>
              </p>
              
              <p className="text-center text-muted-foreground text-sm mb-6">
                This prime spot is waiting for your brand. Set up your shop and reach customers in the virtual city!
              </p>
              
              {/* CTA Buttons */}
              <div className="space-y-3">
                {isMerchant ? (
                  <Button className="w-full" onClick={handleRentSpot}>
                    <Store className="h-4 w-4 mr-2" />
                    Rent This Spot
                  </Button>
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={handleBecomeMerchant}
                    disabled={upgrading}
                  >
                    <Store className="h-4 w-4 mr-2" />
                    {upgrading ? "Upgrading..." : "Become a Merchant"}
                  </Button>
                )}
                
                <Button variant="outline" className="w-full" onClick={onClose}>
                  Continue Exploring
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopDetailModal;
