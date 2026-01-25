import { AlertTriangle, Monitor } from 'lucide-react';

export default function PersistentAlertSecondary() {
  return (
    // Full-screen opaque overlay with red tint
    <div className="fixed inset-0 z-[9999] flex items-center justify-center
      bg-[#FEF2F2] dark:bg-[#0C0A0A]
      transition-colors duration-300">
      
      {/* Gradient mesh overlay for visual depth */}
      <div className="absolute inset-0 pointer-events-none
        bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.06)_0%,transparent_60%),radial-gradient(ellipse_at_top,rgba(220,38,38,0.04)_0%,transparent_50%),radial-gradient(ellipse_at_bottom,rgba(220,38,38,0.04)_0%,transparent_50%)]
        dark:bg-[radial-gradient(ellipse_at_center,rgba(248,113,113,0.08)_0%,transparent_60%),radial-gradient(ellipse_at_top,rgba(248,113,113,0.05)_0%,transparent_50%),radial-gradient(ellipse_at_bottom,rgba(248,113,113,0.05)_0%,transparent_50%)]" 
      />

      {/* Content Container */}
      <div className="relative text-center px-8 max-w-2xl mx-auto">
        
        {/* Alert Icon with Glow Pulse */}
        <div className="relative mx-auto mb-10 w-32 h-32">
          {/* Outer glow ring - animated */}
          <div className="absolute inset-0 rounded-3xl animate-ping opacity-20
            bg-red-500 dark:bg-red-400"
            style={{ animationDuration: '2s' }} />
          
          {/* Secondary pulse ring */}
          <div className="absolute inset-2 rounded-2xl animate-pulse
            bg-red-500/20 dark:bg-red-400/20" />
          
          {/* Main icon container */}
          <div className="relative w-full h-full rounded-3xl
            flex items-center justify-center
            bg-gradient-to-br from-red-500 to-red-600
            dark:from-red-500 dark:to-red-600
            shadow-[0_8px_32px_rgba(220,38,38,0.4),0_0_60px_rgba(220,38,38,0.2)]
            dark:shadow-[0_8px_32px_rgba(248,113,113,0.4),0_0_60px_rgba(248,113,113,0.3)]">
            <AlertTriangle className="w-16 h-16 text-white drop-shadow-lg" />
            
            {/* Inner shine reflection */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1/2
                bg-gradient-to-b from-white/25 to-transparent" />
            </div>
          </div>
        </div>

        {/* Main Title */}
        <h1 className="text-5xl md:text-7xl font-black mb-6
          tracking-tighter uppercase
          text-red-700 dark:text-red-400
          drop-shadow-sm
          [text-shadow:0_2px_4px_rgba(220,38,38,0.15)]
          dark:[text-shadow:0_0_30px_rgba(248,113,113,0.3)]">
          Response Required
        </h1>

        {/* Red accent bar with reflection */}
        <div className="relative h-1.5 w-56 mx-auto mb-10 overflow-hidden rounded-full">
          {/* Base bar */}
          <div className="absolute inset-0
            bg-gradient-to-r from-red-500 via-red-600 to-red-500
            dark:from-red-400 dark:via-red-500 dark:to-red-400" />
          
          {/* Animated shine */}
          <div className="absolute inset-0 
            bg-gradient-to-r from-transparent via-white/40 to-transparent
            animate-[shimmer_2s_ease-in-out_infinite]"
            style={{ backgroundSize: '200% 100%' }} />
          
          {/* Glow effect */}
          <div className="absolute -inset-2 blur-lg opacity-50
            bg-red-500 dark:bg-red-400" />
        </div>

        {/* Instruction Text */}
        <p className="text-xl md:text-2xl font-medium mb-4
          text-foreground/80 dark:text-[#A8AEAE]">
          Please check your{' '}
          <span className="inline-flex items-center gap-2
            text-red-600 dark:text-red-400 font-bold">
            <Monitor className="w-5 h-5" />
            Primary Monitor
          </span>{' '}
          to respond.
        </p>

        {/* Subtext */}
        <p className="text-sm text-foreground/50 dark:text-[#6E7878]">
          This screen will close automatically once you respond
        </p>

        {/* Footer Badge */}
        <div className="mt-16 inline-flex items-center gap-3 px-5 py-2.5 rounded-full
          bg-red-100/80 dark:bg-red-950/50
          border border-red-200/60 dark:border-red-800/40
          shadow-sm">
          {/* Pulsing dot */}
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full
              bg-red-500 dark:bg-red-400 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5
              bg-red-600 dark:bg-red-400" />
          </span>
          
          <span className="text-xs font-bold uppercase tracking-widest
            text-red-700 dark:text-red-400">
            Sentinel Enforcement Active
          </span>
        </div>
      </div>

      {/* Corner accent decorations */}
      <div className="absolute top-8 left-8 w-24 h-24 
        border-l-2 border-t-2 rounded-tl-3xl
        border-red-300/30 dark:border-red-700/30" />
      <div className="absolute top-8 right-8 w-24 h-24 
        border-r-2 border-t-2 rounded-tr-3xl
        border-red-300/30 dark:border-red-700/30" />
      <div className="absolute bottom-8 left-8 w-24 h-24 
        border-l-2 border-b-2 rounded-bl-3xl
        border-red-300/30 dark:border-red-700/30" />
      <div className="absolute bottom-8 right-8 w-24 h-24 
        border-r-2 border-b-2 rounded-br-3xl
        border-red-300/30 dark:border-red-700/30" />
    </div>
  );
}
