import { useState, useEffect } from 'react';
import { Poll } from '../App';
import { AlertTriangle, ArrowRight, SkipForward, Loader, Clock, User } from 'lucide-react';
import LabelText from './LabelText';
import LabelPill from './LabelPill';

interface PersistentAlertProps {
  poll: Poll;
  onSkip: (pollId: string, reason: string) => Promise<void>;
  onFill: () => void;
}

export default function PersistentAlert({ poll, onSkip, onFill }: PersistentAlertProps) {
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [skipReason, setSkipReason] = useState('');
  const [isSkipping, setIsSkipping] = useState(false);
  const [minutesLeft, setMinutesLeft] = useState(0);
  const [isWaylandLimited, setIsWaylandLimited] = useState(false);

  // Listen for Wayland limitation warning from main process
  useEffect(() => {
    if ((window as any).electron?.ipcRenderer) {
      const handleWaylandWarning = (_event: any, isWayland: boolean) => {
        console.log('[PersistentAlert] Wayland limitation warning received:', isWayland);
        setIsWaylandLimited(isWayland);
      };
      
      (window as any).electron.ipcRenderer.on('wayland-limitation-warning', handleWaylandWarning);
      
      return () => {
        (window as any).electron.ipcRenderer.removeListener('wayland-limitation-warning', handleWaylandWarning);
      };
    }
  }, []);

  // Calculate and update time remaining every second
  useEffect(() => {
    const calculateMinutesRemaining = () => {
      const now = new Date();
      const deadline = new Date(poll.deadline);
      const diff = deadline.getTime() - now.getTime();
      const minutes = Math.max(0, Math.floor(diff / (1000 * 60)));
      return minutes;
    };

    // Set initial value
    setMinutesLeft(calculateMinutesRemaining());

    // Update every second for accurate countdown
    const interval = setInterval(() => {
      setMinutesLeft(calculateMinutesRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [poll.deadline]);

  const handleSkip = async () => {
    if (skipReason.trim()) {
      setIsSkipping(true);
      try {
        await onSkip(poll.id, skipReason);
      } finally {
        setIsSkipping(false);
      }
    }
  };

  return (
    // Full-screen opaque overlay - solid background with subtle red tint
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4
      bg-[#FEF2F2] dark:bg-[#0C0A0A]
      transition-colors duration-300">
      
      {/* Subtle gradient mesh overlay for depth */}
      <div className="absolute inset-0 pointer-events-none opacity-60
        bg-[radial-gradient(ellipse_at_top_left,rgba(220,38,38,0.08)_0%,transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(220,38,38,0.05)_0%,transparent_50%)]
        dark:bg-[radial-gradient(ellipse_at_top_left,rgba(248,113,113,0.1)_0%,transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(248,113,113,0.06)_0%,transparent_50%)]" 
      />

      {/* Alert Card */}
      <div className="relative max-w-2xl w-full mx-4 overflow-hidden
        bg-white dark:bg-[#0F1214]
        rounded-2xl
        border border-red-200/60 dark:border-red-900/40
        shadow-[0_4px_24px_rgba(220,38,38,0.12),0_12px_48px_rgba(220,38,38,0.08),inset_0_1px_0_rgba(255,255,255,0.9)]
        dark:shadow-[0_4px_24px_rgba(248,113,113,0.15),0_12px_48px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.03)]
        animate-fade-in scale-bounce">
        
        {/* Left accent border - red gradient */}
        <div className="absolute left-0 top-0 bottom-0 w-1
          bg-gradient-to-b from-red-500 via-red-600 to-red-700
          dark:from-red-400 dark:via-red-500 dark:to-red-600" />
        
        {/* Top reflection shine */}
        <div className="absolute top-0 left-0 right-0 h-px
          bg-gradient-to-r from-transparent via-white/80 to-transparent
          dark:via-red-400/20" />

        {/* Header Section */}
        <div className="relative px-6 pt-6 pb-5 pl-8
          bg-gradient-to-br from-red-50/80 to-transparent
          dark:from-red-950/30 dark:to-transparent
          border-b border-red-100/50 dark:border-red-900/30">
          
          <div className="flex items-start gap-4">
            {/* Pulsing Alert Icon */}
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center
                bg-gradient-to-br from-red-500 to-red-600
                dark:from-red-500 dark:to-red-600
                shadow-[0_4px_12px_rgba(220,38,38,0.35)]
                dark:shadow-[0_4px_16px_rgba(248,113,113,0.4),0_0_20px_rgba(248,113,113,0.2)]">
                <AlertTriangle className="w-7 h-7 text-white" />
              </div>
              {/* Pulse ring animation */}
              <div className="absolute inset-0 rounded-2xl animate-ping opacity-30
                bg-red-500 dark:bg-red-400" 
                style={{ animationDuration: '2s' }} />
            </div>

            {/* Title and Timer */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-1
                tracking-tight">
                Urgent: Response Required
              </h2>
              <div className="flex items-center gap-2 text-red-600/80 dark:text-red-400/70">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-semibold">
                  {minutesLeft} minute{minutesLeft !== 1 ? 's' : ''} left before deadline
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="px-6 py-6 pl-8 space-y-5
          bg-white dark:bg-[#0F1214]">
          
          {/* Publisher Info */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center
              bg-red-100 dark:bg-red-900/30
              text-red-600 dark:text-red-400">
              <User className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-foreground-secondary dark:text-[#A8AEAE]">
              From: <span className="text-foreground dark:text-[#F5F7F7]">{poll.publisherName}</span>
            </span>
          </div>

          {/* Question */}
          <h3 className="text-lg font-semibold text-foreground dark:text-[#F5F7F7] leading-relaxed">
            <LabelText text={poll.question} />
          </h3>

          {/* Labels */}
          {poll.labels && poll.labels.length > 0 && (
            <div>
              <LabelPill labels={poll.labels} />
            </div>
          )}

          {/* Default Response Warning */}
          {poll.showDefaultToConsumers && (
            <div className="p-4 rounded-xl
              bg-red-50 dark:bg-red-950/40
              border border-red-200/60 dark:border-red-800/40
              shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]
              dark:shadow-[inset_0_1px_0_rgba(248,113,113,0.05)]">
              <p className="text-sm text-red-800 dark:text-red-300">
                <strong className="block mb-1 text-red-900 dark:text-red-200">
                  Default response will be recorded:
                </strong>
                <LabelText text={poll.defaultResponse || ''} className="font-semibold" />
              </p>
            </div>
          )}

          {/* Action Buttons */}
          {!showReasonInput ? (
            <div className="space-y-3 pt-2">
              {/* Fill Form - Primary Action */}
              <button
                onClick={onFill}
                className="group w-full py-4 px-6 rounded-xl
                  font-bold text-white
                  bg-gradient-to-b from-red-500 to-red-600
                  hover:from-red-600 hover:to-red-700
                  dark:from-red-500 dark:to-red-600
                  dark:hover:from-red-400 dark:hover:to-red-500
                  shadow-[0_2px_0_#b91c1c,0_4px_12px_rgba(220,38,38,0.3)]
                  hover:shadow-[0_3px_0_#b91c1c,0_6px_20px_rgba(220,38,38,0.4)]
                  dark:shadow-[0_2px_0_#991b1b,0_4px_12px_rgba(248,113,113,0.3),0_0_20px_rgba(248,113,113,0.15)]
                  dark:hover:shadow-[0_3px_0_#991b1b,0_6px_20px_rgba(248,113,113,0.45),0_0_30px_rgba(248,113,113,0.2)]
                  active:translate-y-[1px] active:shadow-[0_1px_0_#b91c1c,0_2px_8px_rgba(220,38,38,0.2)]
                  transition-all duration-200
                  flex items-center justify-center gap-3">
                <span>Fill Form</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Skip Button - Secondary */}
              <button
                onClick={() => setShowReasonInput(true)}
                className="w-full py-4 px-6 rounded-xl
                  font-semibold
                  text-foreground dark:text-[#F5F7F7]
                  bg-muted dark:bg-[#1A1E22]
                  border-2 border-border dark:border-[#262B30]
                  hover:bg-red-50 dark:hover:bg-red-950/30
                  hover:border-red-200 dark:hover:border-red-800/50
                  shadow-sm hover:shadow-md
                  transition-all duration-200
                  flex items-center justify-center gap-2">
                <SkipForward className="w-4 h-4" />
                <span>Skip (Provide Reason)</span>
              </button>
            </div>
          ) : (
            /* Skip Reason Form */
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-sm font-medium mb-2
                  text-foreground dark:text-[#F5F7F7]">
                  Why are you skipping this signal? 
                  <span className="text-red-500 dark:text-red-400 ml-1">*</span>
                </label>
                <textarea
                  value={skipReason}
                  onChange={(e) => setSkipReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl
                    bg-white dark:bg-[#0C0E10]
                    border-2 border-border dark:border-[#262B30]
                    text-foreground dark:text-[#F5F7F7]
                    placeholder:text-muted-foreground dark:placeholder:text-[#6E7878]
                    focus:outline-none focus:border-red-500 dark:focus:border-red-500
                    focus:ring-4 focus:ring-red-500/20 dark:focus:ring-red-500/30
                    shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)]
                    dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)]
                    transition-all duration-200 resize-none"
                  placeholder="Please provide a valid reason..."
                  rows={4}
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                {/* Cancel Button */}
                <button
                  onClick={() => {
                    setShowReasonInput(false);
                    setSkipReason('');
                  }}
                  className="flex-1 px-4 py-3 rounded-xl
                    font-medium
                    text-foreground dark:text-[#F5F7F7]
                    bg-muted dark:bg-[#1A1E22]
                    hover:bg-muted/80 dark:hover:bg-[#252A30]
                    transition-colors duration-200">
                  Cancel
                </button>

                {/* Confirm Skip Button */}
                <button
                  onClick={handleSkip}
                  disabled={!skipReason.trim() || isSkipping}
                  className="flex-1 px-4 py-3 rounded-xl
                    font-bold text-white
                    bg-red-600 hover:bg-red-700
                    dark:bg-red-600 dark:hover:bg-red-500
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600
                    shadow-[0_4px_12px_rgba(220,38,38,0.3)]
                    hover:shadow-[0_6px_16px_rgba(220,38,38,0.4)]
                    dark:shadow-[0_4px_12px_rgba(248,113,113,0.3),0_0_15px_rgba(248,113,113,0.15)]
                    dark:hover:shadow-[0_6px_16px_rgba(248,113,113,0.4),0_0_20px_rgba(248,113,113,0.2)]
                    transition-all duration-200
                    flex items-center justify-center gap-2">
                  {isSkipping ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Skipping...</span>
                    </>
                  ) : (
                    <span>Confirm Skip</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 pl-8
          border-t border-red-100/50 dark:border-red-900/30
          bg-red-50/50 dark:bg-red-950/20">
          <p className="text-xs text-center font-medium
            text-red-600/70 dark:text-red-400/60
            flex items-center justify-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            This notification cannot be dismissed without taking action
          </p>
          
          {/* Wayland Limitation Warning */}
          {isWaylandLimited && (
            <p className="text-xs text-center font-medium mt-2
              text-amber-600/80 dark:text-amber-400/70
              flex items-center justify-center gap-1.5">
              <AlertTriangle className="w-3 h-3" />
              Linux Wayland: Some system shortcuts may not be fully blocked
            </p>
          )}
        </div>

        {/* Bottom reflection glow (dark mode) */}
        <div className="absolute bottom-0 left-1/4 right-1/4 h-px
          bg-gradient-to-r from-transparent via-red-400/30 to-transparent
          dark:via-red-400/20 hidden dark:block" />
      </div>
    </div>
  );
}
