import { Poll, Response } from '../App';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { X, TrendingUp, Users, Clock, CheckCircle, XCircle, Archive, Download } from 'lucide-react';

interface AnalyticsViewProps {
  poll: Poll;
  responses: Response[];
  onClose: () => void;
  canExport?: boolean;
}

export default function AnalyticsView({ poll, responses, onClose, canExport = false }: AnalyticsViewProps) {
  const totalConsumers = poll.consumers.length;
  const totalResponses = responses.length;

  // Responded = Manual Votes + Manual Skips (exclude system defaults)
  const respondedCount = responses.filter(r => !r.isDefault).length;
  const responseRate = totalConsumers > 0 ? Math.min((respondedCount / totalConsumers) * 100, 100) : 0;

  const submittedResponses = responses.filter(r => !r.isDefault && !r.skipReason);
  const skipManualResponses = responses.filter(r => r.skipReason);
  const defaultResponses = responses.filter(r => r.isDefault && !r.skipReason);

  // Get current option texts for checking orphaned responses
  const currentOptionTexts = new Set(poll.options.map(o => o.text));

  // Count all responses by their value
  const responseCounts = responses.reduce((acc, r) => {
    const key = r.response || 'Unspecified';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Ensure all current poll options are shown in distribution even if 0
  poll.options.forEach(option => {
    if (!(option.text in responseCounts)) {
      responseCounts[option.text] = 0;
    }
  });

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
    console.log('Starting Excel export...');
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Sentinel';
      workbook.lastModifiedBy = 'Sentinel';
      workbook.created = new Date();

      // Define header style explicitly
      const applyHeaderStyle = (cell: ExcelJS.Cell) => {
        cell.font = { bold: true, color: { argb: 'FF000000' }, size: 12 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFF00' } // Solid Yellow
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      };

      // --- Sheet 1: Summary ---
      const wsSummary = workbook.addWorksheet('Summary');
      wsSummary.columns = [
        { header: 'Metric', key: 'metric', width: 25 },
        { header: 'Value', key: 'value', width: 60 }
      ];

      wsSummary.addRows([
        { metric: 'Poll Question', value: poll.question },
        { metric: 'Anonymity Mode', value: poll.anonymityMode.charAt(0).toUpperCase() + poll.anonymityMode.slice(1) },
        { metric: 'Total Consumers', value: totalConsumers },
        { metric: 'Response Rate', value: `${responseRate.toFixed(1)}%` },
        { metric: 'Submitted Votes', value: submittedResponses.length },
        { metric: 'Manual Skips', value: skipManualResponses.length },
        { metric: 'System Defaults', value: defaultResponses.length },
        { metric: 'Generated At', value: new Date().toLocaleString() }
      ]);

      // Apply styles to the first row (headers)
      wsSummary.getRow(1).eachCell((cell) => {
        applyHeaderStyle(cell);
      });

      // --- Sheet 2: Distribution ---
      const wsDistribution = workbook.addWorksheet('Distribution');
      wsDistribution.columns = [
        { header: 'Option', key: 'option', width: 45 },
        { header: 'Count', key: 'count', width: 15 },
        { header: 'Percentage', key: 'percentage', width: 20 },
        { header: 'Status', key: 'status', width: 25 },
        { header: 'Visual Distribution', key: 'visual', width: 35 }
      ];

      const distributionRows = Object.entries(responseCounts).map(([option, count]) => {
        const percentage = totalResponses > 0 ? (count / totalResponses) * 100 : 0;
        const isDefaultOption = option === poll.defaultResponse;
        const isRemoved = !currentOptionTexts.has(option) && !isDefaultOption;

        return {
          option,
          count,
          percentage: percentage / 100,
          status: isDefaultOption ? 'Default Option' : (isRemoved ? 'Removed Option' : 'Active'),
          visual: percentage / 100
        };
      });

      wsDistribution.addRows(distributionRows);

      // Apply styles to headers
      wsDistribution.getRow(1).eachCell((cell) => {
        applyHeaderStyle(cell);
      });

      // Format Percentage columns
      wsDistribution.getColumn('percentage').numFmt = '0.0%';
      wsDistribution.getColumn('visual').numFmt = '0.0%';

      // Add Data Bars
      const distRowCount = distributionRows.length;
      if (distRowCount > 0) {
        wsDistribution.addConditionalFormatting({
          ref: `E2:E${distRowCount + 1}`,
          rules: [
            {
              type: 'dataBar',
              cfvo: [
                { type: 'min', value: 0 },
                { type: 'max', value: 1 }
              ],
              color: { argb: 'FF6659FF' } // Mono-accent
            } as any
          ]
        });
      }

      // --- Sheet 3: Individual Responses ---
      const wsResponses = workbook.addWorksheet('Responses');
      wsResponses.columns = [
        { header: 'Consumer Email', key: 'email', width: 35 },
        { header: 'Response', key: 'response', width: 45 },
        { header: 'Status', key: 'status', width: 20 },
        { header: 'Submitted At', key: 'time', width: 30 },
        { header: 'Skip Reason', key: 'reason', width: 45 }
      ];

      wsResponses.addRows(responses.map(r => ({
        email: poll.anonymityMode === 'anonymous' ? 'Anonymous' : r.consumerEmail,
        response: r.response,
        status: r.isDefault ? 'System Default' : (r.skipReason ? 'Manual Skip' : 'Submitted Vote'),
        time: new Date(r.submittedAt).toLocaleString(),
        reason: r.skipReason || ''
      })));

      // Apply styles to headers
      wsResponses.getRow(1).eachCell((cell) => {
        applyHeaderStyle(cell);
      });

      // Generate file and download
      console.log('Generating Excel buffer...');
      const buffer = await workbook.xlsx.writeBuffer();
      const fileName = `poll_analytics_${poll.id}_${new Date().toISOString().split('T')[0]}.xlsx`;

      console.log('Triggering download for:', fileName);
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, fileName);
      console.log('Excel export complete.');

    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export analytics: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-mono-primary/10 bg-mono-primary/5">
          <div>
            <h2 className="text-mono-text mb-1 text-lg font-medium">Poll Analytics</h2>
            <p className="text-sm text-mono-text/60">{poll.question}</p>
          </div>
          <div className="flex items-center gap-2">
            {canExport && (
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-1.5 bg-mono-primary text-mono-bg rounded-lg hover:bg-mono-accent hover:text-mono-primary transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Export Excel
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-mono-text/60 hover:text-mono-text hover:bg-mono-primary/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-blue-900">Total Consumers</span>
              </div>
              <p className="text-blue-900">{totalConsumers}</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-900">Response Rate</span>
              </div>
              <p className="text-green-900">{responseRate.toFixed(1)}%</p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-purple-900">Submitted Votes</span>
              </div>
              <p className="text-purple-900">{submittedResponses.length}</p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="text-sm text-red-900">Manual Skips</span>
              </div>
              <p className="text-red-900">{skipManualResponses.length}</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <span className="text-sm text-amber-900">System Defaults</span>
              </div>
              <p className="text-amber-900">{defaultResponses.length}</p>
            </div>
          </div>

          {/* Response Distribution */}
          <div className="mb-8">
            <h3 className="text-slate-900 mb-4">Response Distribution</h3>
            <div className="space-y-3">
              {Object.entries(responseCounts).map(([option, count]) => {
                const percentage = totalResponses > 0 ? (count / totalResponses) * 100 : 0;
                const isDefaultOption = option === poll.defaultResponse;

                return (
                  <div key={option} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-700 flex items-center gap-2">
                        {option}
                        {isDefaultOption && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                            Default
                          </span>
                        )}
                        {!currentOptionTexts.has(option) && !isDefaultOption && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs border border-slate-200">
                            <Archive className="w-3 h-3" />
                            Removed
                          </span>
                        )}
                      </span>
                      <span className="text-slate-600">{count} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-mono-primary/10 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-mono-accent h-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Individual Responses (only if not anonymous) */}
          {/* Summary Message (Anonymous Header) */}
          {poll.anonymityMode === 'anonymous' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h4 className="text-blue-900 font-medium">Anonymous Poll Active</h4>
                <p className="text-sm text-blue-700">
                  Individual identities are hidden in reports. aggregate data and reasons are shown below.
                </p>
              </div>
            </div>
          )}

          {/* Individual Responses List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-900">Individual Responses</h3>
              {poll.anonymityMode === 'anonymous' && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
                  Identities Masked
                </span>
              )}
            </div>
            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-100 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm text-slate-700">Consumer</th>
                      <th className="text-left px-4 py-3 text-sm text-slate-700">Response</th>
                      <th className="text-left px-4 py-3 text-sm text-slate-700">Status</th>
                      <th className="text-left px-4 py-3 text-sm text-slate-700">Submitted At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {responses.length > 0 ? (
                      responses.map((response, index) => (
                        <tr key={index} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm text-slate-900 italic">
                            {poll.anonymityMode === 'anonymous' ? 'Anonymous' : response.consumerEmail}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700">
                            {response.response}
                          </td>
                          <td className="px-4 py-3">
                            {response.isDefault ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs">
                                <Clock className="w-3 h-3" />
                                System Default
                              </span>
                            ) : response.skipReason ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                                <XCircle className="w-3 h-3" />
                                Manual Skip
                              </span>
                            ) : (
                              <div className="flex flex-col gap-1 items-start">
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                                  <CheckCircle className="w-3 h-3" />
                                  Submitted Vote
                                </span>
                                {!currentOptionTexts.has(response.response) && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded text-xs">
                                    <Archive className="w-3 h-3" />
                                    Removed Option
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {formatDateTime(response.submittedAt)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
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
                <h4 className="text-slate-700 mb-3">
                  Pending Responses ({poll.consumers.length - responses.length})
                </h4>
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                  {poll.anonymityMode === 'anonymous' ? (
                    <p className="text-sm text-slate-500 italic">
                      Consumer identities are hidden for this anonymous poll.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {poll.consumers
                        .filter(email => !responses.some(r => r.consumerEmail === email))
                        .map(email => (
                          <span
                            key={email}
                            className="px-3 py-1 bg-white border border-slate-300 text-slate-700 rounded-full text-sm"
                          >
                            {email}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Manual Skips with Reasons */}
          {skipManualResponses.length > 0 && (
            <div className="mt-8">
              <h3 className="text-slate-900 mb-4">Manual Skips with Reasons</h3>
              <div className="space-y-3">
                {skipManualResponses.map((response, index) => (
                  <div
                    key={index}
                    className="bg-red-50 border border-red-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm text-red-900 font-medium font-mono">
                        {poll.anonymityMode === 'anonymous' ? `Anonymous-#${index + 1}` : response.consumerEmail}
                      </span>
                      <span className="text-xs text-red-600">
                        {formatDateTime(response.submittedAt)}
                      </span>
                    </div>
                    <p className="text-sm text-red-700 italic">"{response.skipReason}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-mono-primary/10 bg-mono-bg">
          <button
            onClick={onClose}
            className="w-full bg-mono-primary text-mono-bg py-3 rounded-xl hover:bg-mono-accent hover:text-mono-primary transition-all font-medium shadow-lg"
          >
            Close Analytics
          </button>
        </div>
      </div>
    </div>
  );
}

function Shield({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}
