import { useEffect, useState } from 'react';
import { StepProps } from '../types';
import { Users, Upload, Check, X, UserPlus } from 'lucide-react';
import { CheckboxSimple } from '../../ui/Checkbox';

/**
 * Step 4: Recipients
 * 
 * Select who receives the signal:
 * - Search/filter consumers
 * - Select all / deselect all
 * - Import from Excel/CSV
 * 
 * Uses semantic CSS variables for consistent light/dark mode theming.
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
        <div className="w-16 h-16 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Who should receive this signal?
        </h2>
        <p className="text-foreground-secondary">
          Select recipients or import from a file
        </p>
      </div>

      {/* Import Section */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="
          flex items-center gap-2 px-4 py-2.5 
          bg-secondary dark:bg-muted 
          border border-border 
          rounded-xl cursor-pointer 
          hover:bg-secondary-hover dark:hover:bg-muted/80 
          hover:border-primary/40
          transition-all duration-200
        ">
          <Upload className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
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
          <span className="flex items-center gap-1.5 text-sm text-success font-medium">
            <Check className="w-4 h-4" />
            Added {uploadStats.new} new emails
          </span>
        )}
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search - No search icon, just input with clear button on right */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recipients..."
            className="
              w-full h-10 pl-4 pr-10 rounded-xl
              bg-muted/50 dark:bg-muted/30
              border border-border
              text-foreground text-sm
              placeholder:text-muted-foreground
              focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:bg-background
              hover:border-primary/40 hover:bg-muted/70 dark:hover:bg-muted/50
              transition-all duration-200
            "
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Select All / Deselect */}
        <div className="flex gap-2">
          <button
            onClick={handleSelectAll}
            className="
              px-4 py-2.5 rounded-xl text-sm font-medium 
              bg-primary/10 dark:bg-primary/15 
              text-primary 
              hover:bg-primary/20 dark:hover:bg-primary/25 
              transition-all duration-200
            "
          >
            Select All
          </button>
          <button
            onClick={handleDeselectAll}
            disabled={formData.consumers.length === 0}
            className="
              px-4 py-2.5 rounded-xl text-sm font-medium 
              bg-secondary dark:bg-muted 
              text-foreground-secondary
              hover:bg-secondary-hover dark:hover:bg-muted/80 
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            Clear
          </button>
        </div>
      </div>

      {/* Selected Count */}
      <div className="flex items-center justify-between px-1">
        <span className="text-sm text-foreground-secondary">
          <span className="font-semibold text-foreground">{formData.consumers.length}</span> recipient{formData.consumers.length !== 1 ? 's' : ''} selected
        </span>
        <span className="text-xs text-muted-foreground">
          {filteredConsumers.length} shown
        </span>
      </div>

      {/* Consumer List */}
      <div className="border-2 border-border rounded-xl max-h-64 overflow-y-auto bg-card">
        {filteredConsumers.length === 0 ? (
          <div className="p-8 text-center">
            <UserPlus className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'No recipients match your search' : 'No recipients available'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredConsumers.map(email => {
              const isSelected = formData.consumers.includes(email);
              const isImported = !availableConsumers.includes(email);

              return (
                <div
                  key={email}
                  onClick={() => handleToggleConsumer(email)}
                  className={`
                    flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-150
                    ${isSelected
                      ? 'bg-primary/5 dark:bg-primary/10'
                      : 'hover:bg-muted dark:hover:bg-muted/50'
                    }
                  `}
                >
                  {/* Custom Checkbox */}
                  <CheckboxSimple
                    checked={isSelected}
                    onChange={() => handleToggleConsumer(email)}
                    size="md"
                  />
                  
                  {/* Email */}
                  <span className={`flex-1 text-sm transition-colors ${
                    isSelected ? 'text-foreground font-medium' : 'text-foreground-secondary'
                  }`}>
                    {email}
                  </span>
                  
                  {/* Imported Badge */}
                  {isImported && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      Imported
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Validation Message */}
      {formData.consumers.length === 0 && (
        <p className="text-sm text-destructive text-center font-medium">
          Please select at least one recipient
        </p>
      )}
    </div>
  );
}
