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
            getDeviceStatus: () => Promise<string>;
        };
    };
}
