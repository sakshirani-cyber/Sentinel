import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Plus, Search, Tag, AlertCircle, Pencil, Check, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown } from 'lucide-react';
import logo from '../assets/logo.png';
import { User } from '../App';
import { HexColorPicker, HexColorInput } from "react-colorful";
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
}

export default function LabelManager({ onBack, polls, user }: LabelManagerProps) {
    const [labels, setLabels] = useState<Label[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // New Label State
    const [newLabelName, setNewLabelName] = useState('');
    const [newLabelColor, setNewLabelColor] = useState('#BEF264');
    const [newLabelDesc, setNewLabelDesc] = useState('');
    const [createError, setCreateError] = useState<string | null>(null);

    // Editing State
    const [editColor, setEditColor] = useState('');
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

        if (newLabelName.includes(' ')) {
            setCreateError('Label name cannot contain spaces');
            return;
        }

        const newLabel: Label = {
            id: Date.now().toString(),
            name: formatLabelName(newLabelName), // Format: ~#name~
            color: newLabelColor,
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
                    setNewLabelColor('#BEF264');
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
        setNewLabelColor('#BEF264');
        setCreateError(null);
    };


    const saveEdit = async (labelId: string) => {
        try {
            const updates: any = {
                color: editColor,
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
        setEditColor('');
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

    return (
        <div className="min-h-screen bg-mono-bg">
            {/* Header - Matching PublisherDashboard */}
            <header className="bg-mono-primary border-b border-mono-primary sticky top-0 z-40 shadow-lg">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative w-12 h-12 bg-mono-accent rounded-xl flex items-center justify-center shadow-xl overflow-hidden">
                                <img src={logo} alt="Sentinel Logo" className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h1 className="text-mono-bg">Sentinel</h1>
                                <p className="text-sm text-mono-bg/70">Label Management</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="hidden sm:block text-right mr-4 px-4 py-2 bg-mono-bg/10 backdrop-blur rounded-xl border border-mono-bg/20">
                                <p className="text-sm text-mono-bg">{user.name}</p>
                                <p className="text-xs text-mono-bg/70">{user.email}</p>
                            </div>

                            <button
                                onClick={onBack}
                                className="flex items-center gap-2 px-4 py-2.5 bg-mono-accent text-mono-primary rounded-xl hover:bg-mono-accent/90 transition-all shadow-lg text-sm font-medium"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span className="hidden sm:inline">Back to Dashboard</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Sub-Header / Navigation Tab illusion */}
            <div className="bg-mono-primary/5 border-b border-mono-primary/10">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex gap-2">
                        <div
                            className="flex items-center gap-2 px-6 py-4 border-b-3 border-b-mono-accent text-mono-primary bg-mono-accent/10 transition-all rounded-t-xl"
                        >
                            <Tag className="w-5 h-5" />
                            <span className="font-medium">Manage Labels</span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs bg-mono-accent/30 text-mono-primary">
                                {labels.length}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
                {/* Search Bar */}
                <div className="mb-6 flex justify-between items-center">
                    <div className="relative w-full max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-mono-text/40" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-12 pr-4 py-3 bg-mono-bg border border-mono-primary/10 rounded-xl text-mono-text placeholder-mono-text/40 focus:outline-none focus:ring-2 focus:ring-mono-accent/50 focus:border-mono-accent transition-all shadow-sm"
                            placeholder="Search labels..."
                        />
                    </div>
                    {/* Add Label Button (only visible if not creating) */}
                    {!isCreating && (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="flex items-center gap-2 px-4 py-3 bg-mono-primary text-mono-bg rounded-xl hover:bg-mono-primary/90 transition-all shadow-md font-medium"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Create Label</span>
                        </button>
                    )}
                </div>

                {/* Table Display */}
                {loading && labels.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-mono-primary/5">
                        <div className="w-12 h-12 border-3 border-mono-primary/20 border-t-mono-primary rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-mono-text/60">Loading labels...</p>
                    </div>
                ) : filteredLabels.length === 0 && !isCreating ? (
                    <div className="text-center py-24 bg-white rounded-xl shadow-sm border border-mono-primary/5 flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-mono-primary/5 rounded-full flex items-center justify-center mb-6">
                            <Tag className="w-10 h-10 text-mono-primary/40" />
                        </div>
                        <h3 className="text-mono-text text-lg font-medium mb-2">No Labels Found</h3>
                        <p className="text-mono-text/60 mb-8 max-w-sm mx-auto text-center">
                            {searchQuery ? 'Try a different search term.' : 'Start organizing your polls by creating your first label.'}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={() => setIsCreating(true)}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-mono-accent text-mono-primary rounded-xl hover:bg-mono-accent/90 transition-all shadow-md font-medium"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Create First Label</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="bg-white border border-mono-primary/10 rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-mono-primary/5 border-b border-mono-primary/10">
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-mono-text/60 uppercase tracking-wider w-32 align-middle">
                                            Color
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-mono-text/60 uppercase tracking-wider w-64 align-middle">
                                            Label Name
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-mono-text/60 uppercase tracking-wider align-middle">
                                            Description
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-mono-text/60 uppercase tracking-wider w-32 align-middle">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-mono-primary/10">

                                    {/* Inline Creation Form Row */}
                                    {isCreating && (
                                        <tr className="bg-mono-accent/5">
                                            <td className="px-6 py-4 align-middle">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <div
                                                                className="w-10 h-10 rounded-lg shadow-sm border-2 border-mono-primary/20 ring-2 ring-mono-accent/30 cursor-pointer transition-transform hover:scale-105"
                                                                style={{ backgroundColor: newLabelColor }}
                                                            />
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-3 bg-mono-bg border border-mono-primary/20 shadow-xl rounded-xl">
                                                            <div className="flex flex-col gap-3">
                                                                <HexColorPicker color={newLabelColor} onChange={setNewLabelColor} />
                                                                <div className="flex items-center gap-2 px-2 py-1 rounded-md border border-mono-primary/20 bg-mono-primary/5">
                                                                    <span className="text-sm font-mono text-mono-text/50">#</span>
                                                                    <HexColorInput
                                                                        color={newLabelColor}
                                                                        onChange={setNewLabelColor}
                                                                        className="w-full bg-transparent text-sm font-mono text-mono-text focus:outline-none uppercase"
                                                                        prefixed={false}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                    <span className="text-xs font-mono text-mono-text/40 uppercase">{newLabelColor}</span>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 align-middle">
                                                <input
                                                    type="text"
                                                    value={newLabelName}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        setNewLabelName(val);
                                                        if (val.includes(' ')) {
                                                            setCreateError('Label name cannot contain spaces');
                                                        } else if (createError === 'Label name cannot contain spaces') {
                                                            setCreateError(null);
                                                        }
                                                    }}
                                                    placeholder="Label name..."
                                                    autoFocus
                                                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border shadow-sm focus:outline-none focus:ring-2 focus:ring-mono-accent/50 transition-all placeholder-mono-text/30"
                                                    style={{
                                                        backgroundColor: `${newLabelColor}20`,
                                                        borderColor: `${newLabelColor}50`,
                                                        color: newLabelColor
                                                    }}
                                                />
                                            </td>
                                            <td className="px-6 py-4 align-middle">
                                                <input
                                                    type="text"
                                                    value={newLabelDesc}
                                                    onChange={e => setNewLabelDesc(e.target.value)}
                                                    placeholder="Description (optional)..."
                                                    className="w-full px-3 py-2 bg-mono-bg border border-mono-primary/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-mono-accent/50 focus:border-mono-accent transition-all placeholder-mono-text/30"
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-center align-middle">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={handleCancelCreate}
                                                        className="p-2 text-mono-text/50 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Cancel"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={handleCreateLabel}
                                                        disabled={!newLabelName.trim()}
                                                        className="p-2 text-mono-accent hover:text-mono-accent/80 hover:bg-mono-accent/10 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Save Label"
                                                    >
                                                        <Check className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}

                                    {/* Error Row */}
                                    {isCreating && createError && (
                                        <tr className="bg-red-50/50">
                                            <td colSpan={4} className="px-6 py-3 text-center align-middle">
                                                <div className="flex items-center justify-center gap-2 text-sm text-red-600">
                                                    <AlertCircle className="w-4 h-4" />
                                                    <span>{createError}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}

                                    {/* Label Rows */}
                                    {paginatedLabels.map((label) => (
                                        <tr
                                            key={label.id}
                                            className="hover:bg-mono-primary/[0.02] transition-colors"
                                        >
                                            <td className="px-6 py-4 align-middle">
                                                {editingId === label.id ? (
                                                    <div className="flex flex-col items-center justify-center gap-2">
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <div
                                                                    className="w-10 h-10 rounded-lg shadow-sm border-2 border-mono-primary/20 ring-2 ring-mono-accent/30 cursor-pointer transition-transform hover:scale-105"
                                                                    style={{ backgroundColor: editColor }}
                                                                />
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-3 bg-mono-bg border border-mono-primary/20 shadow-xl rounded-xl">
                                                                <div className="flex flex-col gap-3">
                                                                    <HexColorPicker color={editColor} onChange={setEditColor} />
                                                                    <div className="flex items-center gap-2 px-2 py-1 rounded-md border border-mono-primary/20 bg-mono-primary/5">
                                                                        <span className="text-sm font-mono text-mono-text/50">#</span>
                                                                        <HexColorInput
                                                                            color={editColor}
                                                                            onChange={setEditColor}
                                                                            className="w-full bg-transparent text-sm font-mono text-mono-text focus:outline-none uppercase"
                                                                            prefixed={false}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </PopoverContent>
                                                        </Popover>
                                                        <span className="text-xs font-mono text-mono-text/40 uppercase">{editColor}</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center gap-2">
                                                        <div
                                                            className="w-10 h-10 rounded-lg shadow-sm border-2 border-mono-primary/10"
                                                            style={{ backgroundColor: label.color }}
                                                        />
                                                        <span className="text-xs font-mono text-mono-text/40 uppercase">{label.color}</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 align-middle">
                                                <span
                                                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border shadow-sm"
                                                    style={{
                                                        backgroundColor: editingId === label.id ? `${editColor}20` : `${label.color}20`,
                                                        borderColor: editingId === label.id ? `${editColor}50` : `${label.color}50`,
                                                        color: editingId === label.id ? editColor : label.color
                                                    }}
                                                >
                                                    {parseLabelName(label.name)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 align-middle">
                                                {editingId === label.id ? (
                                                    <input
                                                        type="text"
                                                        value={editDesc}
                                                        onChange={e => setEditDesc(e.target.value)}
                                                        autoFocus
                                                        className="w-full px-3 py-2 bg-mono-bg border border-mono-primary/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-mono-accent/50 focus:border-mono-accent transition-all"
                                                    />
                                                ) : (
                                                    <span className="text-sm text-mono-text/70 block truncate">
                                                        {label.description || <span className="text-mono-text/30 italic">No description</span>}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center align-middle">
                                                {editingId === label.id ? (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={cancelEdit}
                                                            className="p-2 text-mono-text/50 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                            title="Cancel"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => saveEdit(label.id)}
                                                            className="p-2 text-mono-accent hover:text-mono-accent/80 hover:bg-mono-accent/10 rounded-lg transition-all"
                                                            title="Save Changes"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => {
                                                                setEditingId(label.id);
                                                                setEditColor(label.color);
                                                                setEditDesc(label.description || '');
                                                            }}
                                                            className="p-2 text-mono-text/50 hover:text-mono-accent hover:bg-mono-accent/5 rounded-lg transition-all"
                                                            title="Edit Label"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        <div className="px-6 py-4 bg-mono-primary/[0.02] border-t border-mono-primary/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-mono-text/60">
                                    Showing {Math.min(filteredLabels.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(filteredLabels.length, currentPage * itemsPerPage)} of {filteredLabels.length} labels
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-mono-text/60">Rows:</span>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className="flex items-center justify-between gap-2 px-3 py-1.5 bg-white border border-mono-primary/10 rounded-lg text-sm text-mono-primary hover:border-mono-accent/50 hover:bg-mono-accent/5 transition-all min-w-[64px]">
                                                <span>{itemsPerPage}</span>
                                                <ChevronDown className="w-3.5 h-3.5 text-mono-text/40" />
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-24 p-1 bg-white/80 backdrop-blur-xl border border-mono-primary/10 shadow-xl rounded-xl z-50">
                                            <div className="flex flex-col gap-0.5">
                                                {[5, 10, 20, 50, 100].map(size => (
                                                    <button
                                                        key={size}
                                                        onClick={() => setItemsPerPage(size)}
                                                        className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all ${itemsPerPage === size
                                                                ? 'bg-mono-accent text-mono-primary font-medium'
                                                                : 'text-mono-text/70 hover:bg-mono-primary/5 hover:text-mono-primary'
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

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    className="p-2 text-mono-text/50 hover:text-mono-primary hover:bg-mono-primary/5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    title="First Page"
                                >
                                    <ChevronsLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 text-mono-text/50 hover:text-mono-primary hover:bg-mono-primary/5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    title="Previous Page"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>

                                <div className="flex items-center gap-1 px-3 py-1 bg-mono-primary/5 rounded-lg">
                                    <span className="text-sm font-medium text-mono-primary">{currentPage}</span>
                                    <span className="text-sm text-mono-text/40">/</span>
                                    <span className="text-sm text-mono-text/60">{totalPages || 1}</span>
                                </div>

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage >= totalPages}
                                    className="p-2 text-mono-text/50 hover:text-mono-primary hover:bg-mono-primary/5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    title="Next Page"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage >= totalPages}
                                    className="p-2 text-mono-text/50 hover:text-mono-primary hover:bg-mono-primary/5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    title="Last Page"
                                >
                                    <ChevronsRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
