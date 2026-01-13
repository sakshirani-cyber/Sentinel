export { };

declare global {
    interface Window {
        electron: {
            ipcRenderer: {
                send: (channel: string, data: any) => void;
                on: (channel: string, func: (...args: any[]) => void) => void;
                invoke: (channel: string, ...args: any[]) => Promise<any>;
            };
            db: {
                createPoll: (poll: any) => Promise<{ success: boolean; error?: string }>;
                getPolls: () => Promise<any[]>;
                submitResponse: (response: any) => Promise<{ success: boolean; error?: string }>;
                getResponses: () => Promise<any[]>;
                createLabel: (label: any) => Promise<any>;
                getLabels: () => Promise<any[]>;
                updateLabel: (id: string, updates: any) => Promise<any>;
                deleteLabel: (id: string) => Promise<any>;
            };
            backend: {
                createPoll: (poll: any) => Promise<{ success: boolean; error?: string; signalId?: number }>;
                submitVote: (pollId: string, signalId: number, userId: string, selectedOption?: string, defaultResponse?: string, reason?: string) => Promise<{ success: boolean; error?: string }>;
                getPollResults: (signalId: number) => Promise<{ success: boolean; data?: any; error?: string }>;
                editPoll: (signalId: number, poll: any, republish: boolean) => Promise<{ success: boolean; error?: string }>;
                deletePoll: (signalId: number) => Promise<{ success: boolean; error?: string }>;
                login: (email: string, password: string) => Promise<{ success: boolean; data?: any; error?: string }>;
            };
            getDeviceStatus: () => Promise<string>;
        };
    };
}
