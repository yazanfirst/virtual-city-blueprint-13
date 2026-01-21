import { Sparkles, AlertTriangle, ArrowRight } from 'lucide-react';
import { useMirrorWorldStore } from '@/stores/mirrorWorldStore';

export default function MirrorWorldBriefing() {
  const { requiredAnchors, completeBriefing } = useMirrorWorldStore();

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-950/95 border border-purple-500/40 rounded-xl p-6 max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="h-8 w-8 text-purple-300" />
          <h2 className="font-display text-xl font-bold text-purple-200 uppercase tracking-wider">
            Mirror World
          </h2>
        </div>

        <div className="text-sm text-purple-100/80 space-y-4 mb-6">
          <p className="text-purple-50 font-medium">
            You&#39;ve entered the Mirror World! The city has flipped and the sky is beneath you.
          </p>
          <div className="bg-purple-950/50 rounded-lg p-3 border border-purple-500/30">
            <h3 className="text-purple-200 font-bold text-xs uppercase mb-2">Mission:</h3>
            <ul className="space-y-1 text-xs">
              <li>• Collect {requiredAnchors} Reality Anchors on the rooftops</li>
              <li>• Escape before time collapses (75 seconds)</li>
              <li>• The Shadow hunts you and speeds up over time</li>
            </ul>
          </div>
          <div className="bg-red-950/40 rounded-lg p-3 border border-red-500/30">
            <h3 className="text-red-300 font-bold text-xs uppercase mb-2 flex items-center gap-2">
              <AlertTriangle className="h-3 w-3" />
              Warning
            </h3>
            <p className="text-xs text-red-200">
              Stand still and it still moves. If it touches you twice, the Mirror World wins.
            </p>
          </div>
        </div>

        <button
          type="button"
          onPointerDown={(e) => {
            e.stopPropagation();
            completeBriefing();
          }}
          className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase tracking-wider transition-colors touch-manipulation active:scale-[0.98] inline-flex items-center justify-center gap-2"
        >
          Enter Mirror World
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
