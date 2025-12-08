"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const electron_is_dev_1 = __importDefault(require("electron-is-dev"));
let tray = null;
let win = null;
let store;
// Simple icon for tray (16x16 blue circle)
const iconBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFMSURBVDiNpZMxSwNBEIW/vb29JBcQFBELsbATrPwBNv4CK/+Alf9AO0EQrGwsLCwEwUKwsLOxEQQLC0EQbCwUQUQQvLu9nZndsUgOc5dEfM3uzHvfzO4MrLH+V8AYcwI0gQPgEHgCboAr4FJKebcSgDHmGDgFdoEt4BV4AC6Acynl8xKAMWYPOAO2gQ/gHrgFbqSUH0sAxpgGcAzsAJ/APXADXEsp3xcAjDFN4AjYBl6AO+AauJBSvi0CGGN2gUNgC3gG7oBr4FJK+bIIYIzZBw6ATeAJuAWugXMp5esiQB04ADaAR+AWuAHOpZRviwB14BDYBx6AW+AGuJBSvi8C1IFDoBZ4AG6BG+BcSvm+CFAHjoAa8ADcAjfAhZTyfRGgDhwBNeABuAVugHMp5ccigDHmCGgAD8AtcANcSCk/FwGMMUdAA3gAbv8A/FbXX2v9D/gBnqV8VC6kqXwAAAAASUVORK5CYII=';
function createWindow() {
    win = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
        minimizable: true, // Allow minimize by default
        closable: true, // Allow close by default
        movable: true, // Allow dragging by default
        icon: path.join(__dirname, electron_is_dev_1.default ? '../public/logo.png' : '../dist/logo.png')
    });
    if (electron_is_dev_1.default) {
        win.loadURL('http://localhost:3000');
        win.webContents.openDevTools();
    }
    else {
        win.loadFile(path.join(__dirname, '../dist/index.html'));
    }
    // Prevent window from closing, hide instead
    win.on('close', (event) => {
        if (!electron_1.app.isQuitting) {
            event.preventDefault();
            win?.hide();
        }
        return false;
    });
}
electron_1.app.whenReady().then(async () => {
    try {
        const { default: Store } = await Promise.resolve().then(() => __importStar(require('electron-store')));
        store = new Store();
        console.log('Electron Store initialized successfully');
    }
    catch (error) {
        console.error('Failed to initialize Electron Store:', error);
    }
    createWindow();
    // Create system tray
    const icon = electron_1.nativeImage.createFromDataURL(iconBase64);
    tray = new electron_1.Tray(icon);
    const contextMenu = electron_1.Menu.buildFromTemplate([
        {
            label: 'Show App',
            click: () => {
                win?.show();
                win?.focus();
            }
        },
        {
            label: 'Quit',
            click: () => {
                electron_1.app.isQuitting = true;
                electron_1.app.quit();
            }
        }
    ]);
    tray.setToolTip('Sentinel - Signal Enforcement System');
    tray.setContextMenu(contextMenu);
    // Double-click tray icon to show window
    tray.on('double-click', () => {
        win?.show();
        win?.focus();
    });
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
        else {
            win?.show();
        }
    });
    // Device Status Tracking
    console.log('[Device Status] Tracking initialized');
    // Track lock/unlock screen
    electron_1.powerMonitor.on('lock-screen', () => {
        console.log('[Device Status] Screen locked');
    });
    electron_1.powerMonitor.on('unlock-screen', () => {
        console.log('[Device Status] Screen unlocked');
    });
    // Track sleep/wake
    electron_1.powerMonitor.on('suspend', () => {
        console.log('[Device Status] System suspended (sleep)');
    });
    electron_1.powerMonitor.on('resume', () => {
        console.log('[Device Status] System resumed (wake)');
    });
    // Track idle state - check every 30 seconds
    let lastIdleState = 'active';
    setInterval(() => {
        // Check if system has been idle for more than 60 seconds
        const idleState = electron_1.powerMonitor.getSystemIdleState(60);
        if (idleState !== lastIdleState) {
            if (idleState === 'idle') {
                console.log('[Device Status] System is idle (no activity for 60+ seconds)');
            }
            else if (idleState === 'active') {
                console.log('[Device Status] System is active');
            }
            lastIdleState = idleState;
        }
    }, 30000); // Check every 30 seconds
});
electron_1.app.on('window-all-closed', () => {
    // Don't quit on window close - keep running in tray
    if (process.platform !== 'darwin') {
        // Keep app running
    }
});
// IPC Handlers for window control
electron_1.ipcMain.on('set-always-on-top', (_event, shouldBeOnTop) => {
    if (win) {
        win.setAlwaysOnTop(shouldBeOnTop);
        if (shouldBeOnTop) {
            win.show();
            win.focus();
        }
    }
});
electron_1.ipcMain.on('restore-window', () => {
    if (win) {
        if (win.isMinimized()) {
            win.restore();
        }
        win.show();
        win.focus();
    }
});
// Prevent window minimize/close during persistent alert
electron_1.ipcMain.on('set-persistent-alert-active', (_event, isActive) => {
    if (win) {
        win.setMinimizable(!isActive);
        win.setClosable(!isActive);
        win.setMovable(!isActive); // Prevent window from being dragged
        if (isActive) {
            win.setAlwaysOnTop(true, 'screen-saver'); // Highest priority
            win.setFullScreen(true); // Make truly fullscreen
            win.show();
            win.focus();
        }
        else {
            win.setFullScreen(false); // Exit fullscreen
            win.setAlwaysOnTop(false);
            // Re-enable controls after exiting fullscreen/always-on-top
            // This ensures the window frame is correctly restored
            setTimeout(() => {
                if (win) {
                    win.setMinimizable(true);
                    win.setClosable(true);
                    win.setMovable(true); // Re-enable movement
                }
            }, 100);
        }
    }
});
// Store handling
electron_1.ipcMain.handle('electron-store-get', async (_event, key) => {
    console.log(`[IPC] Getting key: ${key}, Store initialized: ${!!store}`);
    if (!store)
        return null;
    const value = store.get(key);
    console.log(`[IPC] Value for ${key}:`, value);
    return value;
});
electron_1.ipcMain.handle('electron-store-set', async (_event, key, value) => {
    console.log(`[IPC] Setting key: ${key}, Store initialized: ${!!store}`);
    if (!store)
        return;
    store.set(key, value);
});
electron_1.ipcMain.handle('electron-store-delete', async (_event, key) => {
    console.log(`[IPC] Deleting key: ${key}`);
    if (!store)
        return;
    store.delete(key);
});
//# sourceMappingURL=main.js.map