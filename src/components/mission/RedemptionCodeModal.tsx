import { useState } from 'react';
import { Copy, CheckCircle, ExternalLink, X } from 'lucide-react';
import { format } from 'date-fns';

interface RedemptionCodeModalProps {
  isOpen: boolean;
  code: string;
  coinsSpent: number;
  expiresAt: string;
  externalLink?: string | null;
  onClose: () => void;
}

export default function RedemptionCodeModal({
  isOpen,
  code,
  coinsSpent,
  expiresAt,
  externalLink,
  onClose,
}: RedemptionCodeModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement('textarea');
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="bg-card border border-border rounded-xl p-6 max-w-sm mx-4 shadow-2xl text-center space-y-4">
        {/* Close */}
        <div className="flex justify-end -mt-2 -mr-2">
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1 text-muted-foreground hover:text-foreground touch-manipulation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-1">
          <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto" />
          <h2 className="font-display text-lg font-bold text-foreground">Offer Claimed!</h2>
          <p className="text-sm text-muted-foreground">
            You spent {coinsSpent} coins for this discount code.
          </p>
        </div>

        {/* Code display */}
        <div className="bg-muted rounded-lg p-4 space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Your Coupon Code</p>
          <p className="font-mono text-2xl font-bold text-foreground tracking-[0.2em]">{code}</p>
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-bold transition-all touch-manipulation active:scale-95"
          >
            {copied ? (
              <>
                <CheckCircle className="h-3.5 w-3.5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy Code
              </>
            )}
          </button>
        </div>

        <p className="text-[10px] text-muted-foreground">
          Expires: {format(new Date(expiresAt), 'MMM d, yyyy')}
        </p>

        {externalLink && (
          <a
            href={externalLink}
            target="_blank"
            rel="noopener noreferrer"
            onPointerDown={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border text-foreground text-sm font-medium hover:bg-accent transition-all touch-manipulation active:scale-95"
          >
            <ExternalLink className="h-4 w-4" />
            Visit Shop Website
          </a>
        )}
      </div>
    </div>
  );
}
