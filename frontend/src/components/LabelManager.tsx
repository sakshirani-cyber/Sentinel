import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Tag, AlertCircle, Pencil, Check, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown, Hash, FileText } from 'lucide-react';
import { User } from '../App';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatLabelName, parseLabelName } from '../utils/labelUtils';

interface Label {
    id: string;
    name: string;
    color: string;
    description: string;
    createdAt: string;
    editedAt?: string;
    cloudId?: number;
}

interface LabelManagerProps {
    onBack: () => void;
    polls: any[];
    user: User;
    /** When true, hides the header (for use within RibbitLayout) */
    hideHeader?: boolean;
}

export default function LabelManager({ onBack, polls, user, hideHeader = false }: LabelManagerProps) {
    const [labels, setLabels] = useState<Label[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);

    // New Label State
    const [newLabelName, setNewLabelName] = useState('');
    const [newLabelDesc, setNewLabelDesc] = useState('');
    const [createError, setCreateError] = useState<string | null>(null);

    // Editing State
    const [editDesc, setEditDesc] = useState('');

    useEffect(() => {
        fetchLabels();
    }, []);

    const fetchLabels = async () => {
        setLoading(true);
        try {
            if ((window as any).electron?.backend) {
                console.log('[LabelManager] Fetching labels...');
                const result = await (window as any).electron.ipcRenderer.invoke('db-get-labels');
                if (result.success) {
                    console.log(`[LabelManager] Fetched ${result.data.length} labels.`);
                    setLabels(result.data);
                }
            }
        } catch (error) {
            console.error('Error fetching labels:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateLabel = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateError(null);

        if (!newLabelName.trim()) {
            setCreateError('Label name is required');
            return;
        }

        if (newLabelName.length > 100) {
            setCreateError('Label name cannot exceed 100 characters');
            return;
        }

        if (newLabelName.includes(' ')) {
            setCreateError('Label name cannot contain spaces');
            return;
        }

        if (newLabelName.includes('~') || newLabelName.includes('#')) {
            setCreateError('Label name cannot contain special characters like ~ or #');
            return;
        }

        if (newLabelDesc.length > 500) {
            setCreateError('Description cannot exceed 500 characters');
            return;
        }

        // Check for duplicate
        const exists = labels.some(l => 
            parseLabelName(l.name).toLowerCase() === newLabelName.toLowerCase()
        );
        if (exists) {
            setCreateError('A label with this name already exists');
            return;
        }

        const newLabel: Label = {
            id: Date.now().toString(),
            name: formatLabelName(newLabelName),
            color: '#588157', // Default fern color (not used in display)
            description: newLabelDesc,
            createdAt: new Date().toISOString()
        };

        try {
            if ((window as any).electron?.backend) {
                console.log('[LabelManager] Creating label (IPC db-create-label)...', newLabel);
                const result = await (window as any).electron.ipcRenderer.invoke('db-create-label', newLabel);
                console.log('[LabelManager] db-create-label result:', result);

                if (result.success) {
                    setIsCreating(false);
                    setNewLabelName('');
                    setNewLabelDesc('');
                    setCreateError(null);
                    fetchLabels();
                } else {
                    setCreateError(result.error);
                }
            }
        } catch (error) {
            console.error('Error creating label:', error);
            setCreateError('Failed to create label');
        }
    };

    const handleCancelCreate = () => {
        setIsCreating(false);
        setNewLabelName('');
        setNewLabelDesc('');
        setCreateError(null);
    };

    const saveEdit = async (labelId: string) => {
        if (editDesc.length > 500) {
            alert('Description cannot exceed 500 characters');
            return;
        }
        try {
            const updates = {
                description: editDesc
            };

            if ((window as any).electron?.backend) {
                console.log(`[LabelManager] Updating label ${labelId} (IPC db-update-label)...`, updates);
                const result = await (window as any).electron.ipcRenderer.invoke('db-update-label', {
                    id: labelId,
                    updates
                });
                console.log('[LabelManager] db-update-label result:', result);

                if (result.success) {
                    fetchLabels();
                    cancelEdit();
                }
            }
        } catch (error) {
            console.error('Error updating label:', error);
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditDesc('');
    };

    const filteredLabels = labels.filter(label =>
        label.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (label.description && label.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Pagination Logic
    const totalPages = Math.ceil(filteredLabels.length / itemsPerPage);
    const paginatedLabels = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredLabels.slice(start, start + itemsPerPage);
    }, [filteredLabels, currentPage, itemsPerPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, itemsPerPage]);

    // Get label usage count
    const getLabelUsageCount = (labelName: string) => {
        return polls.filter(p => p.labels?.includes(labelName)).length;
    };

    return (
        <div className={hideHeader ? '' : 'min-h-screen bg-ribbit-dust-grey dark:bg-ribbit-pine-teal'}>
            {/* Header - Only shown when not embedded in RibbitLayout */}
            {!hideHeader && (
                <header className="bg-ribbit-pine-teal dark:bg-ribbit-forest-deep border-b border-ribbit-hunter-green/30 sticky top-0 z-40 shadow-lg">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-ribbit-dry-sage rounded-xl flex items-center justify-center shadow-lg">
                                    <Tag className="w-6 h-6 text-ribbit-hunter-green" />
                                </div>
                                <div>
                                    <h1 className="text-ribbit-dust-grey font-semibold text-lg">Ribbit</h1>
                                    <p className="text-sm text-ribbit-dust-grey/70">Label Management</p>
                                </div>
                            </div>
                            <button
                                onClick={onBack}
                                className="flex items-center gap-2 px-4 py-2.5 bg-ribbit-dry-sage text-ribbit-hunter-green rounded-xl hover:bg-ribbit-sage-light transition-all shadow-md text-sm font-medium"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Back
                            </button>
                        </div>
                    </div>
                </header>
            )}

            <main className={hideHeader ? '' : 'max-w-7xl mx-auto px-6 lg:px-8 py-8'}>
                {/* Search Bar & Create Button */}
                <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div className="relative w-full sm:max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-ribbit-pine-teal/40 dark:text-ribbit-dust-grey/40" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-12 pr-4 py-3 bg-white dark:bg-ribbit-hunter-green/40 border border-ribbit-fern/20 dark:border-ribbit-dry-sage/20 rounded-xl text-ribbit-pine-teal dark:text-ribbit-dust-grey placeholder-ribbit-pine-teal/40 dark:placeholder-ribbit-dust-grey/40 focus:outline-none focus:ring-2 focus:ring-ribbit-fern/50 focus:border-ribbit-fern transition-all shadow-sm"
                            placeholder="Search labels..."
                        />
                    </div>
                    {!isCreating && (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="flex items-center gap-2 px-5 py-3 bg-ribbit-hunter-green hover:bg-[#2f4a35] text-ribbit-dust-grey rounded-xl transition-all shadow-md font-medium hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Create Label</span>
                        </button>
                    )}
                </div>

                {/* Create Label Card */}
                {isCreating && (
                    <div className="mb-6 animate-fade-in">
                        <div className="bg-white dark:bg-ribbit-hunter-green/40 backdrop-blur-sm border border-ribbit-fern/20 dark:border-ribbit-dry-sage/20 rounded-xl p-6 shadow-lg">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-lg bg-ribbit-fern/20 dark:bg-ribbit-dry-sage/20 flex items-center justify-center">
                                    <Plus className="w-5 h-5 text-ribbit-hunter-green dark:text-ribbit-dry-sage" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-ribbit-hunter-green dark:text-ribbit-dry-sage">Create New Label</h3>
                                    <p className="text-sm text-ribbit-pine-teal/60 dark:text-ribbit-dust-grey/60">Add a label to organize your signals</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Column - Name & Preview */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-ribbit-hunter-green dark:text-ribbit-dry-sage mb-2">
                                            Label Name <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ribbit-pine-teal/40" />
                                            <input
                                                type="text"
                                                value={newLabelName}
                                                onChange={e => {
                                                    const val = e.target.value.replace(/\s/g, '');
                                                    setNewLabelName(val);
                                                    if (e.target.value.includes(' ')) {
                                                        setCreateError('Label name cannot contain spaces');
                                                    } else if (createError === 'Label name cannot contain spaces') {
                                                        setCreateError(null);
                                                    }
                                                }}
                                                placeholder="urgent, review, feedback..."
                                                autoFocus
                                                className="w-full pl-9 pr-4 py-3 bg-ribbit-dust-grey/50 dark:bg-ribbit-pine-teal/30 border border-ribbit-fern/20 dark:border-ribbit-dry-sage/20 rounded-xl text-ribbit-pine-teal dark:text-ribbit-dust-grey placeholder-ribbit-pine-teal/40 dark:placeholder-ribbit-dust-grey/40 focus:outline-none focus:ring-2 focus:ring-ribbit-fern/50"
                                            />
                                        </div>
                                        <p className="text-xs text-ribbit-pine-teal/50 dark:text-ribbit-dust-grey/50 mt-1.5">
                                            No spaces or special characters
                                        </p>
                                    </div>

                                    {/* Preview */}
                                    <div>
                                        <label className="block text-sm font-medium text-ribbit-hunter-green dark:text-ribbit-dry-sage mb-2">
                                            Preview
                                        </label>
                                        <div className="p-4 bg-ribbit-dust-grey/30 dark:bg-ribbit-pine-teal/20 rounded-lg border border-ribbit-fern/10 dark:border-ribbit-dry-sage/10">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-ribbit-dry-sage/40 dark:bg-ribbit-fern/30 border border-ribbit-fern/30 dark:border-ribbit-dry-sage/30 text-ribbit-hunter-green dark:text-ribbit-dry-sage">
                                                <Tag className="w-3.5 h-3.5" />
                                                {newLabelName || 'label-name'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column - Description */}
                                <div>
                                    <label className="block text-sm font-medium text-ribbit-hunter-green dark:text-ribbit-dry-sage mb-2">
                                        <FileText className="w-4 h-4 inline mr-1" />
                                        Description
                                    </label>
                                    <textarea
                                        value={newLabelDesc}
                                        onChange={e => setNewLabelDesc(e.target.value)}
                                        placeholder="Optional description for this label..."
                                        rows={5}
                                        className="w-full px-4 py-3 bg-ribbit-dust-grey/50 dark:bg-ribbit-pine-teal/30 border border-ribbit-fern/20 dark:border-ribbit-dry-sage/20 rounded-xl text-ribbit-pine-teal dark:text-ribbit-dust-grey placeholder-ribbit-pine-teal/40 dark:placeholder-ribbit-dust-grey/40 focus:outline-none focus:ring-2 focus:ring-ribbit-fern/50 resize-none"
                                    />
                                    <p className="text-xs text-ribbit-pine-teal/50 dark:text-ribbit-dust-grey/50 mt-1">
                                        {newLabelDesc.length}/500 characters
                                    </p>
                                </div>
                            </div>

                            {/* Error */}
                            {createError && (
                                <div className="mt-4 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-lg">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>{createError}</span>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-ribbit-fern/10 dark:border-ribbit-dry-sage/10">
                                <button
                                    onClick={handleCancelCreate}
                                    className="px-5 py-2.5 text-ribbit-pine-teal dark:text-ribbit-dust-grey hover:bg-ribbit-dry-sage/30 dark:hover:bg-ribbit-hunter-green/30 rounded-xl transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateLabel}
                                    disabled={!newLabelName.trim()}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-ribbit-hunter-green hover:bg-[#2f4a35] text-ribbit-dust-grey rounded-xl transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                                >
                                    <Check className="w-4 h-4" />
                                    Create Label
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Labels Grid */}
                {loading && labels.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-ribbit-hunter-green/30 rounded-xl shadow-sm border border-ribbit-fern/10 dark:border-ribbit-dry-sage/10">
                        <div className="w-12 h-12 border-3 border-ribbit-fern/20 border-t-ribbit-fern rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-ribbit-pine-teal/60 dark:text-ribbit-dust-grey/60">Loading labels...</p>
                    </div>
                ) : filteredLabels.length === 0 && !isCreating ? (
                    <div className="text-center py-24 bg-white dark:bg-ribbit-hunter-green/30 rounded-xl shadow-sm border border-ribbit-fern/10 dark:border-ribbit-dry-sage/10 flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-ribbit-dry-sage/30 dark:bg-ribbit-fern/20 rounded-full flex items-center justify-center mb-6">
                            <Tag className="w-10 h-10 text-ribbit-hunter-green/40 dark:text-ribbit-dry-sage/40" />
                        </div>
                        <h3 className="text-ribbit-hunter-green dark:text-ribbit-dry-sage text-lg font-semibold mb-2">No Labels Found</h3>
                        <p className="text-ribbit-pine-teal/60 dark:text-ribbit-dust-grey/60 mb-8 max-w-sm mx-auto text-center">
                            {searchQuery ? 'Try a different search term.' : 'Start organizing your signals by creating your first label.'}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={() => setIsCreating(true)}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-ribbit-hunter-green hover:bg-[#2f4a35] text-ribbit-dust-grey rounded-xl transition-all shadow-md font-medium hover:shadow-lg"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Create First Label</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Label Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {paginatedLabels.map((label, index) => {
                                const usageCount = getLabelUsageCount(label.name);
                                
                                return (
                                    <div
                                        key={label.id}
                                        style={{ animationDelay: `${index * 50}ms` }}
                                        className="animate-fade-in-up"
                                    >
                                        <div className="bg-white dark:bg-ribbit-hunter-green/40 backdrop-blur-sm border border-ribbit-fern/20 dark:border-ribbit-dry-sage/20 rounded-xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 group">
                                            {editingId === label.id ? (
                                                /* Edit Mode */
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-ribbit-dry-sage/40 dark:bg-ribbit-fern/30 border border-ribbit-fern/30 dark:border-ribbit-dry-sage/30 text-ribbit-hunter-green dark:text-ribbit-dry-sage">
                                                            <Tag className="w-3.5 h-3.5" />
                                                            {parseLabelName(label.name)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-ribbit-pine-teal/60 dark:text-ribbit-dust-grey/60 mb-1.5">
                                                            Description
                                                        </label>
                                                        <textarea
                                                            value={editDesc}
                                                            onChange={e => setEditDesc(e.target.value)}
                                                            rows={3}
                                                            autoFocus
                                                            className="w-full px-3 py-2 bg-ribbit-dust-grey/50 dark:bg-ribbit-pine-teal/30 border border-ribbit-fern/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ribbit-fern/50 resize-none text-ribbit-pine-teal dark:text-ribbit-dust-grey"
                                                            placeholder="Add a description..."
                                                        />
                                                    </div>
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={cancelEdit}
                                                            className="p-2 text-ribbit-pine-teal/50 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                            title="Cancel"
                                                        >
                                                            <X className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => saveEdit(label.id)}
                                                            className="p-2 text-ribbit-fern hover:text-ribbit-hunter-green hover:bg-ribbit-fern/10 rounded-lg transition-all"
                                                            title="Save"
                                                        >
                                                            <Check className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* View Mode */
                                                <>
                                                    <div className="flex items-start justify-between mb-3">
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-ribbit-dry-sage/40 dark:bg-ribbit-fern/30 border border-ribbit-fern/30 dark:border-ribbit-dry-sage/30 text-ribbit-hunter-green dark:text-ribbit-dry-sage">
                                                            <Tag className="w-3.5 h-3.5" />
                                                            {parseLabelName(label.name)}
                                                        </span>
                                                        <button
                                                            onClick={() => {
                                                                setEditingId(label.id);
                                                                setEditDesc(label.description || '');
                                                            }}
                                                            className="p-2 text-ribbit-pine-teal/40 dark:text-ribbit-dust-grey/40 hover:text-ribbit-hunter-green dark:hover:text-ribbit-dry-sage hover:bg-ribbit-dry-sage/30 dark:hover:bg-ribbit-fern/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                            title="Edit label"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    
                                                    <p className="text-sm text-ribbit-pine-teal/70 dark:text-ribbit-dust-grey/70 line-clamp-2 min-h-[2.5rem]">
                                                        {label.description || <span className="italic opacity-50">No description</span>}
                                                    </p>
                                                    
                                                    <div className="mt-3 pt-3 border-t border-ribbit-fern/10 dark:border-ribbit-dry-sage/10 flex items-center justify-between">
                                                        <span className="text-xs text-ribbit-pine-teal/50 dark:text-ribbit-dust-grey/50">
                                                            Used in {usageCount} signal{usageCount !== 1 ? 's' : ''}
                                                        </span>
                                                        <span className="text-xs text-ribbit-pine-teal/40 dark:text-ribbit-dust-grey/40">
                                                            {new Date(label.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-4 py-4 bg-white dark:bg-ribbit-hunter-green/30 rounded-xl border border-ribbit-fern/10 dark:border-ribbit-dry-sage/10">
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-ribbit-pine-teal/60 dark:text-ribbit-dust-grey/60">
                                        Showing {Math.min(filteredLabels.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(filteredLabels.length, currentPage * itemsPerPage)} of {filteredLabels.length}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-ribbit-pine-teal/60 dark:text-ribbit-dust-grey/60">Per page:</span>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <button className="flex items-center justify-between gap-2 px-3 py-1.5 bg-ribbit-dust-grey/50 dark:bg-ribbit-pine-teal/30 border border-ribbit-fern/20 rounded-lg text-sm hover:border-ribbit-fern/40 transition-all min-w-[60px] text-ribbit-pine-teal dark:text-ribbit-dust-grey">
                                                    <span>{itemsPerPage}</span>
                                                    <ChevronDown className="w-3.5 h-3.5 text-ribbit-pine-teal/40" />
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-24 p-1 bg-white dark:bg-ribbit-hunter-green border border-ribbit-fern/20 shadow-xl rounded-xl z-50">
                                                <div className="flex flex-col gap-0.5">
                                                    {[6, 12, 24, 48].map(size => (
                                                        <button
                                                            key={size}
                                                            onClick={() => setItemsPerPage(size)}
                                                            className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all ${itemsPerPage === size
                                                                ? 'bg-ribbit-fern text-white font-medium'
                                                                : 'text-ribbit-pine-teal/70 dark:text-ribbit-dust-grey/70 hover:bg-ribbit-dry-sage/30'
                                                                }`}
                                                        >
                                                            {size}
                                                        </button>
                                                    ))}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setCurrentPage(1)}
                                        disabled={currentPage === 1}
                                        className="p-2 text-ribbit-pine-teal/50 dark:text-ribbit-dust-grey/50 hover:text-ribbit-hunter-green dark:hover:text-ribbit-dry-sage hover:bg-ribbit-dry-sage/30 dark:hover:bg-ribbit-fern/20 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        title="First page"
                                    >
                                        <ChevronsLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 text-ribbit-pine-teal/50 dark:text-ribbit-dust-grey/50 hover:text-ribbit-hunter-green dark:hover:text-ribbit-dry-sage hover:bg-ribbit-dry-sage/30 dark:hover:bg-ribbit-fern/20 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        title="Previous page"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>

                                    <div className="flex items-center gap-1 px-3 py-1 bg-ribbit-dry-sage/30 dark:bg-ribbit-fern/20 rounded-lg mx-2">
                                        <span className="text-sm font-medium text-ribbit-hunter-green dark:text-ribbit-dry-sage">{currentPage}</span>
                                        <span className="text-sm text-ribbit-pine-teal/40 dark:text-ribbit-dust-grey/40">/</span>
                                        <span className="text-sm text-ribbit-pine-teal/60 dark:text-ribbit-dust-grey/60">{totalPages || 1}</span>
                                    </div>

                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage >= totalPages}
                                        className="p-2 text-ribbit-pine-teal/50 dark:text-ribbit-dust-grey/50 hover:text-ribbit-hunter-green dark:hover:text-ribbit-dry-sage hover:bg-ribbit-dry-sage/30 dark:hover:bg-ribbit-fern/20 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        title="Next page"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(totalPages)}
                                        disabled={currentPage >= totalPages}
                                        className="p-2 text-ribbit-pine-teal/50 dark:text-ribbit-dust-grey/50 hover:text-ribbit-hunter-green dark:hover:text-ribbit-dry-sage hover:bg-ribbit-dry-sage/30 dark:hover:bg-ribbit-fern/20 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        title="Last page"
                                    >
                                        <ChevronsRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
