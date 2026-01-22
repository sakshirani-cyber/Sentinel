import { Poll, Response } from './index';

export interface BackendAPI {
    login: (email: string, password: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    createPoll: (poll: Poll) => Promise<{ success: boolean; data?: { cloudSignalId: number; localId: number }; error?: string }>;
    submitVote: (
        pollId: string,
        cloudSignalId: number | undefined,
        consumerEmail: string,
        response: string,
        defaultResponse?: string,
        skipReason?: string
    ) => Promise<{ success: boolean; error?: string }>;
    getPollResults: (signalId: number) => Promise<{ success: boolean; data?: any; error?: string }>;
    editPoll: (signalId: number, poll: Poll, republish: boolean) => Promise<{ success: boolean; error?: string }>;
    deletePoll: (signalId: number) => Promise<{ success: boolean; error?: string }>;
}

export interface DBAPI {
    getPolls: () => Promise<Poll[]>;
    getResponses: () => Promise<Response[]>;
    createPoll: (poll: Poll) => Promise<{ success: boolean; error?: string }>;
    submitResponse: (response: Response) => Promise<{ success: boolean; error?: string }>;
    deletePoll: (pollId: string) => Promise<{ success: boolean; changes?: number; error?: string }>;

    // Label management
    createLabel: (label: any) => Promise<any>;
    getLabels: () => Promise<any[]>;
    updateLabel: (id: string, updates: any) => Promise<any>;
    deleteLabel: (id: string) => Promise<any>;
}

export interface IpcRendererAPI {
    send: (channel: string, data: any) => void;
    invoke(channel: string, ...args: any[]): Promise<any>;
    on(channel: string, func: (...args: any[]) => void): void;
    once(channel: string, func: (...args: any[]) => void): void;
    removeListener(channel: string, func: (...args: any[]) => void): void;
}

export interface ElectronAPI {
    backend: BackendAPI;
    db: DBAPI;
    ipcRenderer: IpcRendererAPI;
    getDeviceStatus: () => Promise<string>;
}

declare global {
    interface Window {
        electron: ElectronAPI;
    }
}
