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
const db_1 = require("./db");
const backendApi = __importStar(require("./backendApi"));
// Set app name for notifications (Windows/macOS/Linux)
electron_1.app.setName('Sentinel');
// Set AppUserModelId for Windows notifications to show correct app name
if (process.platform === 'win32') {
    electron_1.app.setAppUserModelId('Sentinel');
}
let tray = null;
let win = null;
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
    // Remove menu bar
    win.setMenuBarVisibility(false);
    // Disable DevTools shortcuts - DISABLED for debugging
    // win.webContents.on('before-input-event', (event, input) => {
    //     if (input.control && input.shift && input.key.toLowerCase() === 'i') {
    //         event.preventDefault();
    //     }
    //     if (input.key === 'F12') {
    //         event.preventDefault();
    //     }
    // });
    if (electron_is_dev_1.default) {
        win.loadURL('http://localhost:3000');
        win.webContents.openDevTools(); // Re-enabled per user request
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
function setupAutoLaunch() {
    // Windows & macOS
    if (process.platform === 'darwin' || process.platform === 'win32') {
        electron_1.app.setLoginItemSettings({
            openAtLogin: true,
            path: electron_1.app.getPath('exe')
        });
    }
    // Linux
    if (process.platform === 'linux') {
        try {
            const fs = require('fs');
            const os = require('os');
            const autostartDir = path.join(os.homedir(), '.config', 'autostart');
            if (!fs.existsSync(autostartDir)) {
                fs.mkdirSync(autostartDir, { recursive: true });
            }
            const desktopFile = path.join(autostartDir, 'sentinel.desktop');
            const content = `[Desktop Entry]
Type=Application
Name=Sentinel
Exec=${electron_1.app.getPath('exe')}
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
Comment=Sentinel Signal Enforcement
`;
            fs.writeFileSync(desktopFile, content);
        }
        catch (error) {
            console.error('Failed to set up Linux autostart:', error);
        }
    }
}
electron_1.app.whenReady().then(async () => {
    try {
        (0, db_1.initDB)();
        // ========================================================================
        // Backend API IPC Handlers (bypass CORS by making calls from main process)
        // ========================================================================
        electron_1.ipcMain.handle('backend-create-poll', async (_event, poll) => {
            try {
                const result = await backendApi.createPoll(poll);
                return { success: true, data: result };
            }
            catch (error) {
                console.error('Backend API - Create Poll Error:', error.message);
                return { success: false, error: error.message };
            }
        });
        electron_1.ipcMain.handle('backend-submit-vote', async (_event, { signalId, userId, selectedOption }) => {
            try {
                await backendApi.submitVote(signalId, userId, selectedOption);
                return { success: true };
            }
            catch (error) {
                console.error('Backend API - Submit Vote Error:', error.message);
                return { success: false, error: error.message };
            }
        });
        electron_1.ipcMain.handle('backend-get-results', async (_event, signalId) => {
            try {
                const result = await backendApi.getPollResults(signalId);
                return { success: true, data: result };
            }
            catch (error) {
                console.error('Backend API - Get Results Error:', error.message);
                return { success: false, error: error.message };
            }
        });
        electron_1.ipcMain.handle('backend-edit-poll', async (_event, { signalId, poll, republish }) => {
            try {
                await backendApi.editPoll(signalId, poll, republish);
                return { success: true };
            }
            catch (error) {
                console.error('Backend API - Edit Poll Error:', error.message);
                return { success: false, error: error.message };
            }
        });
        electron_1.ipcMain.handle('backend-delete-poll', async (_event, signalId) => {
            try {
                await backendApi.deletePoll(signalId);
                return { success: true };
            }
            catch (error) {
                console.error('Backend API - Delete Poll Error:', error.message);
                return { success: false, error: error.message };
            }
        });
        electron_1.ipcMain.handle('backend-login', async (_event, { email, password }) => {
            console.log('[IPC Handler] backend-login called:', email);
            try {
                const role = await backendApi.login(email, password);
                console.log('[IPC Handler] backend-login success, role:', role);
                return { success: true, data: role };
            }
            catch (error) {
                console.error('[IPC Handler] backend-login error:', error.message);
                return { success: false, error: error.message };
            }
        });
        electron_1.ipcMain.handle('backend-get-active-polls', async (_event, userEmail) => {
            try {
                const polls = await backendApi.getActivePolls(userEmail);
                return { success: true, data: polls };
            }
            catch (error) {
                console.error('Backend API - Get Active Polls Error:', error.message);
                return { success: false, error: error.message };
            }
        });
    }
    catch (error) {
        console.error('Failed to initialize Database:', error);
    }
    setupAutoLaunch();
    createWindow();
    // Prevent Cmd+Q on macOS
    electron_1.app.on('before-quit', (event) => {
        if (!electron_1.app.isQuitting) {
            event.preventDefault();
        }
    });
    // Create system tray
    const icon = electron_1.nativeImage.createFromDataURL(iconBase64);
    tray = new electron_1.Tray(icon);
    const contextMenu = electron_1.Menu.buildFromTemplate([
        {
            label: 'Show Sentinel',
            click: () => {
                win?.show();
                win?.focus();
            }
        },
        {
            label: 'Status: Active',
            enabled: false
        }
        // Removed Quit option to prevent user from stopping the app
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
    let currentDeviceStatus = 'active';
    console.log('[Device Status] Tracking initialized');
    // Track lock/unlock screen
    electron_1.powerMonitor.on('lock-screen', () => {
        currentDeviceStatus = 'locked';
        console.log('[Device Status] Screen locked');
    });
    electron_1.powerMonitor.on('unlock-screen', () => {
        currentDeviceStatus = 'active';
        console.log('[Device Status] Screen unlocked');
    });
    // Track sleep/wake
    electron_1.powerMonitor.on('suspend', () => {
        currentDeviceStatus = 'sleep';
        console.log('[Device Status] System suspended (sleep)');
    });
    electron_1.powerMonitor.on('resume', () => {
        currentDeviceStatus = 'active';
        console.log('[Device Status] System resumed (wake)');
    });
    // Track idle state - check every 30 seconds
    setInterval(() => {
        // Check if system has been idle for more than 60 seconds
        const idleState = electron_1.powerMonitor.getSystemIdleState(60);
        if (currentDeviceStatus !== 'locked' && currentDeviceStatus !== 'sleep') {
            if (idleState === 'idle') {
                currentDeviceStatus = 'idle';
                console.log('[Device Status] System is idle');
            }
            else if (idleState === 'active' && currentDeviceStatus === 'idle') {
                currentDeviceStatus = 'active';
                console.log('[Device Status] System is active');
            }
        }
    }, 30000);
    electron_1.ipcMain.handle('get-device-status', () => {
        return currentDeviceStatus;
    });
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
            win.setKiosk(true); // Strict fullscreen (Kiosk mode)
            win.show();
            win.focus();
        }
        else {
            win.setKiosk(false); // Exit kiosk mode
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
// DB Handlers
electron_1.ipcMain.handle('db-create-poll', async (_event, poll) => {
    try {
        (0, db_1.createPoll)(poll);
        return { success: true };
    }
    catch (error) {
        console.error('Error creating poll:', error);
        return { success: false, error: error.message };
    }
});
electron_1.ipcMain.handle('db-get-polls', async () => {
    try {
        return (0, db_1.getPolls)();
    }
    catch (error) {
        console.error('Error getting polls:', error);
        return [];
    }
});
electron_1.ipcMain.handle('db-submit-response', async (_event, response) => {
    try {
        (0, db_1.submitResponse)(response);
        return { success: true };
    }
    catch (error) {
        console.error('Error submitting response:', error);
        return { success: false, error: error.message };
    }
});
electron_1.ipcMain.handle('db-get-responses', async () => {
    try {
        return (0, db_1.getResponses)();
    }
    catch (error) {
        console.error('Error getting responses:', error);
        return [];
    }
});
electron_1.ipcMain.handle('db-update-poll', async (_event, { pollId, updates, republish }) => {
    try {
        (0, db_1.updatePoll)(pollId, updates, republish);
        return { success: true };
    }
    catch (error) {
        console.error('Error updating poll:', error);
        return { success: false, error: error.message };
    }
});
electron_1.ipcMain.handle('db-delete-poll', async (_event, pollId) => {
    try {
        (0, db_1.deletePoll)(pollId);
        return { success: true };
    }
    catch (error) {
        console.error('Error deleting poll:', error);
        return { success: false, error: error.message };
    }
});
//# sourceMappingURL=main.js.map