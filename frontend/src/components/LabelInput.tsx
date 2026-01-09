import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { cn } from './ui/utils';

interface Label {
    id: string;
    name: string;
    color: string;
    description?: string;
}

interface LabelInputProps {
    value: string;
    onChange: (value: string) => void;
    labels: Label[];
    placeholder?: string;
    className?: string;
    containerClassName?: string;
    multiline?: boolean;
    id?: string;
}

export default function LabelInput({
    value,
    onChange,
    labels,
    placeholder = '',
    className = '',
    containerClassName = '',
    multiline = false,
    id
}: LabelInputProps) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [hashPosition, setHashPosition] = useState(-1);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Filter labels based on search term
    const filteredLabels = (Array.isArray(labels) ? labels : []).filter(label =>
        label.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Detect # and show dropdown
    const handleInputChange = (newValue: string) => {
        onChange(newValue);

        const cursorPos = inputRef.current?.selectionStart || 0;
        const textBeforeCursor = newValue.substring(0, cursorPos);

        // Find the last # before cursor
        const lastHashIndex = textBeforeCursor.lastIndexOf('#');

        if (lastHashIndex !== -1) {
            // Check if there's a space or start of string before #
            const charBeforeHash = lastHashIndex > 0 ? textBeforeCursor[lastHashIndex - 1] : ' ';
            const isValidHashPosition = charBeforeHash === ' ' || charBeforeHash === '\n' || lastHashIndex === 0;

            if (isValidHashPosition) {
                // Get text after # until cursor
                const textAfterHash = textBeforeCursor.substring(lastHashIndex + 1);

                // Check if there's a space after # (which would end the tag)
                if (!textAfterHash.includes(' ') && !textAfterHash.includes('\n')) {
                    setSearchTerm(textAfterHash);
                    setHashPosition(lastHashIndex);
                    setShowDropdown(true);
                    setSelectedIndex(0);

                    // Calculate dropdown position
                    // if (inputRef.current) {
                    //    const rect = inputRef.current.getBoundingClientRect();
                    //    setDropdownPosition({
                    //        top: rect.bottom + window.scrollY,
                    //        left: rect.left + window.scrollX
                    //    });
                    // }
                    return;
                }
            }
        }

        setShowDropdown(false);
        setHashPosition(-1);
    };

    // Insert label at hash position
    const insertLabel = (label: Label) => {
        if (hashPosition === -1) return;

        const beforeHash = value.substring(0, hashPosition);
        const afterCursor = value.substring(inputRef.current?.selectionStart || 0);

        // Store label with ~#labelname~ format
        const labelTag = `~#${label.name}~`;
        const newValue = beforeHash + labelTag + afterCursor;

        onChange(newValue);
        setShowDropdown(false);
        setHashPosition(-1);

        // Set cursor position after the inserted label
        setTimeout(() => {
            if (inputRef.current) {
                const newCursorPos = beforeHash.length + labelTag.length;
                inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
                inputRef.current.focus();
            }
        }, 0);
    };

    // Handle keyboard navigation
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        // Handle Backspace for atomic tag deletion
        if (e.key === 'Backspace') {
            const cursor = inputRef.current?.selectionStart || 0;
            // Only if no selection and cursor is after a tag
            if (inputRef.current?.selectionEnd === cursor) {
                const textBefore = value.substring(0, cursor);
                const match = textBefore.match(/~#([^~]+)~$/);

                if (match) {
                    e.preventDefault();
                    const tagLength = match[0].length;
                    const newValue = value.substring(0, cursor - tagLength) + value.substring(cursor);
                    onChange(newValue);

                    // Reset dropdown if it was potentially triggered (unlikely here but safe)
                    setShowDropdown(false);
                    setHashPosition(-1);

                    // Update cursor
                    setTimeout(() => {
                        if (inputRef.current) {
                            inputRef.current.setSelectionRange(cursor - tagLength, cursor - tagLength);
                        }
                    }, 0);
                    return;
                }
            }
        }

        if (!showDropdown) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < filteredLabels.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
                break;
            case 'Enter':
                if (filteredLabels.length > 0) {
                    e.preventDefault();
                    insertLabel(filteredLabels[selectedIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setShowDropdown(false);
                setHashPosition(-1);
                break;
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node)
            ) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Scroll selected item into view
    useEffect(() => {
        if (showDropdown && dropdownRef.current) {
            const selectedElement = dropdownRef.current.querySelector(`[data-index="${selectedIndex}"]`);
            selectedElement?.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex, showDropdown]);



    const overlayRef = useRef<HTMLDivElement>(null);

    const handleScroll = () => {
        if (!inputRef.current || !overlayRef.current) return;
        overlayRef.current.scrollTop = inputRef.current.scrollTop;
        overlayRef.current.scrollLeft = inputRef.current.scrollLeft;
    };

    const renderHighlight = () => {
        if (!value) return null;

        const segments = [];
        const regex = /~#([^~]+)~/g;
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(value)) !== null) {
            // Text before match
            if (match.index > lastIndex) {
                const textBefore = value.substring(lastIndex, match.index);
                segments.push(<span key={`text-${lastIndex}`} style={{ color: '#1a1a1a' }}>{textBefore}</span>);
            }

            // The Label
            const labelName = match[1];
            const label = (Array.isArray(labels) ? labels : []).find(l => l.name.toLowerCase() === labelName.toLowerCase());

            if (label) {
                segments.push(
                    <span
                        key={match.index}
                        className="inline-flex items-center mx-0.5 rounded-full px-1.5 py-0 border shadow-sm align-baseline break-words"
                        style={{
                            backgroundColor: `${label.color}20`,
                            borderColor: `${label.color}50`,
                            color: label.color,
                            fontSize: '0.9em', // Slightly smaller
                            // Ensure the width roughly matches by keeping font same
                            // We use inline-flex but ensure baseline alignment
                            boxDecorationBreak: 'clone',
                            WebkitBoxDecorationBreak: 'clone'
                        }}
                    >
                        <span className="opacity-0 select-none">~</span>
                        #{label.name}
                        <span className="opacity-0 select-none">~</span>
                    </span>
                );
            } else {
                segments.push(<span key={`raw-${match.index}`} style={{ color: '#1a1a1a' }}>{match[0]}</span>); // Keep raw if not found
            }

            lastIndex = regex.lastIndex;
        }

        if (lastIndex < value.length) {
            const textAfter = value.substring(lastIndex);
            segments.push(<span key={`text-${lastIndex}`} style={{ color: '#1a1a1a' }}>{textAfter}</span>);
        }

        return segments;
    };

    const InputComponent = multiline ? 'textarea' : 'input';

    return (
        <div className={cn("relative group", containerClassName)}>
            {/* Highlight Overlay */}
            {/* Highlight Overlay */}
            <div
                ref={overlayRef}
                aria-hidden="true"
                className={cn(
                    className,
                    "!bg-transparent !border-transparent absolute inset-0 pointer-events-none select-none",
                    multiline ? "whitespace-pre-wrap break-words" : "whitespace-pre overflow-hidden"
                )}
                style={{
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    lineHeight: 'inherit',
                    padding: undefined, // Allow className padding to apply
                    color: '#1e293b' // Force dark text color
                }}
            >
                {renderHighlight()}
            </div>

            <InputComponent
                id={id}
                ref={inputRef as any}
                type={multiline ? undefined : "text"}
                value={value}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onScroll={handleScroll}
                placeholder={placeholder}
                className={cn(
                    className,
                    "relative z-10 caret-slate-900",
                    // Input must be transparent to show the overlay behind it
                )}
                style={{
                    color: value ? 'transparent' : 'inherit',
                    backgroundColor: 'transparent' // Explicitly force transparency
                }}
                rows={multiline ? 3 : undefined}
                autoComplete="off"
                spellCheck="false"
            />


            {showDropdown && (
                <div
                    ref={dropdownRef}
                    className="absolute z-50 mt-1 w-64 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                    style={{
                        top: multiline ? 'auto' : '100%',
                        left: 0
                    }}
                >
                    <div className="p-2 text-xs text-slate-500 border-b border-slate-200">
                        Select a label or press Esc to cancel
                    </div>
                    {filteredLabels.length > 0 ? (
                        filteredLabels.map((label, index) => (
                            <div
                                key={label.id}
                                data-index={index}
                                onClick={() => insertLabel(label)}
                                className={`px-3 py-2 cursor-pointer flex items-center gap-2 ${index === selectedIndex
                                    ? 'bg-slate-50'
                                    : 'hover:bg-slate-50'
                                    }`}
                            >
                                <span
                                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border shadow-sm"
                                    style={{
                                        backgroundColor: `${label.color}20`,
                                        borderColor: `${label.color}50`,
                                        color: label.color
                                    }}
                                >
                                    {label.name}
                                </span>
                                {label.description && (
                                    <div className="text-xs text-slate-500 truncate flex-1 ml-2">
                                        {label.description}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="p-3 text-sm text-slate-500 text-center">
                            No labels found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
