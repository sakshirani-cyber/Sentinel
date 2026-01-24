/**
 * SummaryCards Component
 * 
 * Horizontal row of metric cards showing key analytics stats.
 * Each card has an icon, label, and value with semantic coloring.
 */

import { Users, TrendingUp, CheckCircle, Clock, XCircle, LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  colorClass: string;
}

function SummaryCard({ icon: Icon, label, value, colorClass }: SummaryCardProps) {
  return (
    <div className={`${colorClass} rounded-xl p-4 transition-all duration-200 hover:scale-[1.02]`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 opacity-80" />
        <span className="text-xs font-medium opacity-80">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

interface SummaryCardsProps {
  totalRecipients: number;
  responseRate: number;
  submittedCount: number;
  defaultsCount: number;
  skippedCount: number;
}

export default function SummaryCards({
  totalRecipients,
  responseRate,
  submittedCount,
  defaultsCount,
  skippedCount,
}: SummaryCardsProps) {
  const cards = [
    {
      icon: Users,
      label: 'Recipients',
      value: totalRecipients,
      colorClass: 'bg-info/10 dark:bg-info/15 text-info border border-info/20',
    },
    {
      icon: TrendingUp,
      label: 'Response Rate',
      value: `${responseRate.toFixed(1)}%`,
      colorClass: 'bg-success/10 dark:bg-success/15 text-success border border-success/20',
    },
    {
      icon: CheckCircle,
      label: 'Submitted',
      value: submittedCount,
      colorClass: 'bg-primary/10 dark:bg-primary/15 text-primary border border-primary/20',
    },
    {
      icon: Clock,
      label: 'Defaults',
      value: defaultsCount,
      colorClass: 'bg-warning/10 dark:bg-warning/15 text-warning border border-warning/20',
    },
    {
      icon: XCircle,
      label: 'Skipped',
      value: skippedCount,
      colorClass: 'bg-destructive/10 dark:bg-destructive/15 text-destructive border border-destructive/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {cards.map((card, index) => (
        <SummaryCard
          key={index}
          icon={card.icon}
          label={card.label}
          value={card.value}
          colorClass={card.colorClass}
        />
      ))}
    </div>
  );
}
