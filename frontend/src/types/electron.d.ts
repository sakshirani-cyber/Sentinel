export { };

declare global {
    interface Window {
        electron: {
            ipcRenderer: {
                send: (channel: string, data: any) => void;
                on: (channel: string, func: (...args: any[]) => void) => void;
                invoke: (channel: string, ...args: any[]) => Promise<any>;
            };
            store: {
                get: (key: string) => Promise<any>;
                set: (key: string, value: any) => Promise<void>;
                delete: (key: string) => Promise<void>;
            };
        };
    }
}
