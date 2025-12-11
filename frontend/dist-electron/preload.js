"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        send: (channel, data) => electron_1.ipcRenderer.send(channel, data),
        on: (channel, func) => electron_1.ipcRenderer.on(channel, (event, ...args) => func(...args)),
        invoke: (channel, ...args) => electron_1.ipcRenderer.invoke(channel, ...args),
    },
    db: {
        createPoll: (poll) => electron_1.ipcRenderer.invoke('db-create-poll', poll),
        getPolls: () => electron_1.ipcRenderer.invoke('db-get-polls'),
        submitResponse: (response) => electron_1.ipcRenderer.invoke('db-submit-response', response),
        getResponses: () => electron_1.ipcRenderer.invoke('db-get-responses'),
    }
});
//# sourceMappingURL=preload.js.map