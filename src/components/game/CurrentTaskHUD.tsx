import { Target, CheckCircle2 } from 'lucide-react';
import { useMissionStore } from '@/stores/missionStore';

export default function CurrentTaskHUD() {
  const { missions, chapters, currentMissionId, currentChapterId, currentTaskIndex } = useMissionStore();
  
  const currentMission = missions.find(m => m.id === currentMissionId);
  const currentChapter = chapters.find(c => c.id === currentChapterId);
  const currentTask = currentMission?.tasks[currentTaskIndex];
  
  // If no current mission, show completion message
  if (!currentMission || !currentTask) {
    const allCompleted = missions.every(m => m.isCompleted);
    
    if (allCompleted) {
      return (
        <div 
          className="fixed top-20 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{ zIndex: 160 }}
        >
          <div className="bg-gradient-to-r from-yellow-500/20 via-yellow-400/30 to-yellow-500/20 backdrop-blur-md border border-yellow-500/50 rounded-xl px-6 py-3 shadow-lg">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-yellow-400" />
              <span className="text-yellow-300 font-display font-bold text-lg">
                🏆 ALL MISSIONS COMPLETE! 🏆
              </span>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  }
  
  // Calculate completed tasks
  const completedTasks = currentMission.tasks.filter(t => t.completed).length;
  const totalTasks = currentMission.tasks.length;
  
  // Progress indicator
  const showProgress = currentTask.target && currentTask.target > 1;
  const progressPercent = showProgress 
    ? Math.min(100, (currentTask.progress / currentTask.target!) * 100)
    : 0;

  return (
    <div 
      className="fixed top-20 left-1/2 -translate-x-1/2 pointer-events-none w-[90vw] max-w-lg"
      style={{ zIndex: 160 }}
    >
      <div className="bg-background/90 backdrop-blur-md border border-primary/30 rounded-xl shadow-lg overflow-hidden">
        {/* Chapter & Mission Header */}
        <div className="bg-primary/10 px-4 py-2 border-b border-primary/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {currentChapter?.title}: {currentChapter?.subtitle}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {completedTasks}/{totalTasks} tasks
          </span>
        </div>
        
        {/* Mission Name */}
        <div className="px-4 pt-3 pb-1">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <span className="text-primary">►</span>
            {currentMission.title}
          </h3>
        </div>
        
        {/* Current Task - BIG TEXT */}
        <div className="px-4 pb-3">
          <div className="bg-primary/5 rounded-lg px-4 py-3 border border-primary/20">
            <p className="text-lg font-display font-bold text-foreground">
              🎯 {currentTask.description}
            </p>
            
            {/* Progress Bar */}
            {showProgress && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>{currentTask.progress}/{currentTask.target}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Rewards Preview */}
        <div className="bg-muted/50 px-4 py-2 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Rewards:</span>
          <div className="flex items-center gap-3">
            <span className="text-yellow-500 font-bold">💰 {currentMission.rewards.coins}</span>
            <span className="text-cyan-400 font-bold">⭐ {currentMission.rewards.xp} XP</span>
          </div>
        </div>
      </div>
    </div>
  );
}
