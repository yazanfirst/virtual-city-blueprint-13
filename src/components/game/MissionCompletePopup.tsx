import { Trophy, Coins, Star, ChevronRight, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMissionStore } from '@/stores/missionStore';
import { useGameStore } from '@/stores/gameStore';
import { useEffect } from 'react';

export default function MissionCompletePopup() {
  const { showMissionComplete, completedMission, closeMissionComplete } = useMissionStore();
  const { addCoins, addXP } = useGameStore();
  
  // Give rewards when popup shows
  useEffect(() => {
    if (showMissionComplete && completedMission) {
      addCoins(completedMission.rewards.coins);
      addXP(completedMission.rewards.xp);
    }
  }, [showMissionComplete, completedMission, addCoins, addXP]);
  
  if (!showMissionComplete || !completedMission) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      style={{ zIndex: 250 }}
    >
      <div className="bg-gradient-to-b from-primary/20 to-background border-2 border-primary/50 rounded-2xl p-8 max-w-md w-[90vw] shadow-[0_0_50px_rgba(var(--primary),0.3)] animate-scale-in text-center">
        {/* Confetti Icon */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse" />
            <div className="relative bg-primary/20 border-2 border-primary rounded-full p-4">
              <PartyPopper className="h-12 w-12 text-primary" />
            </div>
          </div>
        </div>
        
        {/* Title */}
        <h1 className="text-3xl font-display font-black text-primary mb-2 tracking-wider">
          🎉 MISSION COMPLETE! 🎉
        </h1>
        
        {/* Mission Name */}
        <h2 className="text-xl font-bold text-foreground mb-6">
          "{completedMission.title}"
        </h2>
        
        {/* Rewards */}
        <div className="bg-black/30 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
            REWARDS EARNED
          </h3>
          
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Coins className="h-6 w-6 text-yellow-400" />
                <span className="text-2xl font-bold text-yellow-400">
                  +{completedMission.rewards.coins}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">Coins</span>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Star className="h-6 w-6 text-cyan-400" />
                <span className="text-2xl font-bold text-cyan-400">
                  +{completedMission.rewards.xp}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">XP</span>
            </div>
          </div>
        </div>
        
        {/* Completed Tasks */}
        <div className="text-left bg-muted/30 rounded-lg p-3 mb-6">
          <h4 className="text-xs font-bold text-muted-foreground mb-2">COMPLETED TASKS:</h4>
          {completedMission.tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-2 text-sm text-foreground">
              <span className="text-green-500">✓</span>
              <span>{task.description}</span>
            </div>
          ))}
        </div>
        
        {/* Continue Button */}
        <Button 
          onClick={closeMissionComplete}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 text-lg"
        >
          Continue
          <ChevronRight className="h-5 w-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
