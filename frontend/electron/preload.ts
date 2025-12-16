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
        deletePoll: (pollId: string) => ipcRenderer.invoke('db-delete-poll', pollId),
    },
    backend: {
        createPoll: (poll: any) => ipcRenderer.invoke('backend-create-poll', poll),
        submitVote: (signalId: number, userId: string, selectedOption: string) =>
            ipcRenderer.invoke('backend-submit-vote', { signalId, userId, selectedOption }),
        getPollResults: (signalId: number) => ipcRenderer.invoke('backend-get-results', signalId),
        editPoll: (signalId: number, poll: any, republish: boolean) =>
            ipcRenderer.invoke('backend-edit-poll', { signalId, poll, republish }),
        deletePoll: (signalId: number) => ipcRenderer.invoke('backend-delete-poll', signalId),
        login: (email: string, password: string) => ipcRenderer.invoke('backend-login', { email, password }),
    },
    getDeviceStatus: () => ipcRenderer.invoke('get-device-status')
});
