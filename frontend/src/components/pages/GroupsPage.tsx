import { PageHeader } from '../layout';
import { EmptyState } from '../signals';
import { Users, UserPlus } from 'lucide-react';

/**
 * GroupsPage Component
 * 
 * Recipient groups management page (coming soon).
 * Will allow publishers to create and manage consumer groups.
 */
export default function GroupsPage() {
  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title="Groups"
        subtitle="Manage recipient groups"
      />

      {/* Coming Soon State */}
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        {/* Icon Container */}
        <div className="w-24 h-24 rounded-full bg-ribbit-dry-sage/40 dark:bg-ribbit-fern/20 flex items-center justify-center mb-6 shadow-lg relative">
          <Users className="w-12 h-12 text-ribbit-hunter-green dark:text-ribbit-dry-sage" />
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-ribbit-fern flex items-center justify-center shadow-md">
            <UserPlus className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-semibold text-ribbit-hunter-green dark:text-ribbit-dry-sage mb-3">
          Groups Coming Soon
        </h3>

        {/* Description */}
        <p className="text-ribbit-pine-teal/70 dark:text-ribbit-dust-grey/70 max-w-md mb-8">
          Create recipient groups to quickly send signals to predefined sets of users.
          Save time by organizing your consumers into teams, departments, or projects.
        </p>

        {/* Feature Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full">
          <FeatureCard
            title="Team Groups"
            description="Organize by team or department"
          />
          <FeatureCard
            title="Quick Send"
            description="Send to entire groups at once"
          />
          <FeatureCard
            title="Smart Sync"
            description="Auto-update from your directory"
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-4 rounded-xl bg-ribbit-dry-sage/30 dark:bg-ribbit-hunter-green/30 border border-ribbit-fern/20 dark:border-ribbit-dry-sage/20 text-center">
      <h4 className="font-medium text-ribbit-hunter-green dark:text-ribbit-dry-sage mb-1">
        {title}
      </h4>
      <p className="text-base text-ribbit-pine-teal/60 dark:text-ribbit-dust-grey/60">
        {description}
      </p>
    </div>
  );
}
