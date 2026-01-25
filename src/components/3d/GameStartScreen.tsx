import { useEffect, useState } from "react";
import { Play, Gamepad2, Target, Store, RotateCcw } from "lucide-react";
import { useDeviceType } from "@/hooks/useDeviceType";

interface GameStartScreenProps {
  streetName: string;
  category: string;
  onStartGame: () => void;
}

const GameStartScreen = ({ streetName, category, onStartGame }: GameStartScreenProps) => {
  const deviceType = useDeviceType();
  const [isLandscape, setIsLandscape] = useState(true);

  useEffect(() => {
    if (deviceType !== "mobile") return;
    const mediaQuery = window.matchMedia("(orientation: landscape)");
    const updateOrientation = () => setIsLandscape(mediaQuery.matches);
    updateOrientation();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updateOrientation);
      return () => mediaQuery.removeEventListener("change", updateOrientation);
    }

    mediaQuery.addListener(updateOrientation);
    return () => mediaQuery.removeListener(updateOrientation);
  }, [deviceType]);

  return (
    <div className="h-full w-full bg-gradient-to-br from-background via-background/95 to-primary/10 flex items-center justify-center px-4">
      <div className="text-center space-y-5 sm:space-y-8 p-4 sm:p-8 max-w-lg w-full">
        {deviceType === "mobile" && !isLandscape && (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-primary">
            <RotateCcw className="h-3.5 w-3.5" />
            Rotate your phone to landscape for the best experience.
          </div>
        )}
        {/* Game Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <div className="relative flex h-16 w-16 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-primary/10 border-2 border-primary">
              <Gamepad2 className="h-8 w-8 sm:h-12 sm:w-12 text-primary" />
            </div>
          </div>
        </div>

        {/* Street Name */}
        <div className="space-y-1 sm:space-y-2">
          <h1 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold text-foreground">
            {streetName}
          </h1>
          <p className="text-primary text-xs sm:text-sm uppercase tracking-widest font-medium">
            {category}
          </p>
        </div>

        {/* Features */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 text-muted-foreground text-xs sm:text-sm">
          <div className="flex items-center gap-2 bg-background/50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-border/50">
            <Store className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            <span>Explore Shops</span>
          </div>
          <div className="flex items-center gap-2 bg-background/50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-border/50">
            <Target className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            <span>Complete Missions</span>
          </div>
        </div>

        {/* Start Button */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.stopPropagation();
            onStartGame();
          }}
          className="px-10 sm:px-12 py-5 sm:py-6 text-base sm:text-lg font-bold group bg-primary text-primary-foreground rounded-lg shadow-lg hover:bg-primary/90 touch-manipulation select-none active:scale-[0.98] transition-all inline-flex items-center justify-center"
          data-control-ignore="true"
        >
          <Play className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 group-hover:scale-110 transition-transform" />
          Start Game
        </button>

        <div className="text-muted-foreground text-[10px] sm:text-xs space-y-0.5 sm:space-y-1">
          <p>Use <span className="text-foreground font-medium">WASD</span> or <span className="text-foreground font-medium">Arrow Keys</span> to move</p>
          <p>Hold <span className="text-foreground font-medium">Left Click</span> to rotate camera</p>
          <p>Walk to a <span className="text-foreground font-medium">shop</span> and <span className="text-foreground font-medium">click</span> to enter and explore</p>
          <p>Press <span className="text-foreground font-medium">Space</span> to jump</p>
        </div>
      </div>
    </div>
  );
};

export default GameStartScreen;
