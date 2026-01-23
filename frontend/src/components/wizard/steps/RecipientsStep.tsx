import { useEffect, useState } from 'react';
import { StepProps } from '../types';
import { Users, Upload, Check, Search, X, UserPlus } from 'lucide-react';

/**
 * Step 4: Recipients
 * 
 * Select who receives the signal:
 * - Search/filter consumers
 * - Select all / deselect all
 * - Import from Excel/CSV
 */
export default function RecipientsStep({ formData, updateFormData, onValidationChange }: StepProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStats, setUploadStats] = useState<{ total: number; new: number } | null>(null);

  // Mock available consumers - in real app from backend
  const availableConsumers = [
    "consumer1@test.com",
    "consumer2@test.com",
    "consumer3@test.com",
    "consumer4@test.com",
    "consumer5@test.com",
    "publisher1@test.com",
    "publisher2@test.com",
    "team@company.com",
    "hr@company.com",
    "admin@company.com",
  ];

  // All consumers including imported ones
  const allConsumers = [...new Set([...availableConsumers, ...formData.consumers])];

  // Filter by search
  const filteredConsumers = allConsumers.filter(email =>
    email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Validate - at least one consumer
  useEffect(() => {
    onValidationChange?.(formData.consumers.length > 0);
  }, [formData.consumers, onValidationChange]);

  const handleToggleConsumer = (email: string) => {
    if (formData.consumers.includes(email)) {
      updateFormData({ consumers: formData.consumers.filter(e => e !== email) });
    } else {
      updateFormData({ consumers: [...formData.consumers, email] });
    }
  };

  const handleSelectAll = () => {
    updateFormData({ consumers: [...new Set([...formData.consumers, ...filteredConsumers])] });
  };

  const handleDeselectAll = () => {
    updateFormData({ consumers: [] });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStats(null);

    try {
      const data = await file.arrayBuffer();
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      const extractedEmails: string[] = [];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      jsonData.forEach((row: any) => {
        if (Array.isArray(row)) {
          row.forEach((cell: any) => {
            if (typeof cell === 'string' && emailRegex.test(cell.trim())) {
              extractedEmails.push(cell.trim());
            }
          });
        }
      });

      const uniqueEmails = [...new Set(extractedEmails)];
      const newEmails = uniqueEmails.filter(email => !formData.consumers.includes(email));

      if (newEmails.length > 0) {
        updateFormData({ consumers: [...formData.consumers, ...newEmails] });
        setUploadStats({ total: uniqueEmails.length, new: newEmails.length });
      }
    } catch (error) {
      console.error('Error parsing file:', error);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-ribbit-dry-sage/40 dark:bg-ribbit-fern/20 flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-ribbit-hunter-green dark:text-ribbit-dry-sage" />
        </div>
        <h2 className="text-xl font-semibold text-ribbit-hunter-green dark:text-ribbit-dry-sage mb-2">
          Who should receive this signal?
        </h2>
        <p className="text-ribbit-pine-teal/70 dark:text-ribbit-dust-grey/70">
          Select recipients or import from a file
        </p>
      </div>

      {/* Import Section */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 px-4 py-2.5 bg-ribbit-dry-sage/30 dark:bg-ribbit-hunter-green/30 border border-ribbit-fern/30 rounded-xl cursor-pointer hover:bg-ribbit-dry-sage/50 dark:hover:bg-ribbit-hunter-green/50 transition-all">
          <Upload className="w-4 h-4 text-ribbit-fern" />
          <span className="text-sm font-medium text-ribbit-pine-teal dark:text-ribbit-dust-grey">
            {isUploading ? 'Processing...' : 'Import Excel/CSV'}
          </span>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isUploading}
          />
        </label>

        {uploadStats && (
          <span className="flex items-center gap-1.5 text-sm text-ribbit-fern">
            <Check className="w-4 h-4" />
            Added {uploadStats.new} new emails
          </span>
        )}
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ribbit-pine-teal/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recipients..."
            className="
              w-full pl-10 pr-4 py-2.5 rounded-xl
              bg-ribbit-dust-grey/50 dark:bg-ribbit-hunter-green/30
              border-2 border-ribbit-fern/30 dark:border-ribbit-dry-sage/20
              text-ribbit-pine-teal dark:text-ribbit-dust-grey
              placeholder:text-ribbit-pine-teal/40
              focus:outline-none focus:ring-4 focus:border-ribbit-fern focus:ring-ribbit-fern/20
            "
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ribbit-pine-teal/40 hover:text-ribbit-pine-teal"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Select All / Deselect */}
        <div className="flex gap-2">
          <button
            onClick={handleSelectAll}
            className="px-4 py-2.5 rounded-xl text-sm font-medium bg-ribbit-fern/10 text-ribbit-fern hover:bg-ribbit-fern/20 transition-all"
          >
            Select All
          </button>
          <button
            onClick={handleDeselectAll}
            disabled={formData.consumers.length === 0}
            className="px-4 py-2.5 rounded-xl text-sm font-medium bg-ribbit-dry-sage/30 text-ribbit-pine-teal hover:bg-ribbit-dry-sage/50 transition-all disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Selected Count */}
      <div className="flex items-center justify-between px-1">
        <span className="text-sm text-ribbit-pine-teal/70 dark:text-ribbit-dust-grey/70">
          {formData.consumers.length} recipient{formData.consumers.length !== 1 ? 's' : ''} selected
        </span>
        <span className="text-xs text-ribbit-pine-teal/50 dark:text-ribbit-dust-grey/50">
          {filteredConsumers.length} shown
        </span>
      </div>

      {/* Consumer List */}
      <div className="border-2 border-ribbit-fern/20 dark:border-ribbit-dry-sage/20 rounded-xl max-h-64 overflow-y-auto">
        {filteredConsumers.length === 0 ? (
          <div className="p-8 text-center">
            <UserPlus className="w-8 h-8 text-ribbit-pine-teal/30 mx-auto mb-2" />
            <p className="text-sm text-ribbit-pine-teal/50 dark:text-ribbit-dust-grey/50">
              {searchQuery ? 'No recipients match your search' : 'No recipients available'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-ribbit-fern/10 dark:divide-ribbit-dry-sage/10">
            {filteredConsumers.map(email => {
              const isSelected = formData.consumers.includes(email);
              const isImported = !availableConsumers.includes(email);

              return (
                <label
                  key={email}
                  className={`
                    flex items-center gap-3 px-4 py-3 cursor-pointer transition-all
                    ${isSelected
                      ? 'bg-ribbit-dry-sage/20 dark:bg-ribbit-fern/10'
                      : 'hover:bg-ribbit-dry-sage/10 dark:hover:bg-ribbit-hunter-green/20'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleConsumer(email)}
                    className="w-4 h-4 rounded border-ribbit-fern/30 text-ribbit-fern focus:ring-ribbit-fern/20"
                  />
                  <span className="flex-1 text-sm text-ribbit-pine-teal dark:text-ribbit-dust-grey">
                    {email}
                  </span>
                  {isImported && (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-ribbit-fern/10 text-ribbit-fern">
                      Imported
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Validation Message */}
      {formData.consumers.length === 0 && (
        <p className="text-sm text-red-500 text-center">
          Please select at least one recipient
        </p>
      )}
    </div>
  );
}
