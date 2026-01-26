import { useState, useMemo, useCallback, useEffect } from 'react';
import { Poll, Response, User } from '../../types';
import { PageHeader, StatusFilterCards, SearchFilterRow, defaultFilterState, useLayout } from '../layout';
import type { StatusFilter, SortOption, FilterState } from '../layout';
import PublishedPolls from '../PublishedPolls';
import ScheduledPolls from '../ScheduledPolls';
import { EmptyState } from '../signals';
import { AnalyticsPanel } from '../analytics';
import { Pagination } from '../common';
import EditSignalPanel from '../layout/EditSignalPanel';

interface SentPageProps {
  user: User;
  polls: Poll[];
  responses: Response[];
  onDeletePoll: (pollId: string) => void;
  onUpdatePoll: (pollId: string, updates: Partial<Poll>, republish: boolean) => void;
}

/**
 * SentPage Component
 * 
 * Publisher view showing:
 * - Status filter cards (All, Active, Scheduled)
 * - Published and scheduled signal lists
 */
export default function SentPage({
  user,
  polls,
  responses,
  onDeletePoll,
  onUpdatePoll,
}: SentPageProps) {
  // Get edit panel state from layout context
  const { isEditPanelOpen, editPollData, closeEditPanel } = useLayout();

  // Filter state
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('deadline');
  const [filters, setFilters] = useState<FilterState>(defaultFilterState);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter polls by publisher
  const userPolls = useMemo(() => 
    polls.filter(p => p.publisherEmail === user.email), 
    [polls, user.email]
  );

  const activePolls = useMemo(() => {
    const now = new Date();
    return userPolls.filter(p => 
      p.status !== 'scheduled' && new Date(p.deadline) >= now
    );
  }, [userPolls]);

  const scheduledPolls = useMemo(() => 
    userPolls.filter(p => p.status === 'scheduled'), 
    [userPolls]
  );

  // All published polls (regardless of expiration) for "All" filter
  const allPublishedPolls = useMemo(() => 
    userPolls.filter(p => p.status !== 'scheduled'), 
    [userPolls]
  );

  // Status counts
  const counts = useMemo(() => ({
    all: userPolls.length,
    incomplete: activePolls.length, // Will display as "Active"
    completed: scheduledPolls.length, // Will display as "Scheduled"
  }), [userPolls.length, activePolls.length, scheduledPolls.length]);

  // Available filter options
  const availableLabels = useMemo(() => {
    const labels = new Set<string>();
    userPolls.forEach(p => {
      p.labels?.forEach((l: string) => labels.add(l));
    });
    return Array.from(labels);
  }, [userPolls]);

  const availableConsumers = useMemo(() => {
    const consumers = new Set<string>();
    userPolls.forEach(p => {
      p.consumers?.forEach((c: string) => consumers.add(c));
    });
    return Array.from(consumers).slice(0, 10); // Limit to first 10 for performance
  }, [userPolls]);

  // Apply search, sort, and filters
  const applyFilters = useCallback((pollList: Poll[]) => {
    let result = [...pollList];

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.question?.toLowerCase().includes(query) ||
        p.labels?.some((l: string) => l.toLowerCase().includes(query)) ||
        p.consumers?.some((c: string) => c.toLowerCase().includes(query))
      );
    }

    // Label filter
    if (filters.labels.length > 0) {
      result = result.filter(p =>
        p.labels?.some((l: string) => filters.labels.includes(l))
      );
    }

    // Date range filter (based on deadline)
    if (filters.dateRange.start || filters.dateRange.end) {
      result = result.filter(p => {
        const deadline = new Date(p.deadline);
        
        if (filters.dateRange.start) {
          const startDate = new Date(filters.dateRange.start);
          startDate.setHours(0, 0, 0, 0);
          if (deadline < startDate) return false;
        }
        
        if (filters.dateRange.end) {
          const endDate = new Date(filters.dateRange.end);
          endDate.setHours(23, 59, 59, 999);
          if (deadline > endDate) return false;
        }
        
        return true;
      });
    }

    // Scheduled only filter
    if (filters.scheduledOnly) {
      result = result.filter(p => p.status === 'scheduled');
    }

    // Sort
    result.sort((a, b) => {
      switch (sortOption) {
        case 'newest':
          return new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime();
        case 'oldest':
          return new Date(a.publishedAt || 0).getTime() - new Date(b.publishedAt || 0).getTime();
        case 'deadline':
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        case 'title':
          return (a.question || '').localeCompare(b.question || '');
        default:
          return 0;
      }
    });

    return result;
  }, [searchQuery, sortOption, filters]);

  // Get filtered polls based on status
  const { filteredPublished, filteredScheduled } = useMemo(() => {
    let published: Poll[];
    let scheduled: Poll[];

    switch (statusFilter) {
      case 'incomplete': // Active (deadline not expired)
        published = activePolls;
        scheduled = [];
        break;
      case 'completed': // Scheduled
        published = [];
        scheduled = scheduledPolls;
        break;
      case 'all':
      default:
        // Show ALL polls: all published (including expired) and all scheduled
        published = allPublishedPolls;
        scheduled = scheduledPolls;
        break;
    }

    // Apply search, sort, and filters
    return {
      filteredPublished: applyFilters(published),
      filteredScheduled: applyFilters(scheduled),
    };
  }, [statusFilter, activePolls, scheduledPolls, allPublishedPolls, applyFilters]);

  const hasNoSignals = filteredPublished.length === 0 && filteredScheduled.length === 0;

  // Combined total for pagination
  const totalItems = filteredPublished.length + filteredScheduled.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Paginate the combined lists (scheduled first, then published)
  const { paginatedScheduled, paginatedPublished } = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    
    // Combine: scheduled first, then published
    const combined = [...filteredScheduled, ...filteredPublished];
    const paginated = combined.slice(start, end);
    
    // Split back into scheduled and published
    const scheduledCount = filteredScheduled.length;
    const paginatedSched: Poll[] = [];
    const paginatedPub: Poll[] = [];
    
    paginated.forEach((poll, idx) => {
      const originalIdx = start + idx;
      if (originalIdx < scheduledCount) {
        paginatedSched.push(poll);
      } else {
        paginatedPub.push(poll);
      }
    });
    
    return {
      paginatedScheduled: paginatedSched,
      paginatedPublished: paginatedPub,
    };
  }, [filteredScheduled, filteredPublished, currentPage, itemsPerPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sortOption, filters, itemsPerPage]);

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title="Sent"
        subtitle={`${activePolls.length} published, ${scheduledPolls.length} scheduled`}
        showCreateButton={true}
      />

      {/* Status Filter Cards */}
      <StatusFilterCards
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
        counts={counts}
        showDraft={false}
      />

      {/* Search, Filter, Sort Row */}
      <SearchFilterRow
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search your signals..."
        sortValue={sortOption}
        onSortChange={setSortOption}
        filters={filters}
        onFiltersChange={setFilters}
        availableLabels={availableLabels}
        availablePublishers={availableConsumers}
        showFilters={true}
        isPublisher={true}
      />

      {/* Signal Lists */}
      {hasNoSignals ? (
        <EmptyState
          type="sent"
          title={searchQuery ? 'No Results Found' : undefined}
          description={searchQuery ? 'Try adjusting your search or filters.' : undefined}
          action={!searchQuery ? {
            label: 'Create Signal',
            onClick: () => {
              // Trigger create panel - this will be handled via layout context
              const event = new CustomEvent('ribbit:openCreatePanel');
              window.dispatchEvent(event);
            },
          } : undefined}
        />
      ) : (
        <div className="space-y-8">
          {/* Scheduled Signals */}
          {paginatedScheduled.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-ribbit-hunter-green dark:text-ribbit-dry-sage mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Scheduled
              </h3>
              <ScheduledPolls
                polls={paginatedScheduled}
                currentUserEmail={user.email}
                onDeletePoll={onDeletePoll}
                onUpdatePoll={onUpdatePoll}
              />
            </section>
          )}

          {/* Published Signals */}
          {paginatedPublished.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-ribbit-hunter-green dark:text-ribbit-dry-sage mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-ribbit-fern"></span>
                Published
              </h3>
              <PublishedPolls
                polls={paginatedPublished}
                responses={responses}
                currentUserEmail={user.email}
                onDeletePoll={onDeletePoll}
                onUpdatePoll={onUpdatePoll}
              />
            </section>
          )}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
        itemsPerPageOptions={[10, 20, 50, 100]}
      />

      {/* Analytics Panel (slide-in from right) */}
      <AnalyticsPanel />

      {/* Edit Signal Panel (slide-in from right) */}
      {isEditPanelOpen && editPollData && (
        <EditSignalPanel
          poll={editPollData}
          onUpdate={onUpdatePoll}
          onClose={closeEditPanel}
        />
      )}
    </div>
  );
}
