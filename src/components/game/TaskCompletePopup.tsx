import { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { useMissionStore } from '@/stores/missionStore';

export default function TaskCompletePopup() {
  const { lastCompletedTask, clearLastCompletedTask } = useMissionStore();
  const [visible, setVisible] = useState(false);
  const [displayTask, setDisplayTask] = useState<string | null>(null);

  useEffect(() => {
    if (lastCompletedTask) {
      setDisplayTask(lastCompletedTask);
      setVisible(true);
      
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => {
          clearLastCompletedTask();
          setDisplayTask(null);
        }, 300);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [lastCompletedTask, clearLastCompletedTask]);

  if (!displayTask) return null;

  return (
    <div 
      className={`fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[200] pointer-events-none transition-all duration-300 ${
        visible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
      }`}
    >
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl px-6 py-4 shadow-2xl border-2 border-green-400/50">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-full p-2">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-green-200">
              Task Complete!
            </div>
            <div className="text-lg font-bold text-white">
              {displayTask}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
