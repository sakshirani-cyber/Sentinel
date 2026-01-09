import { useState, useEffect } from 'react';

interface Label {
    id: string;
    name: string;
    color: string;
    description?: string;
}

interface LabelPillProps {
    labels: string[] | undefined; // Array of label names from poll.labels
    className?: string;
}

export default function LabelPill({ labels, className = '' }: LabelPillProps) {
    const [labelData, setLabelData] = useState<Label[]>([]);

    // Fetch label data on mount
    useEffect(() => {
        const fetchLabels = async () => {
            if ((window as any).electron?.db) {
                try {
                    const result = await (window as any).electron.db.getLabels();
                    setLabelData(result.success ? result.data : []);
                } catch (error) {
                    console.error('Failed to fetch labels:', error);
                }
            }
        };
        fetchLabels();
    }, []);

    if (!labels || labels.length === 0) {
        return null;
    }

    return (
        <div className={`flex flex-wrap gap-1.5 ${className}`}>
            {labels.map((labelName) => {
                const labelObj = labelData.find(l => l.name === labelName);
                const color = labelObj?.color || '#3b82f6';

                return (
                    <span
                        key={labelName}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border shadow-sm"
                        style={{
                            backgroundColor: `${color}20`,
                            borderColor: `${color}50`,
                            color: color
                        }}
                        title={labelObj?.description || labelName}
                    >
                        #{labelName}
                    </span>
                );
            })}
        </div>
    );
}
