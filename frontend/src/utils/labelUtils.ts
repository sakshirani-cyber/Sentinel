interface Label {
    id: string;
    name: string;
    color: string;
    description?: string;
}

/**
 * Parse labels from text that are stored in ~#labelname~ format
 * Returns array of label names found in the text
 */
export function parseLabelsFromText(text: string): string[] {
    const labelRegex = /~#([^~]+)~/g;
    const matches = text.matchAll(labelRegex);
    return Array.from(matches, match => match[1]);
}

/**
 * Convert text with ~#label~ format to display format with #label
 * Used when displaying text to users
 */
export function convertLabelsForDisplay(text: string): string {
    return text.replace(/~#([^~]+)~/g, '#$1');
}

/**
 * Get label object from label name
 */
export function getLabelByName(labelName: string, labels: Label[]): Label | undefined {
    return labels.find(l => l.name.toLowerCase() === labelName.toLowerCase());
}

/**
 * Split text into segments with labels and plain text
 * Returns array of {type: 'text' | 'label', content: string, label?: Label}
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
        // Add text before the label
        if (match.index > lastIndex) {
            segments.push({
                type: 'text',
                content: text.substring(lastIndex, match.index)
            });
        }

        // Add the label
        const labelName = match[1];
        const label = getLabelByName(labelName, labels);
        segments.push({
            type: 'label',
            content: labelName,
            label: label
        });

        lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
        segments.push({
            type: 'text',
            content: text.substring(lastIndex)
        });
    }

    return segments;
}

/**
 * Remove label markers from text (convert ~#label~ to #label)
 * Useful for editing
 */
export function stripLabelMarkers(text: string): string {
    return text.replace(/~#([^~]+)~/g, '#$1');
}

/**
 * Check if text contains any labels
 */
export function hasLabels(text: string): boolean {
    return /~#([^~]+)~/.test(text);
}
