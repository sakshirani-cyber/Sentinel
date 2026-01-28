/**
 * AnalyticsPanel Component
 * 
 * Slide-in panel for viewing poll analytics.
 * Features:
 * - Slides in from right (matching CreateSignalPanel pattern)
 * - Loading skeleton while data fetches
 * - Donut chart for quick visual overview
 * - Summary stat cards
 * - Response distribution bars
 * - Individual responses table (for non-anonymous polls)
 * - Excel export functionality
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { X, BarChart3, Download, Shield, Clock, CheckCircle, XCircle, PieChart, Users as UsersIcon } from 'lucide-react';
import type { Worksheet, Fill } from 'exceljs';
import saveAs from 'file-saver';

import { useLayout } from '../layout/LayoutContext';
import { Poll, Response } from '../../types';
import LabelText from '../LabelText';
import LabelPill from '../LabelPill';

import AnalyticsSkeleton from './AnalyticsSkeleton';
import DonutChart, { SEGMENT_COLORS } from './DonutChart';
import SummaryCards from './SummaryCards';
import ResponseDistribution from './ResponseDistribution';

interface Label {
  id: string;
  name: string;
  description?: string;
}

/**
 * Main Analytics Panel Component
 */
export default function AnalyticsPanel() {
  const { 
    isAnalyticsPanelOpen, 
    analyticsPoll, 
    analyticsResponses,
    closeAnalyticsPanel 
  } = useLayout();

  const [isLoading, setIsLoading] = useState(true);
  const [labels, setLabels] = useState<Label[]>([]);
  const [fetchedAnalyticsData, setFetchedAnalyticsData] = useState<any | null>(null);

  const poll = analyticsPoll;
  const responses = analyticsResponses;

  // Fetch labels on mount
  useEffect(() => {
    if (!isAnalyticsPanelOpen || !poll) return;
    
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
  }, [isAnalyticsPanelOpen, poll]);

  // Fetch fresh analytics from backend
  useEffect(() => {
    if (!isAnalyticsPanelOpen || !poll) return;
    
    setIsLoading(true);
    
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
      // Simulate minimum loading time for smooth UX
      setTimeout(() => setIsLoading(false), 500);
    };

    fetchBackendResults();
  }, [isAnalyticsPanelOpen, poll]);

  // Reset state when panel closes
  useEffect(() => {
    if (!isAnalyticsPanelOpen) {
      setIsLoading(true);
      setFetchedAnalyticsData(null);
    }
  }, [isAnalyticsPanelOpen]);

  // ESC key handler
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isAnalyticsPanelOpen) {
        closeAnalyticsPanel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isAnalyticsPanelOpen, closeAnalyticsPanel]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isAnalyticsPanelOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAnalyticsPanelOpen]);

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    if (!poll) return null;

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
    const shouldShowIndividualResponses = poll.anonymityMode === 'record' && 
      poll.showIndividualResponses !== false;
    
    const anonymousSkipped = ((poll.anonymityMode === 'anonymous' || !shouldShowIndividualResponses) && effectiveAnonymousReasons)
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

    // Prepare donut chart data
    const donutData = Object.entries(responseCounts).map(([option, count], index) => ({
      label: option,
      value: count,
      percentage: totalResponses > 0 ? (count / totalResponses) * 100 : 0,
      color: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
      isDefault: option === poll.defaultResponse,
      isRemoved: !currentOptionTexts.has(option) && option !== poll.defaultResponse,
    }));

    // Prepare distribution data
    const distributionData = Object.entries(responseCounts).map(([option, count]) => ({
      text: option,
      count,
      percentage: totalResponses > 0 ? (count / totalResponses) * 100 : 0,
      isDefault: option === poll.defaultResponse,
      isRemoved: !currentOptionTexts.has(option) && option !== poll.defaultResponse,
    }));

    return {
      totalConsumers,
      submittedCount,
      responseRate,
      totalResponses,
      defaultsCount,
      skippedCount,
      skippedResponses,
      donutData,
      distributionData,
      currentOptionTexts,
      shouldShowIndividualResponses,
    };
  }, [poll, responses, fetchedAnalyticsData]);

  // Export handler
  const handleExport = async () => {
    if (!poll || !analyticsData) return;

    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Ribbit App';
      workbook.created = new Date();

      const headerFill: Fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0D9488' } // Teal primary color
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
        { metric: 'Total Consumers', value: analyticsData.totalConsumers },
        { metric: 'Response Rate', value: `${analyticsData.responseRate.toFixed(1)}%` },
        { metric: 'Submitted Responses', value: analyticsData.submittedCount },
        { metric: 'System Defaults', value: analyticsData.defaultsCount },
        { metric: 'Skipped Responses', value: analyticsData.skippedCount },
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

      const distributionRows = analyticsData.distributionData.map(item => ({
        option: item.text,
        count: item.count,
        percentage: `${item.percentage.toFixed(1)}%`,
        status: item.isDefault ? 'Default Option' : (item.isRemoved ? 'Removed Option' : 'Active')
      }));
      distSheet.addRows(distributionRows);
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Determine if user can export (is publisher of this poll)
  const canExport = poll?.publisherEmail != null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`analytics-panel-backdrop ${isAnalyticsPanelOpen ? 'open' : ''}`}
        onClick={closeAnalyticsPanel}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className={`analytics-panel ${isAnalyticsPanelOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Signal Analytics"
      >
        {/* Header */}
        <div className="analytics-panel-header">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-foreground">Signal Analytics</h2>
              <p className="text-sm text-foreground-muted truncate">Response breakdown and distribution</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canExport && !isLoading && (
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl transition-all text-sm font-medium shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            )}
            <button
              onClick={closeAnalyticsPanel}
              className="p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Poll Question */}
        {poll && (
          <div className="px-6 py-4 border-b border-border bg-secondary/30 dark:bg-secondary/50">
            <div className="text-foreground font-medium">
              <LabelText text={poll.question} labels={labels} />
            </div>
            {poll.labels && poll.labels.length > 0 && (
              <div className="mt-2">
                <LabelPill labels={poll.labels} />
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="analytics-panel-content">
          {isLoading ? (
            <AnalyticsSkeleton />
          ) : analyticsData && poll ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <SummaryCards
                totalRecipients={analyticsData.totalConsumers}
                responseRate={analyticsData.responseRate}
                submittedCount={analyticsData.submittedCount}
                defaultsCount={analyticsData.defaultsCount}
                skippedCount={analyticsData.skippedCount}
              />

              {/* Donut Chart */}
              <div className="bg-card dark:bg-secondary rounded-xl border border-border p-6">
                <div className="flex items-center gap-2 mb-4">
                  <PieChart className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-semibold text-foreground">Response Overview</h3>
                </div>
                <DonutChart
                  data={analyticsData.donutData}
                  total={analyticsData.totalResponses}
                  centerLabel="Responses"
                />
              </div>

              {/* Response Distribution */}
              <div className="bg-card dark:bg-secondary rounded-xl border border-border p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-semibold text-foreground">Response Distribution</h3>
                </div>
                <ResponseDistribution
                  options={analyticsData.distributionData}
                  labels={labels}
                />
              </div>

              {/* Anonymous Mode Message */}
              {(poll.anonymityMode === 'anonymous' || !analyticsData?.shouldShowIndividualResponses) && (
                <div className="bg-info/10 dark:bg-info/15 border border-info/30 rounded-xl p-6 text-center">
                  <Shield className="w-12 h-12 text-info mx-auto mb-3" />
                  <h4 className="text-info font-semibold mb-2">
                    {poll.anonymityMode === 'anonymous' ? 'Anonymous Poll' : 'Individual Responses Hidden'}
                  </h4>
                  <p className="text-sm text-info/80">
                    {poll.anonymityMode === 'anonymous' 
                      ? 'Individual responses are anonymous. Only aggregate data and masked skip reasons are shown.'
                      : 'Individual responses are hidden. Only aggregate data is shown.'}
                  </p>
                </div>
              )}

              {/* Individual Responses Table (non-anonymous and showIndividualResponses enabled) */}
              {analyticsData?.shouldShowIndividualResponses && responses.length > 0 && (
                <div className="bg-card dark:bg-secondary rounded-xl border border-border overflow-hidden">
                  <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                    <UsersIcon className="w-5 h-5 text-primary" />
                    <h3 className="text-base font-semibold text-foreground">Individual Responses</h3>
                  </div>
                  <div className="divide-y divide-border max-h-[300px] overflow-y-auto">
                    {responses.map((response, index) => (
                      <div key={index} className="px-4 py-3 flex items-center gap-4 hover:bg-muted/50 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-primary">
                            {response.consumerEmail.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {response.consumerEmail}
                          </p>
                          <p className="text-xs text-foreground-muted">
                            {formatDateTime(response.submittedAt)}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          {response.isDefault ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-warning/10 text-warning rounded-full text-xs font-medium">
                              <Clock className="w-3 h-3" />
                              Default
                            </span>
                          ) : response.skipReason ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-destructive/10 text-destructive rounded-full text-xs font-medium">
                              <XCircle className="w-3 h-3" />
                              Skipped
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-success/10 text-success rounded-full text-xs font-medium">
                              <CheckCircle className="w-3 h-3" />
                              {response.response}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skipped Responses with Reasons */}
              {analyticsData.skippedResponses.length > 0 && (
                <div className="bg-card dark:bg-secondary rounded-xl border border-border overflow-hidden">
                  <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-destructive" />
                    <h3 className="text-base font-semibold text-foreground">Skipped with Reasons</h3>
                  </div>
                  <div className="divide-y divide-border max-h-[200px] overflow-y-auto">
                    {analyticsData.skippedResponses.map((response: any, index: number) => (
                      <div key={index} className="px-4 py-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">
                            {poll.anonymityMode === 'anonymous' ? 'Anonymous User' : response.consumerEmail}
                          </span>
                          {response.submittedAt && (
                            <span className="text-xs text-foreground-muted">
                              {formatDateTime(response.submittedAt)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-foreground-secondary italic">
                          "{response.skipReason}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-foreground-muted">
              No poll selected
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="analytics-panel-footer">
          <button
            onClick={closeAnalyticsPanel}
            className="w-full py-3 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl font-medium shadow-lg hover:shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            Close Analytics
          </button>
        </div>
      </aside>
    </>
  );
}
