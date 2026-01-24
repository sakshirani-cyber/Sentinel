/**
 * AnalyticsSkeleton Component
 * 
 * Loading skeleton that mimics the final analytics panel layout.
 * Shows animated pulse placeholders while data is being fetched.
 */

export default function AnalyticsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="bg-muted rounded-xl p-4 space-y-2"
          >
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-muted-foreground/20" />
              <div className="h-3 bg-muted-foreground/20 rounded w-16" />
            </div>
            <div className="h-7 bg-muted-foreground/20 rounded w-12" />
          </div>
        ))}
      </div>

      {/* Donut Chart Skeleton */}
      <div className="bg-card dark:bg-secondary rounded-xl border border-border p-6">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Donut placeholder */}
          <div className="relative w-48 h-48 flex-shrink-0">
            <div className="absolute inset-0 rounded-full border-[20px] border-muted" />
            <div className="absolute inset-8 rounded-full bg-card dark:bg-secondary flex items-center justify-center">
              <div className="h-8 w-16 bg-muted-foreground/20 rounded" />
            </div>
          </div>
          
          {/* Legend placeholder */}
          <div className="flex-1 grid grid-cols-2 gap-3 w-full">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-muted-foreground/20" />
                <div className="h-4 bg-muted-foreground/20 rounded flex-1 max-w-[120px]" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Response Distribution Skeleton */}
      <div className="bg-card dark:bg-secondary rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded bg-muted-foreground/20" />
          <div className="h-5 bg-muted-foreground/20 rounded w-40" />
        </div>
        
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-muted-foreground/20 rounded w-32" />
              <div className="h-4 bg-muted-foreground/20 rounded w-16" />
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-muted-foreground/20 rounded-full"
                style={{ width: `${80 - i * 20}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Response Table Skeleton */}
      <div className="bg-card dark:bg-secondary rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="h-5 bg-muted-foreground/20 rounded w-40" />
        </div>
        <div className="divide-y divide-border">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-muted-foreground/20" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted-foreground/20 rounded w-40" />
                <div className="h-3 bg-muted-foreground/20 rounded w-24" />
              </div>
              <div className="h-6 bg-muted-foreground/20 rounded w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
