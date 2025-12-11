import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        send: (channel: string, data: any) => ipcRenderer.send(channel, data),
        on: (channel: string, func: (...args: any[]) => void) =>
            ipcRenderer.on(channel, (event, ...args) => func(...args)),
        invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
    },
    db: {
        createPoll: (poll: any) => ipcRenderer.invoke('db-create-poll', poll),
        getPolls: () => ipcRenderer.invoke('db-get-polls'),
        submitResponse: (response: any) => ipcRenderer.invoke('db-submit-response', response),
        getResponses: () => ipcRenderer.invoke('db-get-responses'),
    }
});
