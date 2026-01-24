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
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 rounded-full text-sm text-primary">
            <Sparkles className="w-4 h-4" />
            <span>Auto-detection enabled</span>
          </div>
        }
      />

      {/* Description Card */}
      <div className="mb-6 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-border">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Tag className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-foreground mb-1">
              How Labels Work
            </h3>
            <p className="text-sm text-foreground-secondary">
              Create custom labels to categorize your signals. Use <code className="px-1.5 py-0.5 bg-muted rounded text-xs">#labelname</code> in your signal questions and they'll be automatically detected and applied.
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
