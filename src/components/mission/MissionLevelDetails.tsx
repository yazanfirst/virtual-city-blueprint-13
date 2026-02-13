import { Clock, Heart, Target, Ghost, Sparkles, Skull, Zap, Shield } from 'lucide-react';
import { getZombieLevelConfig, getGhostHuntLevelConfig, getMirrorWorldLevelConfig } from '@/lib/missionLevels';

interface LevelDetailProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  highlight?: boolean;
}

const LevelDetail = ({ icon: Icon, label, value, highlight }: LevelDetailProps) => (
  <div className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
    <div className="flex items-center gap-2">
      <Icon className={`h-3.5 w-3.5 ${highlight ? 'text-primary' : 'text-muted-foreground'}`} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
    <span className={`text-xs font-bold ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</span>
  </div>
);

interface MissionLevelDetailsProps {
  missionType: 'zombie' | 'ghost' | 'mirror';
  level: number;
  isCompact?: boolean;
}

export default function MissionLevelDetails({ missionType, level, isCompact = false }: MissionLevelDetailsProps) {
  if (missionType === 'zombie') {
    const config = getZombieLevelConfig(level);
    return (
      <div className={`bg-muted/30 rounded-lg border border-border/30 ${isCompact ? 'p-2' : 'p-3'}`}>
        <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-semibold">
          Level {level} Stats
        </h4>
        <div className="space-y-0.5">
          <LevelDetail icon={Clock} label="Time Limit" value={`${config.timeLimit}s`} />
          <LevelDetail icon={Skull} label="Zombies" value={config.zombieCount} />
          <LevelDetail icon={Heart} label="Lives" value={config.lives} highlight />
          <LevelDetail icon={Zap} label="Active Traps" value={config.activeTrapCount} />
        </div>
      </div>
    );
  }

  if (missionType === 'ghost') {
    const config = getGhostHuntLevelConfig(level);
    return (
      <div className={`bg-purple-950/30 rounded-lg border border-purple-500/20 ${isCompact ? 'p-2' : 'p-3'}`}>
        <h4 className="text-[10px] uppercase tracking-wider text-purple-300/70 mb-2 font-semibold">
          Level {level} Stats
        </h4>
        <div className="space-y-0.5">
          <LevelDetail icon={Clock} label="Time Limit" value={`${config.timeLimit}s`} />
          <LevelDetail icon={Ghost} label="Ghosts" value={config.ghostCount} />
          <LevelDetail icon={Target} label="Required" value={`${config.requiredCaptures} captures`} highlight />
          <LevelDetail icon={Heart} label="Lives" value={config.playerLives} />
          <LevelDetail icon={Shield} label="Trap Shots" value={config.trapCharges} />
        </div>
      </div>
    );
  }

  if (missionType === 'mirror') {
    const config = getMirrorWorldLevelConfig(level);
    return (
      <div className={`bg-purple-950/30 rounded-lg border border-purple-500/20 ${isCompact ? 'p-2' : 'p-3'}`}>
        <h4 className="text-[10px] uppercase tracking-wider text-purple-300/70 mb-2 font-semibold">
          Level {level} Stats
        </h4>
        <div className="space-y-0.5">
          <LevelDetail icon={Clock} label="Base Time" value={`${config.baseTime}s`} />
          <LevelDetail icon={Sparkles} label="Anchors" value={`${config.requiredAnchors} required`} highlight />
          <LevelDetail icon={Heart} label="Lives" value={config.lives} />
          <LevelDetail icon={Skull} label="Shadows" value={config.shadowCount} />
          <LevelDetail icon={Zap} label="Time Bonus" value={`+${config.anchorBonus}s each`} />
        </div>
      </div>
    );
  }

  return null;
}
