interface Label {
    id: string;
    name: string;
    color: string;
    description?: string;
}

/**
 * Standardizes label name for storage: ensures ~#name~ format
 * Handles input like "test", "#test", or "~#test~"
 */
export function formatLabelName(name: string): string {
    if (!name) return "";
    let clean = name.trim();
    if (clean.startsWith('~') && clean.endsWith('~')) {
        clean = clean.slice(1, -1);
    }
    if (clean.startsWith('#')) {
        clean = clean.substring(1);
    }
    return `~#${clean}~`;
}

/**
 * Standardizes label name for UI display: ensures #name format
 * Handles input like "~#test~", "test", or "#test"
 */
export function parseLabelName(name: string): string {
    if (!name) return "";
    let clean = name.trim();
    if (clean.startsWith('~') && clean.endsWith('~')) {
        clean = clean.slice(1, -1);
    }
    if (!clean.startsWith('#')) {
        clean = `#${clean}`;
    }
    return clean;
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
 * Parse labels from text that are stored in ~#labelname~ format
 * Returns array of raw label names (WITHOUT markers)
 */
export function parseLabelsFromText(text: string): string[] {
    if (!text) return [];
    const labelRegex = /~#([^~]+)~/g;
    const matches = text.matchAll(labelRegex);
    return Array.from(matches, match => match[1]);
}

/**
 * Convert text with ~#label~ format to display format with #label
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
 */
export function parseTextSegments(
    text: string,
    labels: Label[]
): Array<{ type: 'text' | 'label'; content: string; label?: Label }> {
    const segments: Array<{ type: 'text' | 'label'; content: string; label?: Label }> = [];
    const labelRegex = /~#([^~]+)~/g;

    let lastIndex = 0;
    let match;

    while ((match = labelRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            segments.push({
                type: 'text',
                content: text.substring(lastIndex, match.index)
            });
        }

        const labelName = match[1];
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
    return /~#([^~]+)~/.test(text);
}

/**
 * Strips markers from any occurrences of ~#labelName~ in a text string and replaces them with #labelName.
 * Useful for plain-text contexts like native notifications.
 */
export function stripMarkersFromText(text: string): string {
    if (!text) return '';
    return text.replace(/~#([^~]+)~/g, '#$1');
}
