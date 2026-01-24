import { useState, useMemo, useCallback } from 'react';
import { Poll, Response, User } from '../../types';
import { PageHeader, StatusFilterCards, SearchFilterRow, defaultFilterState } from '../layout';
import type { StatusFilter, SortOption, FilterState } from '../layout';
import IncompletePolls from '../dashboard/IncompletePolls';
import CompletedPolls from '../dashboard/CompletedPolls';
import { EmptyState } from '../signals';
import { AnalyticsPanel } from '../analytics';

interface InboxPageProps {
  user: User;
  polls: Poll[];
  responses: Response[];
  drafts: Record<string, string>;
  onSubmitResponse: (pollId: string, value: string) => Promise<void>;
  onSaveDraft: (pollId: string, value: string) => void;
}

/**
 * InboxPage Component
 * 
 * Consumer inbox showing:
 * - Status filter cards (All, Incomplete, Completed)
 * - Search, filter, and sort controls
 * - Signal list based on selected filter
 */
export default function InboxPage({
  user,
  polls,
  responses,
  drafts,
  onSubmitResponse,
  onSaveDraft,
}: InboxPageProps) {
  // Filter state
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('deadline');
  const [filters, setFilters] = useState<FilterState>(defaultFilterState);

  // Calculate consumer polls
  const consumerPolls = useMemo(() => {
    return polls.filter(p =>
      p.status !== 'scheduled' &&
      p.consumers.some((c: string) => c.toLowerCase() === user.email.toLowerCase())
    );
  }, [polls, user.email]);

  // Split into incomplete and completed
  const { incompletePolls, completedPolls } = useMemo(() => {
    const now = new Date();
    const incomplete: Poll[] = [];
    const completed: Poll[] = [];

    consumerPolls.forEach(p => {
      const hasResponse = responses.some(r => r.pollId === p.id && r.consumerEmail === user.email);
      const isExpired = p.status === 'completed' || new Date(p.deadline) < now;
      
      if (!hasResponse && !isExpired) {
        incomplete.push(p);
      } else {
        completed.push(p);
      }
    });

    // Sort completed by deadline (most recent first)
    completed.sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime());

    return { incompletePolls: incomplete, completedPolls: completed };
  }, [consumerPolls, responses, user.email]);

  // Status counts
  const counts = useMemo(() => ({
    all: consumerPolls.length,
    incomplete: incompletePolls.length,
    completed: completedPolls.length,
  }), [consumerPolls.length, incompletePolls.length, completedPolls.length]);

  // Available filter options
  const availableLabels = useMemo(() => {
    const labels = new Set<string>();
    consumerPolls.forEach(p => {
      p.labels?.forEach((l: string) => labels.add(l));
    });
    return Array.from(labels);
  }, [consumerPolls]);

  const availablePublishers = useMemo(() => {
    const publishers = new Set<string>();
    consumerPolls.forEach(p => {
      if (p.publisherEmail) publishers.add(p.publisherEmail);
    });
    return Array.from(publishers);
  }, [consumerPolls]);

  // Apply search, sort, and filters
  const applyFilters = useCallback((pollList: Poll[]) => {
    let result = [...pollList];

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.question?.toLowerCase().includes(query) ||
        p.publisherEmail?.toLowerCase().includes(query) ||
        p.labels?.some((l: string) => l.toLowerCase().includes(query))
      );
    }

    // Label filter
    if (filters.labels.length > 0) {
      result = result.filter(p =>
        p.labels?.some((l: string) => filters.labels.includes(l))
      );
    }

    // Publisher filter
    if (filters.publishers.length > 0) {
      result = result.filter(p =>
        filters.publishers.includes(p.publisherEmail)
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

  // Get filtered polls based on status filter
  const filteredPolls = useMemo(() => {
    let basePolls: Poll[];
    switch (statusFilter) {
      case 'incomplete':
        basePolls = incompletePolls;
        break;
      case 'completed':
        basePolls = completedPolls;
        break;
      case 'all':
      default:
        basePolls = consumerPolls;
        break;
    }
    return applyFilters(basePolls);
  }, [statusFilter, incompletePolls, completedPolls, consumerPolls, applyFilters]);

  // Determine which component to render based on filter
  const isShowingCompleted = statusFilter === 'completed' || 
    (statusFilter === 'all' && incompletePolls.length === 0);

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title="Inbox"
        subtitle={
          incompletePolls.length > 0
            ? `${incompletePolls.length} signal${incompletePolls.length !== 1 ? 's' : ''} waiting`
            : 'All caught up!'
        }
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
        searchPlaceholder="Search signals..."
        sortValue={sortOption}
        onSortChange={setSortOption}
        filters={filters}
        onFiltersChange={setFilters}
        availableLabels={availableLabels}
        availablePublishers={availablePublishers}
        showFilters={true}
        isPublisher={false}
      />

      {/* Poll List */}
      {filteredPolls.length === 0 ? (
        <EmptyState
          type={statusFilter === 'completed' ? 'completed' : 'inbox'}
          title={searchQuery ? 'No Results Found' : undefined}
          description={searchQuery ? 'Try adjusting your search or filters.' : undefined}
        />
      ) : isShowingCompleted && statusFilter === 'completed' ? (
        <CompletedPolls
          polls={filteredPolls}
          responses={responses}
          user={user}
        />
      ) : (
        <IncompletePolls
          polls={filteredPolls}
          drafts={drafts}
          user={user}
          responses={responses}
          onSubmitResponse={onSubmitResponse}
          onSaveDraft={onSaveDraft}
        />
      )}

      {/* Analytics Panel (slide-in from right) */}
      <AnalyticsPanel />
    </div>
  );
}
