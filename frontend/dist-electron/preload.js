"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        send: (channel, data) => electron_1.ipcRenderer.send(channel, data),
        on: (channel, func) => {
            electron_1.ipcRenderer.on(channel, func);
        },
        removeListener: (channel, func) => {
            electron_1.ipcRenderer.removeListener(channel, func);
        },
        invoke: (channel, ...args) => electron_1.ipcRenderer.invoke(channel, ...args),
    },
    db: {
        createPoll: (poll) => electron_1.ipcRenderer.invoke('db-create-poll', poll),
        getPolls: () => electron_1.ipcRenderer.invoke('db-get-polls'),
        submitResponse: (response) => electron_1.ipcRenderer.invoke('db-submit-response', response),
        getResponses: () => electron_1.ipcRenderer.invoke('db-get-responses'),
        deletePoll: (pollId) => electron_1.ipcRenderer.invoke('db-delete-poll', pollId),
        createLabel: (label) => electron_1.ipcRenderer.invoke('db-create-label', label),
        getLabels: () => electron_1.ipcRenderer.invoke('db-get-labels'),
        updateLabel: (id, updates) => electron_1.ipcRenderer.invoke('db-update-label', { id, updates }),
        deleteLabel: (id) => electron_1.ipcRenderer.invoke('db-delete-label', id),
    },
    backend: {
        createPoll: (poll) => electron_1.ipcRenderer.invoke('backend-create-poll', poll),
        submitVote: (pollId, signalId, userId, selectedOption, defaultResponse, reason) => electron_1.ipcRenderer.invoke('backend-submit-vote', pollId, signalId, userId, selectedOption, defaultResponse, reason),
        getPollResults: (signalId) => electron_1.ipcRenderer.invoke('backend-get-results', signalId),
        editPoll: (signalId, poll, republish) => electron_1.ipcRenderer.invoke('backend-edit-poll', { signalId, poll, republish }),
        deletePoll: (signalId) => electron_1.ipcRenderer.invoke('backend-delete-poll', signalId),
        login: (email, password) => electron_1.ipcRenderer.invoke('backend-login', { email, password }),
    },
    getDeviceStatus: () => electron_1.ipcRenderer.invoke('get-device-status')
});
//# sourceMappingURL=preload.js.map