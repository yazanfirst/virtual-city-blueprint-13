import { useEffect, useState } from "react";
import { Play, Gamepad2, Target, Store, RotateCcw } from "lucide-react";
import { useDeviceType } from "@/hooks/useDeviceType";
import { usePlayerStore, CharacterType } from "@/stores/playerStore";

interface GameStartScreenProps {
  streetName: string;
  category: string;
  onStartGame: () => void;
}

const GameStartScreen = ({ streetName, category, onStartGame }: GameStartScreenProps) => {
  const deviceType = useDeviceType();
  const [isLandscape, setIsLandscape] = useState(true);
  const { characterType, setCharacterType } = usePlayerStore();

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

  const characters: { type: CharacterType; label: string; description: string }[] = [
    { type: 'hooded', label: 'Shadow', description: 'Hooded figure with glowing eyes' },
    { type: 'boxy', label: 'Blocky', description: 'Classic box-style character' },
  ];

  return (
    <div className="h-full w-full bg-gradient-to-br from-background via-background/95 to-primary/10 flex items-center justify-center px-4">
      <div className="text-center space-y-4 sm:space-y-6 p-4 sm:p-8 max-w-lg w-full">
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

        {/* Character Selection */}
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs sm:text-sm font-medium uppercase tracking-wider">Choose Character</p>
          <div className="flex justify-center gap-3">
            {characters.map((char) => (
              <button
                key={char.type}
                type="button"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setCharacterType(char.type);
                }}
                data-control-ignore="true"
                className={`flex flex-col items-center gap-1.5 px-4 py-3 sm:px-6 sm:py-4 rounded-xl border-2 transition-all touch-manipulation active:scale-[0.97] ${
                  characterType === char.type
                    ? 'border-primary bg-primary/15 shadow-lg shadow-primary/20'
                    : 'border-border/50 bg-background/50 hover:border-border'
                }`}
              >
                {/* Character preview icon */}
                <div className={`w-10 h-14 sm:w-12 sm:h-16 rounded-lg flex items-center justify-center ${
                  characterType === char.type ? 'bg-primary/20' : 'bg-muted/50'
                }`}>
                  {char.type === 'hooded' ? (
                    <HoodedIcon selected={characterType === char.type} />
                  ) : (
                    <BoxyIcon selected={characterType === char.type} />
                  )}
                </div>
                <span className={`text-xs sm:text-sm font-bold ${
                  characterType === char.type ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {char.label}
                </span>
                <span className="text-[9px] sm:text-[10px] text-muted-foreground leading-tight max-w-[80px]">
                  {char.description}
                </span>
              </button>
            ))}
          </div>
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

        {deviceType === "mobile" ? (
          <div className="text-muted-foreground text-[10px] sm:text-xs space-y-0.5 sm:space-y-1">
            <p>Use the <span className="text-foreground font-medium">joystick</span> to move</p>
            <p><span className="text-foreground font-medium">Drag</span> the screen to look around</p>
            <p>Walk to a <span className="text-foreground font-medium">shop</span> and <span className="text-foreground font-medium">tap</span> to enter</p>
            <p>Tap <span className="text-foreground font-medium">Jump</span> to jump</p>
          </div>
        ) : (
          <div className="text-muted-foreground text-[10px] sm:text-xs space-y-0.5 sm:space-y-1">
            <p>Use <span className="text-foreground font-medium">WASD</span> or <span className="text-foreground font-medium">Arrow Keys</span> to move</p>
            <p>Hold <span className="text-foreground font-medium">Left Click</span> to rotate camera</p>
            <p>Walk to a <span className="text-foreground font-medium">shop</span> and <span className="text-foreground font-medium">click</span> to enter and explore</p>
            <p>Press <span className="text-foreground font-medium">Space</span> to jump</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Simple SVG icons for character preview
function HoodedIcon({ selected }: { selected: boolean }) {
  const color = selected ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))';
  return (
    <svg width="28" height="40" viewBox="0 0 28 40" fill="none">
      {/* Hood */}
      <ellipse cx="14" cy="10" rx="10" ry="11" fill={selected ? 'hsl(var(--primary) / 0.3)' : 'hsl(var(--muted) / 0.8)'} />
      {/* Eyes */}
      <circle cx="10" cy="11" r="1.5" fill={color} />
      <circle cx="18" cy="11" r="1.5" fill={color} />
      {/* Body */}
      <rect x="6" y="18" width="16" height="12" rx="3" fill={selected ? 'hsl(var(--primary) / 0.2)' : 'hsl(var(--muted) / 0.6)'} />
      {/* Legs */}
      <rect x="7" y="30" width="5" height="8" rx="2" fill={selected ? 'hsl(var(--primary) / 0.2)' : 'hsl(var(--muted) / 0.6)'} />
      <rect x="16" y="30" width="5" height="8" rx="2" fill={selected ? 'hsl(var(--primary) / 0.2)' : 'hsl(var(--muted) / 0.6)'} />
    </svg>
  );
}

function BoxyIcon({ selected }: { selected: boolean }) {
  const color = selected ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))';
  return (
    <svg width="28" height="40" viewBox="0 0 28 40" fill="none">
      {/* Head */}
      <rect x="6" y="2" width="16" height="14" rx="1" fill={selected ? 'hsl(var(--primary) / 0.3)' : 'hsl(var(--muted) / 0.8)'} />
      {/* Eyes */}
      <rect x="9" y="7" width="3" height="3" fill={color} />
      <rect x="16" y="7" width="3" height="3" fill={color} />
      {/* Mouth */}
      <rect x="10" y="12" width="8" height="1.5" fill={color} opacity="0.5" />
      {/* Body */}
      <rect x="5" y="17" width="18" height="12" rx="1" fill={selected ? 'hsl(var(--primary) / 0.2)' : 'hsl(var(--muted) / 0.6)'} />
      {/* Legs */}
      <rect x="7" y="30" width="5" height="9" rx="1" fill={selected ? 'hsl(var(--primary) / 0.2)' : 'hsl(var(--muted) / 0.6)'} />
      <rect x="16" y="30" width="5" height="9" rx="1" fill={selected ? 'hsl(var(--primary) / 0.2)' : 'hsl(var(--muted) / 0.6)'} />
    </svg>
  );
}

export default GameStartScreen;
