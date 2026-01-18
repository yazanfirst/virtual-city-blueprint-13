import { ShopBranding } from "@/hooks/use3DShops";
import { DoorOpen } from "lucide-react";

interface ShopProximityIndicatorProps {
  nearbyShop: ShopBranding | null;
}

const ShopProximityIndicator = ({ nearbyShop }: ShopProximityIndicatorProps) => {
  if (!nearbyShop || !nearbyShop.hasShop) return null;

  return (
    <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none animate-pulse">
      <div className="bg-background/90 backdrop-blur-md border-2 border-primary rounded-xl px-6 py-3 shadow-lg flex items-center gap-3">
        <DoorOpen className="h-6 w-6 text-primary" />
        <div className="text-center">
          <p className="text-foreground font-bold text-sm">{nearbyShop.shopName}</p>
          <p className="text-primary text-xs font-medium">Click to Enter Shop</p>
        </div>
      </div>
    </div>
  );
};

export default ShopProximityIndicator;
