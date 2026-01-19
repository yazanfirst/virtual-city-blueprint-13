import { ShopBranding } from "@/hooks/use3DShops";
import { DoorOpen } from "lucide-react";

interface ShopProximityIndicatorProps {
  nearbyShop: ShopBranding | null;
  onPress?: () => void;
}

const ShopProximityIndicator = ({ nearbyShop, onPress }: ShopProximityIndicatorProps) => {
  if (!nearbyShop || !nearbyShop.hasShop) return null;

  return (
    <div className="absolute bottom-24 sm:bottom-20 left-1/2 transform -translate-x-1/2 z-50 px-4 w-full max-w-xs sm:max-w-sm">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPress?.();
        }}
        className="w-full touch-manipulation select-none active:scale-[0.99]"
        aria-label={`Enter ${nearbyShop.shopName}`}
      >
        <div className="animate-pulse pointer-events-auto bg-background/90 backdrop-blur-md border-2 border-primary rounded-xl px-4 sm:px-6 py-3 sm:py-3 shadow-lg flex items-center gap-2 sm:gap-3">
          <DoorOpen className="h-6 w-6 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
          <div className="text-center flex-1 min-w-0">
            <p className="text-foreground font-bold text-sm sm:text-sm truncate">{nearbyShop.shopName}</p>
            <p className="text-primary text-xs sm:text-xs font-medium">Tap to Enter Shop</p>
          </div>
        </div>
      </button>
    </div>
  );
};

export default ShopProximityIndicator;
