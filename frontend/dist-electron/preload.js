"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        send: (channel, data) => electron_1.ipcRenderer.send(channel, data),
        on: (channel, func) => electron_1.ipcRenderer.on(channel, (event, ...args) => func(...args)),
        invoke: (channel, ...args) => electron_1.ipcRenderer.invoke(channel, ...args),
    },
    store: {
        get: (key) => electron_1.ipcRenderer.invoke('electron-store-get', key),
        set: (key, value) => electron_1.ipcRenderer.invoke('electron-store-set', key, value),
        delete: (key) => electron_1.ipcRenderer.invoke('electron-store-delete', key),
    }
});
//# sourceMappingURL=preload.js.map