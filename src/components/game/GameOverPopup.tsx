import { Skull, RotateCcw, Home, Trophy, Coins, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/stores/gameStore';
import { useMissionStore } from '@/stores/missionStore';
import { useHazardStore } from '@/stores/hazardStore';
import { Link } from 'react-router-dom';

export default function GameOverPopup() {
  const { 
    showGameOver, 
    gameOverStats, 
    restartGame,
  } = useGameStore();
  
  const { resetMissions } = useMissionStore();
  const { resetHazards } = useHazardStore();
  
  if (!showGameOver) return null;

  const handleTryAgain = () => {
    restartGame();
    resetHazards();
  };

  const trollMessages = [
    "Better luck next time! 😈",
    "Did that hurt? 💀",
    "Maybe try walking around the traps? 🤔",
    "The city claims another victim! 🏙️",
    "You lasted longer than I expected! 😂",
    "Pro tip: Avoid things that hurt! 🎯",
  ];
  
  const randomMessage = trollMessages[Math.floor(Math.random() * trollMessages.length)];

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      style={{ zIndex: 300 }}
    >
      <div className="bg-gradient-to-b from-red-950 to-background border-2 border-red-500/50 rounded-2xl p-8 max-w-md w-[90vw] shadow-[0_0_50px_rgba(255,0,0,0.3)] animate-scale-in">
        {/* Skull Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/30 rounded-full blur-xl animate-pulse" />
            <div className="relative bg-red-500/20 border-2 border-red-500 rounded-full p-6">
              <Skull className="h-16 w-16 text-red-500" />
            </div>
          </div>
        </div>
        
        {/* Title */}
        <h1 className="text-4xl font-display font-black text-center text-red-500 mb-2 tracking-wider">
          GAME OVER
        </h1>
        
        {/* Troll Message */}
        <p className="text-center text-muted-foreground mb-6 text-lg">
          {randomMessage}
        </p>
        
        {/* Stats */}
        <div className="bg-black/40 rounded-xl p-4 mb-6 space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Your Run Stats
          </h3>
          
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Gift className="h-4 w-4 text-purple-400" />
              Boxes Found
            </span>
            <span className="text-foreground font-bold">{gameOverStats.boxesFound}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Coins className="h-4 w-4 text-yellow-400" />
              Coins Collected
            </span>
            <span className="text-foreground font-bold">{gameOverStats.coinsCollected}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Trophy className="h-4 w-4 text-cyan-400" />
              Vouchers Earned
            </span>
            <span className="text-foreground font-bold">{gameOverStats.vouchersEarned}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Skull className="h-4 w-4 text-red-400" />
              Deaths by Hazards
            </span>
            <span className="text-foreground font-bold">{gameOverStats.deathsByHazards}</span>
          </div>
        </div>
        
        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <Button 
            onClick={handleTryAgain}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6 text-lg"
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            Try Again
          </Button>
          
          <Button 
            variant="outline"
            asChild
            className="w-full border-red-500/30 hover:bg-red-500/10"
          >
            <Link to="/city-map">
              <Home className="h-4 w-4 mr-2" />
              Back to City Map
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
