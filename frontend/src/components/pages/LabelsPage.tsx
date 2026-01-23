import { Poll, User } from '../../types';
import { PageHeader } from '../layout';
import LabelManager from '../LabelManager';
import { Tag, Sparkles } from 'lucide-react';

interface LabelsPageProps {
  user: User;
  polls: Poll[];
}

/**
 * LabelsPage Component
 * 
 * Label management page for publishers.
 * Allows creating, editing, and organizing labels.
 */
export default function LabelsPage({ user, polls }: LabelsPageProps) {
  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title="Labels"
        subtitle="Organize your signals with custom labels"
        icon={Tag}
        action={
          <div className="flex items-center gap-2 px-3 py-1.5 bg-ribbit-dry-sage/30 dark:bg-ribbit-fern/20 rounded-full text-sm text-ribbit-hunter-green dark:text-ribbit-dry-sage">
            <Sparkles className="w-4 h-4" />
            <span>Auto-detection enabled</span>
          </div>
        }
      />

      {/* Description Card */}
      <div className="mb-6 p-4 bg-gradient-to-r from-ribbit-dry-sage/20 to-ribbit-fern/10 dark:from-ribbit-hunter-green/40 dark:to-ribbit-fern/20 rounded-xl border border-ribbit-fern/20 dark:border-ribbit-dry-sage/10">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-ribbit-fern/20 dark:bg-ribbit-dry-sage/20 flex items-center justify-center flex-shrink-0">
            <Tag className="w-5 h-5 text-ribbit-hunter-green dark:text-ribbit-dry-sage" />
          </div>
          <div>
            <h3 className="font-medium text-ribbit-hunter-green dark:text-ribbit-dry-sage mb-1">
              How Labels Work
            </h3>
            <p className="text-sm text-ribbit-pine-teal/70 dark:text-ribbit-dust-grey/70">
              Create custom labels to categorize your signals. Use <code className="px-1.5 py-0.5 bg-ribbit-dust-grey/50 dark:bg-ribbit-pine-teal/30 rounded text-xs">#labelname</code> in your signal questions and they'll be automatically detected and applied.
            </p>
          </div>
        </div>
      </div>

      {/* Label Manager */}
      <LabelManager
        onBack={() => {}} // No-op since we use sidebar navigation
        polls={polls}
        user={user}
        hideHeader={true}
      />
    </div>
  );
}
