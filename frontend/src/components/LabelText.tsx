import { parseTextSegments } from '../utils/labelUtils';

interface Label {
    id: string;
    name: string;
    color: string;
    description?: string;
}

interface LabelTextProps {
    text: string;
    labels: Label[];
    className?: string;
}

export default function LabelText({ text, labels, className = '' }: LabelTextProps) {
    const segments = parseTextSegments(text, labels);

    return (
        <span className={className}>
            {segments.map((segment, index) => {
                if (segment.type === 'label' && segment.label) {
                    return (
                        <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-sm font-medium mx-0.5"
                            style={{
                                backgroundColor: `${segment.label.color}20`,
                                color: segment.label.color,
                                border: `1px solid ${segment.label.color}40`
                            }}
                            title={segment.label.description || segment.label.name}
                        >
                            <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: segment.label.color }}
                            />
                            #{segment.content}
                        </span>
                    );
                }
                return <span key={index}>{segment.content}</span>;
            })}
        </span>
    );
}
