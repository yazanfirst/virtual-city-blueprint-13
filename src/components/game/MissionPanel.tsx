import { Target, X, Lock, CheckCircle2, Circle, ChevronRight, Trophy, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMissionStore } from '@/stores/missionStore';
import { ScrollArea } from '@/components/ui/scroll-area';

type MissionPanelProps = {
  onClose: () => void;
};

export default function MissionPanel({ onClose }: MissionPanelProps) {
  const { chapters, missions, currentMissionId, currentChapterId, startMission } = useMissionStore();

  const handleStartMission = (missionId: string) => {
    startMission(missionId);
    onClose();
  };

  return (
    <div 
      className="absolute inset-0 flex items-center justify-center pointer-events-auto"
      style={{ zIndex: 200 }}
      onClick={onClose}
    >
      <div 
        className="bg-background/95 backdrop-blur-md border border-border/50 rounded-xl shadow-xl w-[95vw] max-w-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/30">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold uppercase tracking-wider text-foreground">
                Missions
              </h3>
              <p className="text-xs text-muted-foreground">Complete missions to earn rewards!</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-muted-foreground hover:text-foreground p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Content */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
            {chapters.map((chapter) => {
              const chapterMissions = missions.filter(m => m.chapterId === chapter.id);
              const completedMissions = chapterMissions.filter(m => m.isCompleted).length;
              const isCurrentChapter = chapter.id === currentChapterId;
              
              return (
                <div 
                  key={chapter.id}
                  className={`rounded-xl border ${
                    chapter.isUnlocked 
                      ? isCurrentChapter 
                        ? 'border-primary/50 bg-primary/5'
                        : 'border-border/50 bg-muted/30'
                      : 'border-muted/30 bg-muted/10 opacity-60'
                  }`}
                >
                  {/* Chapter Header */}
                  <div className="p-4 border-b border-border/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {chapter.isCompleted ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      ) : chapter.isUnlocked ? (
                        <div className="h-6 w-6 rounded-full border-2 border-primary flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">
                            {completedMissions}/{chapterMissions.length}
                          </span>
                        </div>
                      ) : (
                        <Lock className="h-6 w-6 text-muted-foreground" />
                      )}
                      <div>
                        <h4 className="font-display font-bold text-foreground">
                          📖 {chapter.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">{chapter.subtitle}</p>
                      </div>
                    </div>
                    
                    {chapter.isCompleted && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-bold">
                        ✓ COMPLETE
                      </span>
                    )}
                  </div>
                  
                  {/* Missions List */}
                  {chapter.isUnlocked && (
                    <div className="p-2 space-y-2">
                      {chapterMissions.map((mission) => {
                        const isActive = mission.id === currentMissionId;
                        const completedTasks = mission.tasks.filter(t => t.completed).length;
                        
                        return (
                          <div 
                            key={mission.id}
                            className={`rounded-lg p-3 ${
                              mission.isCompleted 
                                ? 'bg-green-500/10 border border-green-500/30'
                                : isActive
                                  ? 'bg-primary/10 border border-primary/30'
                                  : mission.isUnlocked
                                    ? 'bg-muted/50 border border-transparent hover:border-border/50 cursor-pointer'
                                    : 'bg-muted/20 opacity-50'
                            }`}
                            onClick={() => mission.isUnlocked && !mission.isCompleted && handleStartMission(mission.id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  {mission.isCompleted ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  ) : isActive ? (
                                    <ChevronRight className="h-4 w-4 text-primary animate-pulse" />
                                  ) : mission.isUnlocked ? (
                                    <Circle className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <Lock className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  <h5 className={`font-bold text-sm ${
                                    mission.isCompleted 
                                      ? 'text-green-400'
                                      : isActive 
                                        ? 'text-primary'
                                        : 'text-foreground'
                                  }`}>
                                    {mission.title}
                                    {isActive && <span className="ml-2 text-xs font-normal text-primary">► ACTIVE</span>}
                                  </h5>
                                </div>
                                
                                <p className="text-xs text-muted-foreground mb-2 ml-6">
                                  {mission.description}
                                </p>
                                
                                {/* Tasks */}
                                {(isActive || mission.isCompleted) && (
                                  <div className="ml-6 space-y-1 mb-2">
                                    {mission.tasks.map((task, i) => (
                                      <div key={task.id} className="flex items-center gap-2 text-xs">
                                        {task.completed ? (
                                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                                        ) : (
                                          <Circle className="h-3 w-3 text-muted-foreground" />
                                        )}
                                        <span className={task.completed ? 'text-muted-foreground line-through' : 'text-foreground'}>
                                          {task.description}
                                          {task.target && task.target > 1 && !task.completed && (
                                            <span className="text-muted-foreground ml-1">
                                              ({task.progress}/{task.target})
                                            </span>
                                          )}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {/* Rewards */}
                                <div className="flex items-center gap-3 ml-6 text-xs">
                                  <span className="flex items-center gap-1 text-yellow-500">
                                    <Coins className="h-3 w-3" />
                                    {mission.rewards.coins}
                                  </span>
                                  <span className="flex items-center gap-1 text-cyan-400">
                                    <Trophy className="h-3 w-3" />
                                    {mission.rewards.xp} XP
                                  </span>
                                </div>
                              </div>
                              
                              {!mission.isCompleted && mission.isUnlocked && !isActive && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="text-xs h-7"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartMission(mission.id);
                                  }}
                                >
                                  Start
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Locked Chapter Message */}
                  {!chapter.isUnlocked && (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      <Lock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      Complete previous chapter to unlock
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
