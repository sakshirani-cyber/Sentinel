import { cn } from './ui/utils';
import { parseTextSegments } from '../utils/labelUtils';
import { useState, useEffect } from 'react';

interface Label {
    id: string;
    name: string;
    description?: string;
}

interface LabelTextProps {
    text: string;
    labels?: Label[];
    className?: string;
}

export default function LabelText({ text, labels: propLabels, className = '' }: LabelTextProps) {
    const [fetchedLabels, setFetchedLabels] = useState<Label[]>([]);
    const labels = propLabels || fetchedLabels;

    useEffect(() => {
        if (!propLabels && (window as any).electron?.db) {
            const fetchLabels = async () => {
                try {
                    const result = await (window as any).electron.db.getLabels();
                    setFetchedLabels(result.success ? result.data : []);
                } catch (error) {
                    console.error('Failed to fetch labels in LabelText:', error);
                }
            };
            fetchLabels();
        }
    }, [propLabels]);

    const segments = parseTextSegments(text, labels);

    return (
        <span className={cn("break-all overflow-hidden block", className)}>
            {segments.map((segment, index) => {
                if (segment.type === 'label' && segment.label) {
                    return (
                        <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.85em] font-medium border shadow-sm align-baseline mx-0.5"
                            style={{
                                backgroundColor: '#3b82f620',
                                borderColor: '#3b82f650',
                                color: '#3b82f6', // Default primary color
                            }}
                            title={segment.label.description || segment.label.name}
                        >
                            #{segment.content}
                        </span>
                    );
                }
                return <span key={index} className="break-all max-w-full" style={{ wordBreak: 'break-all' }}>{segment.content}</span>;
            })}
        </span>
    );
}
