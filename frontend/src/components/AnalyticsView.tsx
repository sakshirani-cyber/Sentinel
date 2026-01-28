/**
 * @deprecated This component is deprecated in favor of the new AnalyticsPanel.
 * 
 * The new analytics system uses a slide-in panel pattern with:
 * - Loading skeleton states
 * - Donut chart visualization
 * - Animated progress bars
 * - Semantic color tokens for light/dark mode
 * 
 * Migration:
 * - Use AnalyticsPanel from '@/components/analytics' instead
 * - Analytics is opened via LayoutContext.openAnalyticsPanel()
 * 
 * This file is kept for backward compatibility with deprecated components
 * like ConsumerDashboard.tsx and will be removed in a future version.
 */

import { Poll, Response } from '../types';
import type { Worksheet, Fill } from 'exceljs';
import { X, TrendingUp, Users, Clock, CheckCircle, XCircle, Archive, Download, Shield, BarChart3, PieChart } from 'lucide-react';
import LabelText from './LabelText';
import LabelPill from './LabelPill';
import { useState, useEffect } from 'react';
import saveAs from 'file-saver';

interface Label {
  id: string;
  name: string;
  description?: string;
}

interface AnalyticsViewProps {
  poll: Poll;
  responses: Response[];
  onClose: () => void;
  canExport?: boolean;
}

