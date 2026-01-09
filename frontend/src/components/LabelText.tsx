import { cn } from './ui/utils';
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
        <span className={cn("break-all overflow-hidden block", className)}>
            {segments.map((segment, index) => {
                if (segment.type === 'label' && segment.label) {
                    return (
                        <span
                            key={index}
                            className="inline-flex items-center mx-0.5 rounded-full px-3 py-0.5 border shadow-sm align-baseline"
                            style={{
                                backgroundColor: `${segment.label.color}20`,
                                borderColor: `${segment.label.color}50`,
                                color: segment.label.color,
                                fontSize: '0.9em' // Match font adjustment if any
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
