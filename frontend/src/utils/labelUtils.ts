interface Label {
    id: string;
    name: string;
    color: string;
    description: string;
}

/**
 * Standardizes label name for storage: returns plain text
 * Handles input like "test", "#test", or "~#test~" and returns plain "test"
 */
export function formatLabelName(name: string): string {
    return stripLabelMarkers(name);
}

/**
 * Standardizes label name for UI display: returns plain text
 * Handles input like "~#test~", "test", or "#test" and returns plain "test"
 */
export function parseLabelName(name: string): string {
    return stripLabelMarkers(name);
}

/**
 * Strips all markers (# and ~) to get the raw identifier
 */
export function stripLabelMarkers(name: string): string {
    if (!name) return "";
    let clean = name.trim();
    if (clean.startsWith('~') && clean.endsWith('~')) {
        clean = clean.slice(1, -1);
    }
    if (clean.startsWith('#')) {
        clean = clean.substring(1);
    }
    return clean;
}

/**
 * Parse labels from text that may be stored in ~#labelname~ (old) or #labelname (new) format
 * Returns array of raw label names (WITHOUT markers)
 * Supports both formats for backward compatibility
 */
export function parseLabelsFromText(text: string): string[] {
    if (!text) return [];
    const labels: Set<string> = new Set();
    
    // Match old format: ~#labelname~
    const oldFormatRegex = /~#([^~]+)~/g;
    let match;
    while ((match = oldFormatRegex.exec(text)) !== null) {
        labels.add(match[1]);
    }
    
    // Match new format: #labelname (word boundary to avoid matching in URLs or other contexts)
    const newFormatRegex = /#([a-zA-Z0-9_]+)/g;
    while ((match = newFormatRegex.exec(text)) !== null) {
        // Check if it's not part of the old format (already captured)
        const startPos = match.index;
        if (startPos === 0 || text[startPos - 1] !== '~') {
            labels.add(match[1]);
        }
    }
    
    return Array.from(labels);
}

/**
 * Convert text with ~#label~ format to #label format (for backward compatibility)
 * New format already uses #label, so this mainly handles old data
 */
export function convertLabelsForDisplay(text: string): string {
    if (!text) return "";
    return text.replace(/~#([^~]+)~/g, '#$1');
}

/**
 * Get label object from label name (case-insensitive)
 * name can be raw, with #, or with ~# wrappers
 */
export function getLabelByName(name: string, labels: Label[]): Label | undefined {
    if (!name) return undefined;
    const cleanToFind = stripLabelMarkers(name).toLowerCase();

    return labels.find(l => stripLabelMarkers(l.name).toLowerCase() === cleanToFind);
}

/**
 * Split text into segments with labels and plain text
 * Supports both ~#labelname~ (old) and #labelname (new) formats
 */
export function parseTextSegments(
    text: string,
    labels: Label[]
): Array<{ type: 'text' | 'label'; content: string; label?: Label }> {
    const segments: Array<{ type: 'text' | 'label'; content: string; label?: Label }> = [];
    
    // Combined regex to match both formats: ~#labelname~ or #labelname
    // Priority: old format first, then new format
    const labelRegex = /(~#([^~]+)~|#([a-zA-Z0-9_]+))/g;

    let lastIndex = 0;
    let match;

    while ((match = labelRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            segments.push({
                type: 'text',
                content: text.substring(lastIndex, match.index)
            });
        }

        // Extract label name: match[2] for old format (~#label~), match[3] for new format (#label)
        const labelName = match[2] || match[3];
        const label = getLabelByName(labelName, labels);
        segments.push({
            type: 'label',
            content: labelName,
            label: label
        });

        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        segments.push({
            type: 'text',
            content: text.substring(lastIndex)
        });
    }

    return segments;
}

export function hasLabels(text: string): boolean {
    // Check for both old format (~#label~) and new format (#label)
    return /~#([^~]+)~/.test(text) || /#([a-zA-Z0-9_]+)/.test(text);
}

/**
 * Strips markers from any occurrences of ~#labelName~ in a text string and replaces them with #labelName.
 * New format (#labelName) is left as-is.
 * Useful for plain-text contexts like native notifications.
 */
export function stripMarkersFromText(text: string): string {
    if (!text) return '';
    // Convert old format to new format, leave new format as-is
    return text.replace(/~#([^~]+)~/g, '#$1');
}