export default function AnalyticsView({ poll, responses, onClose, canExport = false }: AnalyticsViewProps) {
  const [labels, setLabels] = useState<Label[]>([]);
  const [fetchedAnalyticsData, setFetchedAnalyticsData] = useState<any | null>(null);

  // Fetch labels on mount
  useEffect(() => {
    const fetchLabels = async () => {
      if ((window as any).electron?.db) {
        try {
          const result = await (window as any).electron.db.getLabels();
          setLabels(result.success ? result.data : []);
        } catch (error) {
          console.error('Failed to fetch labels:', error);
        }
      }
    };
    fetchLabels();
  }, []);

  // Fetch fresh analytics from backend
  useEffect(() => {
    const fetchBackendResults = async () => {
      if (poll.cloudSignalId && (window as any).electron?.backend) {
        try {
          const result = await (window as any).electron.backend.getPollResults(poll.cloudSignalId);
          if (result.success && result.data) {
            setFetchedAnalyticsData(result.data);
          }
        } catch (error) {
          console.error('Failed to fetch backend results:', error);
        }
      }
    };

    if (poll.cloudSignalId) {
      fetchBackendResults();
    }
  }, [poll.cloudSignalId]);

  const totalConsumers = fetchedAnalyticsData?.totalAssigned ?? poll.consumers.length;

  const submittedResponses = responses.filter(r => !r.isDefault && !r.skipReason);
  const defaultResponses = responses.filter(r => r.isDefault);

  const submittedCount = fetchedAnalyticsData
    ? (fetchedAnalyticsData.totalResponded - (fetchedAnalyticsData.defaultCount || 0) - (fetchedAnalyticsData.reasonCount || 0))
    : submittedResponses.length;

  const responseRate = totalConsumers > 0
    ? (submittedCount / totalConsumers) * 100
    : 0;

  const totalResponses = fetchedAnalyticsData ? fetchedAnalyticsData.totalResponded : responses.length;

  const defaultsCount = fetchedAnalyticsData?.defaultCount ?? defaultResponses.length;

  const effectiveAnonymousReasons = fetchedAnalyticsData?.anonymousReasons || poll.anonymousReasons;

  // Determine if individual responses should be hidden
  const hideIndividualResponses = poll.anonymityMode === 'anonymous' || 
    poll.showIndividualResponses === false;

  const anonymousSkipped = (hideIndividualResponses && effectiveAnonymousReasons)
    ? effectiveAnonymousReasons.map((reason: string) => ({
      consumerEmail: 'Anonymous User',
      response: '',
      skipReason: reason,
      submittedAt: '',
      isDefault: false
    }))
    : [];

  const localSkipped = responses.filter(r => r.skipReason);
  const skippedResponses = anonymousSkipped.length > 0 ? anonymousSkipped : localSkipped;
  const skippedCount = fetchedAnalyticsData?.reasonCount ?? skippedResponses.length;

  const currentOptionTexts = new Set(poll.options.map(o => o.text));

  const responseCounts = poll.options.reduce((acc, option) => {
    acc[option.text] = responses.filter(r => r.response === option.text && !r.skipReason).length;
    return acc;
  }, {} as Record<string, number>);

  responses.forEach(r => {
    if (!r.isDefault && !r.skipReason && r.response && !currentOptionTexts.has(r.response)) {
      responseCounts[r.response] = (responseCounts[r.response] || 0) + 1;
    }
  });

  const defaultResponseIsOption = poll.defaultResponse ? currentOptionTexts.has(poll.defaultResponse) : false;
  if (poll.defaultResponse && !defaultResponseIsOption && defaultResponses.length > 0) {
    responseCounts[poll.defaultResponse] = (responseCounts[poll.defaultResponse] || 0) + defaultResponses.length;
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleExport = async () => {
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Ribbit App';
      workbook.created = new Date();

      const headerFill: Fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF588157' } // Fern color
      };
      const headerFont = {
        name: 'Arial',
        sz: 11,
        bold: true,
        color: { argb: 'FFFFFFFF' }
      };

      const applyHeaderStyle = (sheet: Worksheet) => {
        const row = sheet.getRow(1);
        row.eachCell((cell) => {
          cell.fill = headerFill;
          cell.font = headerFont;
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      };

      const summarySheet = workbook.addWorksheet('Summary');
      summarySheet.columns = [
        { header: 'Metric', key: 'metric', width: 30 },
        { header: 'Value', key: 'value', width: 50 },
      ];
      summarySheet.addRows([
        { metric: 'Poll Question', value: poll.question },
        { metric: 'Total Consumers', value: totalConsumers },
        { metric: 'Response Rate', value: `${responseRate.toFixed(1)}%` },
        { metric: 'Submitted Responses', value: submittedCount },
        { metric: 'System Defaults', value: defaultsCount },
        { metric: 'Skipped Responses', value: skippedCount },
        { metric: 'Generated At', value: new Date().toLocaleString() }
      ]);
      applyHeaderStyle(summarySheet);

      const distSheet = workbook.addWorksheet('Distribution');
      distSheet.columns = [
        { header: 'Option', key: 'option', width: 30 },
        { header: 'Count', key: 'count', width: 15 },
        { header: 'Percentage', key: 'percentage', width: 15 },
        { header: 'Status', key: 'status', width: 20 },
      ];

      const distributionData = Object.entries(responseCounts).map(([option, count]) => {
        const percentage = totalResponses > 0 ? (count / totalResponses) * 100 : 0;
        const isDefaultOption = option === poll.defaultResponse;
        const isRemoved = !currentOptionTexts.has(option) && !isDefaultOption;
        return {
          option: option,
          count: count,
          percentage: `${percentage.toFixed(1)}%`,
          status: isDefaultOption ? 'Default Option' : (isRemoved ? 'Removed Option' : 'Active')
        };
      });
      distSheet.addRows(distributionData);
      applyHeaderStyle(distSheet);

      const responsesSheet = workbook.addWorksheet('Responses');
      responsesSheet.columns = [
        { header: 'Consumer Email', key: 'email', width: 40 },
        { header: 'Response', key: 'response', width: 30 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Submitted At', key: 'submittedAt', width: 20 },
        { header: 'Skip Reason', key: 'skipReason', width: 40 },
      ];

      const responsesData = responses.map(r => ({
        email: poll.anonymityMode === 'anonymous' ? 'Anonymous User' : r.consumerEmail,
        response: r.response,
        status: r.isDefault ? 'Default' : (r.skipReason ? 'Skipped' : 'Submitted'),
        submittedAt: new Date(r.submittedAt).toLocaleString(),
        skipReason: r.skipReason || ''
      }));
      responsesSheet.addRows(responsesData);
      applyHeaderStyle(responsesSheet);

      const buffer = await workbook.xlsx.writeBuffer();
      const fileName = `poll_analytics_${poll.id}_${new Date().toISOString().split('T')[0]}.xlsx`;
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, fileName);

    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export analytics');
    }
  };

  // Calculate max count for scaling bars
  const maxCount = Math.max(...Object.values(responseCounts), 1);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-card-solid dark:bg-card-solid rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-border animate-scale-in">
        
        {/* Header */}
        <div className="flex-shrink-0 flex items-start justify-between p-6 border-b border-border bg-secondary/30 dark:bg-secondary">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-primary">Signal Analytics</h2>
                <p className="text-sm text-foreground-muted">Response breakdown and distribution</p>
              </div>
            </div>
            <div className="text-foreground font-medium">
              <LabelText text={poll.question} labels={labels} />
            </div>
            {poll.labels && poll.labels.length > 0 && (
              <div className="mt-2">
                <LabelPill labels={poll.labels} />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 ml-4">
            {canExport && (
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl transition-all text-sm font-medium shadow-md hover:shadow-lg"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-foreground-muted hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <SummaryCard
              icon={Users}
              label="Total Recipients"
              value={totalConsumers}
              color="bg-info/10 dark:bg-info/15 text-info"
              iconColor="text-info"
            />
            <SummaryCard
              icon={TrendingUp}
              label="Response Rate"
              value={`${responseRate.toFixed(1)}%`}
              color="bg-success/10 dark:bg-success/15 text-success"
              iconColor="text-success"
            />
            <SummaryCard
              icon={CheckCircle}
              label="Submitted"
              value={submittedCount}
              color="bg-primary/10 dark:bg-primary/15 text-primary"
              iconColor="text-primary"
            />
            <SummaryCard
              icon={Clock}
              label="System Defaults"
              value={defaultsCount}
              color="bg-warning/10 dark:bg-warning/15 text-warning"
              iconColor="text-warning"
            />
            <SummaryCard
              icon={XCircle}
              label="Skipped"
              value={skippedCount}
              color="bg-destructive/10 dark:bg-destructive/15 text-destructive"
              iconColor="text-destructive"
            />
          </div>

          {/* Response Distribution */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-primary">Response Distribution</h3>
            </div>
            <div className="bg-card dark:bg-secondary rounded-xl border border-border p-4 space-y-4">
              {Object.entries(responseCounts).map(([option, count]) => {
                const percentage = totalResponses > 0 ? (count / totalResponses) * 100 : 0;
                const barWidth = (count / maxCount) * 100;
                const isDefaultOption = option === poll.defaultResponse;
                const isRemoved = !currentOptionTexts.has(option) && !isDefaultOption;

                return (
                  <div key={option} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground flex items-center gap-2 min-w-0 flex-1 font-medium">
                        <LabelText text={option} labels={labels} />
                        {isDefaultOption && (
                          <span className="text-xs bg-warning/10 dark:bg-warning/20 text-warning px-2 py-0.5 rounded-full">
                            Default
                          </span>
                        )}
                        {isRemoved && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted text-foreground-muted rounded-full text-xs border border-border">
                            <Archive className="w-3 h-3" />
                            Removed
                          </span>
                        )}
                      </span>
                      <span className="text-foreground-secondary font-medium ml-4">
                        {count} <span className="text-foreground-muted">({percentage.toFixed(1)}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-primary to-primary-hover h-full rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Individual Responses (only if not anonymous and showIndividualResponses enabled) */}
          {poll.anonymityMode === 'record' && poll.showIndividualResponses !== false && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-ribbit-hunter-green dark:text-ribbit-dry-sage mb-4">Individual Responses</h3>
              <div className="bg-white dark:bg-ribbit-hunter-green/40 rounded-xl border border-ribbit-fern/20 dark:border-ribbit-dry-sage/20 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-ribbit-dry-sage/30 dark:bg-ribbit-hunter-green/60 border-b border-ribbit-fern/20 dark:border-ribbit-dry-sage/20">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-ribbit-hunter-green dark:text-ribbit-dry-sage">Consumer</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-ribbit-hunter-green dark:text-ribbit-dry-sage">Response</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-ribbit-hunter-green dark:text-ribbit-dry-sage">Status</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-ribbit-hunter-green dark:text-ribbit-dry-sage">Submitted At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ribbit-fern/10 dark:divide-ribbit-dry-sage/10">
                      {responses.length > 0 ? (
                        responses.map((response: any, index: number) => (
                          <tr key={index} className="hover:bg-ribbit-dry-sage/10 dark:hover:bg-ribbit-fern/10 transition-colors">
                            <td className="px-4 py-3 text-sm text-ribbit-pine-teal dark:text-ribbit-dust-grey">
                              {response.consumerEmail}
                            </td>
                            <td className="px-4 py-3 text-sm text-ribbit-pine-teal dark:text-ribbit-dust-grey">
                              <LabelText text={response.response} labels={labels} />
                            </td>
                            <td className="px-4 py-3">
                              {response.isDefault ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium">
                                  <Clock className="w-3 h-3" />
                                  Default
                                </span>
                              ) : response.skipReason ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-medium">
                                  <XCircle className="w-3 h-3" />
                                  Skipped
                                </span>
                              ) : (
                                <div className="flex flex-col gap-1 items-start">
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-medium">
                                    <CheckCircle className="w-3 h-3" />
                                    Submitted
                                  </span>
                                  {!currentOptionTexts.has(response.response) && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-ribbit-dry-sage/30 text-ribbit-pine-teal/60 rounded-full text-xs">
                                      <Archive className="w-3 h-3" />
                                      Removed Option
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-ribbit-pine-teal/70 dark:text-ribbit-dust-grey/70">
                              {formatDateTime(response.submittedAt)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-ribbit-pine-teal/50 dark:text-ribbit-dust-grey/50">
                            No responses yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pending Consumers */}
              {poll.consumers.length > responses.length && (
                <div className="mt-6">
                  <h4 className="text-ribbit-hunter-green dark:text-ribbit-dry-sage font-medium mb-3">
                    Pending Responses ({poll.consumers.length - responses.length})
                  </h4>
                  <div className="bg-white dark:bg-ribbit-hunter-green/40 rounded-xl border border-ribbit-fern/20 dark:border-ribbit-dry-sage/20 p-4">
                    <div className="flex flex-wrap gap-2">
                      {poll.consumers
                        .filter(email => !responses.some(r => r.consumerEmail === email))
                        .map(email => (
                          <span
                            key={email}
                            className="px-3 py-1 bg-ribbit-dry-sage/30 dark:bg-ribbit-fern/20 text-ribbit-pine-teal dark:text-ribbit-dust-grey rounded-full text-sm border border-ribbit-fern/10 dark:border-ribbit-dry-sage/10"
                          >
                            {email}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Anonymous Mode Message */}
          {(poll.anonymityMode === 'anonymous' || poll.showIndividualResponses === false) && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 text-center mb-8">
              <Shield className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
              <h4 className="text-blue-900 dark:text-blue-300 font-semibold mb-2">
                {poll.anonymityMode === 'anonymous' ? 'Anonymous Poll' : 'Individual Responses Hidden'}
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                {poll.anonymityMode === 'anonymous' 
                  ? 'Individual responses are anonymous. Only aggregate data and masked skip reasons are shown.'
                  : 'Individual responses are hidden. Only aggregate data is shown.'}
              </p>
            </div>
          )}

          {/* Skipped Responses with Reasons */}
          {skippedResponses.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-ribbit-hunter-green dark:text-ribbit-dry-sage mb-4">Skipped with Reasons</h3>
              <div className="space-y-3">
                {skippedResponses.map((response: any, index: number) => (
                  <div
                    key={index}
                    className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-medium text-red-900 dark:text-red-300">
                        {poll.anonymityMode === 'anonymous' ? 'Anonymous User' : response.consumerEmail}
                      </span>
                      {response.submittedAt && (
                        <span className="text-xs text-red-600 dark:text-red-400">
                          {formatDateTime(response.submittedAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-red-700 dark:text-red-400 italic">"{response.skipReason}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-6 border-t border-ribbit-fern/20 dark:border-ribbit-dry-sage/20 bg-ribbit-dust-grey/50 dark:bg-ribbit-hunter-green/50">
          <button
            onClick={onClose}
            className="w-full bg-ribbit-hunter-green hover:bg-[#2f4a35] text-ribbit-dust-grey py-3 rounded-xl transition-all font-medium shadow-lg hover:shadow-xl"
          >
            Close Analytics
          </button>
        </div>
      </div>
    </div>
  );
}

// Summary Card Component
function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
  iconColor,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  color: string;
  iconColor: string;
}) {
  return (
    <div className={`${color} border rounded-xl p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-5 h-5 ${iconColor}`} />
        <span className="text-sm">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
