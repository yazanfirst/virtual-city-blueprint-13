import { Play, Gamepad2, Target, Store } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GameStartScreenProps {
  streetName: string;
  category: string;
  onStartGame: () => void;
}

const GameStartScreen = ({ streetName, category, onStartGame }: GameStartScreenProps) => {
  return (
    <div className="h-full w-full bg-gradient-to-br from-background via-background/95 to-primary/10 flex items-center justify-center">
      <div className="text-center space-y-8 p-8">
        {/* Game Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 border-2 border-primary">
              <Gamepad2 className="h-12 w-12 text-primary" />
            </div>
          </div>
        </div>

        {/* Street Name */}
        <div className="space-y-2">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">
            {streetName}
          </h1>
          <p className="text-primary text-sm uppercase tracking-widest font-medium">
            {category}
          </p>
        </div>

        {/* Features */}
        <div className="flex flex-wrap justify-center gap-4 text-muted-foreground text-sm">
          <div className="flex items-center gap-2 bg-background/50 px-4 py-2 rounded-lg border border-border/50">
            <Store className="h-4 w-4 text-primary" />
            <span>Explore Shops</span>
          </div>
          <div className="flex items-center gap-2 bg-background/50 px-4 py-2 rounded-lg border border-border/50">
            <Target className="h-4 w-4 text-primary" />
            <span>Complete Missions</span>
          </div>
        </div>

        {/* Start Button */}
        <Button 
          variant="cyber" 
          size="lg"
          onClick={onStartGame}
          className="px-12 py-6 text-lg font-bold group"
        >
          <Play className="h-6 w-6 mr-3 group-hover:scale-110 transition-transform" />
          Start Game
        </Button>

        {/* Controls Hint */}
        <div className="text-muted-foreground text-xs space-y-1">
          <p>Use <span className="text-foreground font-medium">WASD</span> or <span className="text-foreground font-medium">Arrow Keys</span> to move</p>
          <p>Hold <span className="text-foreground font-medium">Left Click</span> to rotate camera</p>
          <p>Press <span className="text-foreground font-medium">Space</span> to jump</p>
        </div>
      </div>
    </div>
  );
};

export default GameStartScreen;
