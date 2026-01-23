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
 * A row of 4 clickable cards for filtering signals by status.
 * - All: Shows total count
 * - Incomplete: Shows incomplete/pending count
 * - Completed: Shows completed count
 * - Draft: Shows draft/scheduled count (publisher only)
 */
export default function StatusFilterCards({
  activeFilter,
  onFilterChange,
  counts,
  showDraft = false,
}: StatusFilterCardsProps) {
  const cards: StatusCardData[] = useMemo(() => [
    { id: 'all', label: 'All', count: counts.all, visible: true },
    { id: 'incomplete', label: 'Incomplete', count: counts.incomplete, visible: true },
    { id: 'completed', label: 'Completed', count: counts.completed, visible: true },
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
            focus-visible:outline-2 focus-visible:outline-ribbit-hunter-green focus-visible:outline-offset-2
            ${activeFilter === card.id
              ? 'border-ribbit-hunter-green bg-ribbit-dry-sage/40 shadow-lg'
              : 'border-border bg-card hover:border-ribbit-fern hover:shadow-md hover:bg-ribbit-dry-sage/20'
            }
          `}
          aria-pressed={activeFilter === card.id}
        >
          {/* Active Indicator */}
          {activeFilter === card.id && (
            <div className="absolute top-0 left-4 right-4 h-0.5 bg-ribbit-hunter-green rounded-b-full" />
          )}
          
          {/* Label */}
          <p className={`text-sm font-medium mb-1 transition-colors ${
            activeFilter === card.id 
              ? 'text-ribbit-hunter-green dark:text-ribbit-dry-sage' 
              : 'text-muted-foreground'
          }`}>
            {card.label}
          </p>
          
          {/* Count */}
          <p className={`text-2xl font-bold transition-colors ${
            activeFilter === card.id 
              ? 'text-ribbit-hunter-green dark:text-ribbit-dry-sage' 
              : 'text-foreground'
          }`}>
            {card.count}
          </p>
        </button>
      ))}
    </div>
  );
}
