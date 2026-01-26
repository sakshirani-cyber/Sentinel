import { useMemo } from 'react';

export type StatusFilter = 'all' | 'incomplete' | 'completed' | 'draft';

interface StatusCardData {
  id: StatusFilter;
  label: string;
  count: number;
  visible?: boolean;
}

interface StatusFilterCardsProps {
  activeFilter: StatusFilter;
  onFilterChange: (filter: StatusFilter) => void;
  counts: {
    all: number;
    incomplete: number;
    completed: number;
    draft?: number;
  };
  /** Show the draft card (publisher only) */
  showDraft?: boolean;
}

/**
 * StatusFilterCards Component
 * 
 * A row of clickable cards for filtering signals by status.
 * - All: Shows total count
 * - Active: Shows active signals (deadline not expired)
 * - Scheduled: Shows scheduled signals (not published but scheduled for future)
 * - Draft: Shows draft/scheduled count (publisher only, optional)
 */
export default function StatusFilterCards({
  activeFilter,
  onFilterChange,
  counts,
  showDraft = false,
}: StatusFilterCardsProps) {
  const cards: StatusCardData[] = useMemo(() => [
    { id: 'all', label: 'All', count: counts.all, visible: true },
    { id: 'incomplete', label: 'Active', count: counts.incomplete, visible: true },
    { id: 'completed', label: 'Scheduled', count: counts.completed, visible: true },
    { id: 'draft', label: 'Draft', count: counts.draft || 0, visible: showDraft },
  ], [counts, showDraft]);

  const visibleCards = cards.filter(card => card.visible);

  return (
    <div 
      className="grid gap-4 mb-6"
      style={{ 
        gridTemplateColumns: `repeat(${visibleCards.length}, 1fr)` 
      }}
    >
      {visibleCards.map((card) => (
        <button
          key={card.id}
          onClick={() => onFilterChange(card.id)}
          className={`
            relative p-4 rounded-xl border backdrop-blur-sm
            text-left cursor-pointer
            transition-all duration-200 ease-out
            hover:scale-[1.03] hover:-translate-y-0.5
            active:scale-[0.98]
            focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2
            ${activeFilter === card.id
              ? 'border-primary bg-primary-muted shadow-lg dark:shadow-[0_0_15px_rgba(0,255,194,0.2)]'
              : 'border-border bg-card hover:border-primary/50 hover:shadow-md hover:bg-primary-muted'
            }
          `}
          aria-pressed={activeFilter === card.id}
        >
          {/* Active Indicator */}
          {activeFilter === card.id && (
            <div className="absolute top-0 left-4 right-4 h-0.5 bg-primary rounded-b-full" />
          )}
          
          {/* Label */}
          <p className={`text-sm font-medium mb-1 transition-colors ${
            activeFilter === card.id 
              ? 'text-primary' 
              : 'text-muted-foreground'
          }`}>
            {card.label}
          </p>
          
          {/* Count */}
          <p className={`text-2xl font-bold transition-colors ${
            activeFilter === card.id 
              ? 'text-primary' 
              : 'text-foreground'
          }`}>
            {card.count}
          </p>
        </button>
      ))}
    </div>
  );
}
