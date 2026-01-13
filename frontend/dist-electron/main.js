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
const electron_updater_1 = require("electron-updater");
const syncManager_1 = require("./syncManager");
const pollScheduler_1 = require("./pollScheduler");
// Auto-updater logging
electron_updater_1.autoUpdater.logger = console;
console.log('\n' + '#'.repeat(80));
console.log(`[BOOT] SENTINEL MAIN PROCESS STARTING | ${new Date().toLocaleString()}`);
console.log('#'.repeat(80) + '\n');
// autoUpdater.autoDownload = true; // default is true
// Set app name for notifications (Windows/macOS/Linux)
electron_1.app.setName('Sentinel');
// Set AppUserModelId for Windows notifications to show correct app name
if (process.platform === 'win32') {
    electron_1.app.setAppUserModelId('Sentinel');
}
// Global Crash Protection
process.on('uncaughtException', (err) => {
    console.error('[Main] Uncaught Exception:', err);
    // Prevent crash by catching it here
});
process.on('unhandledRejection', (reason) => {
    console.error('[Main] Unhandled Rejection:', reason);
});
let tray = null;
let win = null;
let secondaryWindows = [];
let isPersistentAlertLocked = false;
// Global blur handler to prevent focus stealing on Linux/Wayland
const handleWindowBlur = () => {
    if (isPersistentAlertLocked && win) {
        console.log('[Main] Window blurred during persistent alert, reclaiming focus...');
        if (win.isMinimized())
            win.restore();
        win.focus();
        win.moveTop();
        electron_1.app.focus({ steal: true });
    }
};
const handleWindowMinimize = () => {
    if (isPersistentAlertLocked && win) {
        console.log('[Main] Minimize detected during persistent alert, restoring!');
        win.restore();
        win.focus();
        win.moveTop();
        electron_1.app.focus({ steal: true });
    }
};
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
    // Disable DevTools shortcuts ALWAYS - DISABLED for debugging
    // win.webContents.on('before-input-event', (event, input) => {
    //     if (input.control && input.shift && input.key.toLowerCase() === 'i') {
    //         event.preventDefault();
    //     }
    //     if (input.key === 'F12') {
    //         event.preventDefault();
    //     }
    // });
    // Disable Right-Click (Inspect Element bypass) - DISABLED for debugging
    // win.webContents.on('context-menu', (e) => {
    //     e.preventDefault();
    // });
    if (electron_is_dev_1.default) {
        win.loadURL('http://localhost:3000');
        win.webContents.openDevTools(); // Disabled per user request
    }
    else {
        win.loadFile(path.join(__dirname, '../dist/index.html'));
    }
    // Prevent window from closing, hide instead
    win.on('close', (event) => {
        if (isPersistentAlertLocked) {
            event.preventDefault(); // STRICTLY block closing
            return false;
        }
        if (!electron_1.app.isQuitting) {
            event.preventDefault();
            win?.hide();
        }
        return false;
    });
    // STRICT Input Blocking for Persistent Alert
    win.webContents.on('before-input-event', (event, input) => {
        if (!isPersistentAlertLocked)
            return;
        // Debug log to see what's being pressed (optional)
        // console.log('[Input Block] Key:', input.key, 'Alt:', input.alt, 'Control:', input.control, 'Meta:', input.meta);
        // Block Alt+F4 (Windows Close)
        if (input.alt && input.key.toLowerCase() === 'f4') {
            event.preventDefault();
            console.log('[Sentinel] Blocked Alt+F4');
        }
        // Block Ctrl+Q / Cmd+Q (Quit)
        if ((input.control || input.meta) && input.key.toLowerCase() === 'q') {
            event.preventDefault();
            console.log('[Sentinel] Blocked Quit Shortcut');
        }
        // Block Ctrl+W / Cmd+W (Close Tab/Window)
        if ((input.control || input.meta) && input.key.toLowerCase() === 'w') {
            event.preventDefault();
            console.log('[Sentinel] Blocked Close Shortcut');
        }
        // Block Escape (Exit Fullscreen)
        if (input.key === 'Escape') {
            event.preventDefault();
            console.log('[Sentinel] Blocked Escape');
        }
        // Block F11 (Toggle Fullscreen)
        if (input.key === 'F11') {
            event.preventDefault();
            console.log('[Sentinel] Blocked F11');
        }
        // Block Refresh (F5, Ctrl+R, Cmd+R) - prevent reload bypass
        if (input.key === 'F5' || ((input.control || input.meta) && input.key.toLowerCase() === 'r')) {
            event.preventDefault();
            console.log('[Sentinel] Blocked Refresh');
        }
        // Block DevTools (F12, Ctrl+Shift+I)
        if (input.key === 'F12' || ((input.control || input.meta) && input.shift && input.key.toLowerCase() === 'i')) {
            event.preventDefault();
            console.log('[Sentinel] Blocked DevTools');
        }
        // Block Alt+Tab (mitigation only - OS captures this, but we force focus back via heartbeat)
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
        console.log('[Main] Initializing local database...');
        (0, db_1.initDB)();
        console.log('[Main] Database initialization complete.');
    }
    catch (error) {
        console.error('[Main] CRITICAL: Failed to initialize Database:', error);
        // We might want to show a dialog and quit if DB fails
    }
    // Register Backend API IPC Handlers (bypass CORS by making calls from main process)
    console.log('[Main] Registering Backend API IPC handlers...');
    electron_1.ipcMain.handle('backend-create-poll', async (_event, poll) => {
        console.log('\n' + '='.repeat(80));
        console.log(`[IPC Handler] [${new Date().toLocaleTimeString()}] 📨 backend-create-poll received`);
        console.log('[IPC Handler] Poll Details:', {
            id: poll.id,
            question: poll.question,
            publisherEmail: poll.publisherEmail,
            consumersCount: poll.consumers?.length || 0,
            deadline: poll.deadline,
            isPersistentFinalAlert: poll.isPersistentFinalAlert
        });
        console.log('='.repeat(80) + '\n');
        try {
            // Write to local DB first
            console.log(`[IPC Handler] [${new Date().toLocaleTimeString()}] 💾 Step 1: Saving to local DB...`);
            poll.syncStatus = 'pending';
            await (0, db_1.createPoll)(poll);
            console.log(`[IPC Handler] [${new Date().toLocaleTimeString()}] ✅ Step 1 Complete: Poll saved to local DB with syncStatus=pending`);
            // Scheduled polls are now sent to backend immediately (to reserve Signal ID)
            if (poll.status === 'scheduled') {
                console.log(`[IPC Handler] [${new Date().toLocaleTimeString()}] 🕒 Poll is SCHEDULED for ${poll.scheduledFor}. Proceeding to cloud sync...`);
            }
            // Try to sync to backend immediately but don't block
            console.log(`[IPC Handler] [${new Date().toLocaleTimeString()}] ☁️ Step 2: Initiating cloud sync (non-blocking)...`);
            backendApi.createPoll(poll).then(async (result) => {
                console.log('\n' + '='.repeat(80));
                console.log(`[IPC Handler] [${new Date().toLocaleTimeString()}] ✅ CLOUD SYNC SUCCESS!`);
                console.log('[IPC Handler] Backend Response:', result);
                if (result && result.signalId) {
                    console.log(`[IPC Handler] 🔄 Updating local DB with cloudSignalId: ${result.signalId}`);
                    await (0, db_1.updatePoll)(poll.id, { cloudSignalId: result.signalId, syncStatus: 'synced' });
                    console.log(`[IPC Handler] ✅ Poll ${poll.id} marked as synced with cloudSignalId: ${result.signalId}`);
                }
                else {
                    console.warn('[IPC Handler] ⚠️ Cloud sync succeeded but no signalId returned');
                }
                console.log('='.repeat(80) + '\n');
            }).catch(err => {
                console.log('\n' + '='.repeat(80));
                console.error(`[IPC Handler] [${new Date().toLocaleTimeString()}] ❌ CLOUD SYNC FAILED!`);
                console.error('[IPC Handler] Error Type:', err.constructor.name);
                console.error('[IPC Handler] Error Message:', err.message);
                console.error('[IPC Handler] Error Code:', err.code);
                if (err.response) {
                    console.error('[IPC Handler] HTTP Status:', err.response.status);
                    console.error('[IPC Handler] Response Headers:', err.response.headers);
                    console.error('[IPC Handler] Response Data:', JSON.stringify(err.response.data, null, 2));
                }
                else if (err.request) {
                    console.error('[IPC Handler] No response received from backend');
                    console.error('[IPC Handler] Request Config:', {
                        url: err.config?.url,
                        method: err.config?.method,
                        baseURL: err.config?.baseURL
                    });
                }
                else {
                    console.error('[IPC Handler] Error setting up request:', err.message);
                }
                console.error('[IPC Handler] Full Error Stack:', err.stack);
                console.error('[IPC Handler] ⚠️ Poll saved locally but will retry sync later via SyncManager');
                console.log('='.repeat(80) + '\n');
            });
            console.log(`[IPC Handler] [${new Date().toLocaleTimeString()}] 🎉 Returning success to frontend (local save complete)`);
            return { success: true };
        }
        catch (error) {
            console.error('\n' + '='.repeat(80));
            console.error(`[IPC Handler] [${new Date().toLocaleTimeString()}] ❌ LOCAL DB SAVE FAILED!`);
            console.error('[IPC Handler] Error:', error.message);
            console.error('[IPC Handler] Stack:', error.stack);
            console.log('='.repeat(80) + '\n');
            return { success: false, error: error.message };
        }
    });
    electron_1.ipcMain.handle('db-delete-poll', async (_event, pollId) => {
        console.log(`[IPC Handler] db-delete-poll called for pollId: ${pollId}`);
        try {
            // Get the poll first to check if it has a cloudSignalId
            const polls = (0, db_1.getPolls)();
            const poll = polls.find(p => p.id === pollId);
            if (!poll) {
                console.warn(`[IPC Handler] db-delete-poll: Poll ${pollId} not found in DB`);
            }
            // Delete from local DB
            const result = (0, db_1.deletePoll)(pollId);
            console.log(`[IPC Handler] Local deletion result for ${pollId}:`, result);
            // If poll has cloudSignalId, sync deletion to cloud
            if (poll?.cloudSignalId) {
                console.log(`[IPC Handler] Syncing deletion to cloud for signalId: ${poll.cloudSignalId}`);
                backendApi.deletePoll(poll.cloudSignalId).then(() => {
                    console.log(`[IPC Handler] Cloud deletion successful for signalId: ${poll.cloudSignalId}`);
                }).catch(err => {
                    console.error('[IPC Handler] Failed to sync poll deletion to cloud:', err.message);
                });
            }
            return { success: true, changes: result.changes };
        }
        catch (error) {
            console.error('[IPC Handler] db-delete-poll error:', error.message);
            return { success: false, error: error.message };
        }
    });
    electron_1.ipcMain.handle('db-delete-poll-by-cloud-id', async (_event, cloudSignalId) => {
        console.log(`[IPC Handler] db-delete-poll-by-cloud-id called for: ${cloudSignalId}`);
        try {
            const result = (0, db_1.deletePollByCloudId)(Number(cloudSignalId));
            return { success: true, changes: result.changes };
        }
        catch (error) {
            console.error('[IPC Handler] db-delete-poll-by-cloud-id error:', error.message);
            return { success: false, error: error.message };
        }
    });
    electron_1.ipcMain.handle('backend-submit-vote', async (_event, pollId, signalId, userId, selectedOption, defaultResponse, reason) => {
        console.log(`[IPC Handler] backend-submit-vote called for pollId: ${pollId}, user: ${userId}`);
        try {
            // Check if device is online before allowing submission
            if (!electron_1.net.isOnline()) {
                console.warn('[IPC Handler] Device is offline, blocking vote submission');
                return {
                    success: false,
                    error: 'Cannot submit response while offline. Please connect to the internet and try again.'
                };
            }
            // Write response to local DB first
            const responseData = {
                pollId: pollId || (signalId ? signalId.toString() : undefined),
                consumerEmail: userId,
                response: selectedOption || defaultResponse || '',
                submittedAt: new Date().toISOString(),
                isDefault: !!(defaultResponse || reason),
                skipReason: reason
            };
            if (!responseData.pollId)
                throw new Error('pollId or signalId is required');
            await (0, db_1.submitResponse)(responseData);
            // Try to sync to backend
            if (signalId) {
                // BACKEND VALIDATION RULE: Exactly one of [selectedOption, defaultResponse, reason] must be present.
                // We prioritize: reason > selectedOption > defaultResponse
                let syncSelectedOption = undefined;
                let syncDefaultResponse = undefined;
                let syncReason = undefined;
                if (reason) {
                    syncReason = reason;
                }
                else if (selectedOption) {
                    syncSelectedOption = selectedOption;
                }
                else if (defaultResponse) {
                    syncDefaultResponse = defaultResponse;
                }
                backendApi.submitVote(signalId, userId, syncSelectedOption, syncDefaultResponse, syncReason).then(async () => {
                    console.log(`[IPC Handler] Deferred vote sync successful for poll ${signalId}`);
                    await (0, db_1.updateResponseSyncStatus)(responseData.pollId, userId, 'synced');
                }).catch(err => {
                    console.error('[IPC Handler] Deferred vote sync failed:', err);
                });
            }
            return { success: true };
        }
        catch (error) {
            console.error('[IPC Handler] local-submit-vote error:', error.message);
            return { success: false, error: error.message };
        }
    });
    electron_1.ipcMain.handle('backend-get-results', async (_event, signalId) => {
        console.log(`[IPC Handler] backend-get-results called for signalId: ${signalId}`);
        try {
            const result = await backendApi.getPollResults(signalId);
            return { success: true, data: result };
        }
        catch (error) {
            const errorMessage = backendApi.extractBackendError(error);
            console.error('[IPC Handler] backend-get-results error:', errorMessage);
            return { success: false, error: errorMessage };
        }
    });
    electron_1.ipcMain.handle('backend-edit-poll', async (_event, { signalId, poll, republish }) => {
        const time = new Date().toLocaleTimeString();
        console.log('\n' + '='.repeat(80));
        console.log(`[IPC Handler] [${time}] 📝 backend-edit-poll received (Cloud Sync)`);
        console.log(`[IPC Handler] Signal ID: ${signalId}`);
        console.log(`[IPC Handler] Republish: ${republish}`);
        console.log(`[IPC Handler] Shared With Count: ${poll.sharedWith?.length || 0}`);
        console.log(`[IPC Handler] Labels:`, poll.labels || []);
        console.log('='.repeat(80) + '\n');
        try {
            await backendApi.editPoll(signalId, poll, republish);
            console.log(`[IPC Handler] [${time}] ✅ backend-edit-poll cloud sync SUCCESS`);
            return { success: true };
        }
        catch (error) {
            const errorMessage = backendApi.extractBackendError(error);
            console.error(`[IPC Handler] [${time}] ❌ backend-edit-poll cloud sync FAILED:`, errorMessage);
            return { success: false, error: errorMessage };
        }
    });
    electron_1.ipcMain.handle('backend-delete-poll', async (_event, signalId) => {
        const time = new Date().toLocaleTimeString();
        console.log(`[IPC Handler] [${time}] 🗑️ backend-delete-poll called for signalId: ${signalId}`);
        try {
            await backendApi.deletePoll(signalId);
            return { success: true };
        }
        catch (error) {
            const errorMessage = backendApi.extractBackendError(error);
            console.error(`[IPC Handler] [${time}] ❌ backend-delete-poll error:`, errorMessage);
            return { success: false, error: errorMessage };
        }
    });
    electron_1.ipcMain.handle('backend-login', async (_event, { email, password }) => {
        console.log(`[IPC Handler] backend-login called for user: ${email}`);
        try {
            const role = await backendApi.login(email, password);
            console.log('[IPC Handler] backend-login success, role:', role);
            // Start SyncManager on successful login
            syncManager_1.syncManager.login(email);
            return { success: true, data: role };
        }
        catch (error) {
            const errorMessage = backendApi.extractBackendError(error);
            console.error('[IPC Handler] backend-login error:', errorMessage);
            return { success: false, error: errorMessage };
        }
    });
    setupAutoLaunch();
    // Start poll scheduler to automatically publish scheduled polls
    console.log('[Main] Starting poll scheduler...');
    pollScheduler_1.pollScheduler.start();
    createWindow();
    // Check for updates
    if (!electron_is_dev_1.default) {
        console.log('[Main] Checking for updates...');
        electron_updater_1.autoUpdater.checkForUpdatesAndNotify();
    }
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
        return syncManager_1.syncManager.getStatus().deviceStatus;
    });
    electron_1.ipcMain.handle('get-sync-status', () => {
        return syncManager_1.syncManager.getStatus();
    });
});
electron_1.app.on('window-all-closed', () => {
    // Don't quit on window close - keep running in tray
    if (process.platform !== 'darwin') {
        // Keep app running
    }
});
// IPC Handlers for window control
electron_1.ipcMain.on('restore-window', () => {
    if (win) {
        if (win.isMinimized()) {
            win.restore();
        }
        win.show();
        win.focus();
    }
});
let heartbeatInterval = null;
let lastKnownWindowState = null;
// Helper to create a secondary alert window
function createSecondaryWindow(display) {
    const isLinux = process.platform === 'linux';
    const secondaryWin = new electron_1.BrowserWindow({
        x: display.bounds.x,
        y: display.bounds.y,
        width: display.bounds.width,
        height: display.bounds.height,
        frame: false,
        fullscreen: !isLinux, // Linux: use setSimpleFullScreen later
        kiosk: !isLinux, // Linux: kiosk can be buggy on Wayland
        alwaysOnTop: true,
        backgroundColor: '#000000',
        skipTaskbar: true,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
    });
    // Disable DevTools and Context Menu for secondary windows too - DISABLED for debug
    // secondaryWin.webContents.on('before-input-event', (event, input) => {
    //     if (input.control && input.shift && input.key.toLowerCase() === 'i') {
    //         event.preventDefault();
    //     }
    //     if (input.key === 'F12') {
    //         event.preventDefault();
    //     }
    // });
    // secondaryWin.webContents.on('context-menu', (e) => {
    //     e.preventDefault();
    // });
    // Immediate refocus for secondary monitors
    secondaryWin.on('blur', () => {
        if (isPersistentAlertLocked && !secondaryWin.isDestroyed()) {
            if (secondaryWin.isMinimized())
                secondaryWin.restore();
            secondaryWin.focus();
            secondaryWin.moveTop();
            electron_1.app.focus({ steal: true });
        }
    });
    secondaryWin.on('minimize', () => {
        if (isPersistentAlertLocked && !secondaryWin.isDestroyed()) {
            secondaryWin.restore();
            secondaryWin.focus();
            secondaryWin.moveTop();
            electron_1.app.focus({ steal: true });
        }
    });
    if (isLinux) {
        secondaryWin.setFullScreen(true);
        secondaryWin.setKiosk(true);
        secondaryWin.setSkipTaskbar(true);
    }
    secondaryWin.setAlwaysOnTop(true, 'screen-saver', 1);
    secondaryWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    const url = electron_is_dev_1.default
        ? 'http://localhost:3000?isSecondary=true'
        : `file://${path.join(__dirname, '../dist/index.html')}?isSecondary=true`;
    if (electron_is_dev_1.default) {
        secondaryWin.loadURL(url);
    }
    else {
        secondaryWin.loadFile(path.join(__dirname, '../dist/index.html'), { query: { isSecondary: 'true' } });
    }
    secondaryWindows.push({ win: secondaryWin, displayId: display.id });
    return secondaryWin;
}
// Handle display changes during active alert
const handleDisplayAdded = (_event, display) => {
    console.log('[Sentinel] New monitor detected during alert, locking it.');
    createSecondaryWindow(display);
};
const handleDisplayRemoved = (_event, display) => {
    console.log('[Sentinel] Monitor removed during alert, cleaning up window.');
    secondaryWindows = secondaryWindows.filter(sw => {
        if (sw.displayId === display.id) {
            if (!sw.win.isDestroyed())
                sw.win.destroy();
            return false;
        }
        return true;
    });
};
electron_1.ipcMain.on('set-persistent-alert-active', (_event, isActive) => {
    console.log(`[Main] set-persistent-alert-active: ${isActive}`);
    if (win) {
        if (isActive) {
            console.log('[Main] Activating robust persistent alert (kiosk + fullscreen)');
            isPersistentAlertLocked = true;
            // Save state before locking
            lastKnownWindowState = {
                bounds: win.getBounds(),
                isMaximized: win.isMaximized(),
                isMinimized: win.isMinimized()
            };
            const isLinux = process.platform === 'linux';
            const sessionType = process.env.XDG_SESSION_TYPE || 'unknown';
            console.log(`[Main] Platform: ${process.platform}, Session: ${sessionType}, Linux Handling: ${isLinux}`);
            if (isLinux && sessionType === 'wayland') {
                console.warn('[Main] ⚠️ Running on Wayland. System shortcuts (Alt+Tab) might NOT be fully blockable due to OS security policy.');
            }
            win.setMinimizable(false);
            win.setClosable(false);
            win.setMovable(false);
            // Main Window Protection
            win.setResizable(true); // Allow transition
            win.setFullScreenable(true);
            // Force maximize before fullscreen to ensure coverage
            win.maximize();
            // Linux-specific: Standard fullscreen + Kiosk
            if (isLinux) {
                win.setFullScreen(true);
                win.setKiosk(true);
                win.setSkipTaskbar(true);
            }
            else {
                win.setFullScreen(true);
                win.setKiosk(true);
            }
            win.setResizable(false);
            win.setMaximizable(false);
            win.setFullScreenable(false);
            win.setAlwaysOnTop(true, 'screen-saver', 1);
            win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
            win.setSkipTaskbar(true);
            win.show();
            win.focus();
            // Immediate Refocus Listeners
            win.on('blur', handleWindowBlur);
            win.on('minimize', handleWindowMinimize);
            // Block keyboard shortcuts (Alt+Tab, Super, etc.)
            const shortcutsToBlock = [
                'Alt+Tab',
                'Alt+F4',
                'Super',
                'Meta',
                'CommandOrControl+Q',
                'CommandOrControl+W',
                'CommandOrControl+H',
                'CommandOrControl+M',
                'F11',
                'Escape'
            ];
            shortcutsToBlock.forEach(shortcut => {
                try {
                    electron_1.globalShortcut.register(shortcut, () => {
                        console.log(`[Main] Blocked shortcut: ${shortcut}`);
                        // Do nothing - effectively blocking the shortcut
                    });
                }
                catch (e) {
                    console.warn(`[Main] Could not register shortcut: ${shortcut}`);
                }
            });
            // Multi-monitor support: Create secondary windows for other displays
            const displays = electron_1.screen.getAllDisplays();
            const primaryDisplay = electron_1.screen.getPrimaryDisplay();
            displays.forEach(display => {
                if (display.id !== primaryDisplay.id) {
                    createSecondaryWindow(display);
                }
            });
            // Listen for display changes
            electron_1.screen.on('display-added', handleDisplayAdded);
            electron_1.screen.on('display-removed', handleDisplayRemoved);
            // Focus Heartbeat: Force windows to front
            // Linux needs faster heartbeat (100ms) due to gesture/workspace switching
            const heartbeatDelay = isLinux ? 100 : 500;
            if (heartbeatInterval)
                clearInterval(heartbeatInterval);
            heartbeatInterval = setInterval(() => {
                const primaryDisplay = electron_1.screen.getPrimaryDisplay();
                if (win) {
                    win.setAlwaysOnTop(true, 'screen-saver', 1);
                    if (isLinux) {
                        win.setSkipTaskbar(true);
                        win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
                        // [Linux Specific] Aggressively re-assert Kiosk / Fullscreen state
                        // This counteracts Wayland/WM attempts to un-set them
                        try {
                            if (!win.isKiosk())
                                win.setKiosk(true);
                            if (!win.isFullScreen())
                                win.setFullScreen(true);
                            // Force bounds reset in case of resize attempts
                            const bounds = electron_1.screen.getPrimaryDisplay().bounds;
                            const current = win.getBounds();
                            if (current.width !== bounds.width || current.height !== bounds.height) {
                                win.setBounds(bounds);
                            }
                            // Aggressively claim focus
                            win.moveTop();
                            win.focus();
                            win.show();
                        }
                        catch (err) {
                            // Ignore errors if window is destroyed
                        }
                    }
                    if (win.isMinimized())
                        win.restore();
                    win.moveTop();
                    win.focus();
                    electron_1.app.focus({ steal: true });
                }
                secondaryWindows = secondaryWindows.filter(sw => {
                    if (sw.win.isDestroyed())
                        return false;
                    // Safety guard: If a secondary window has jumped to the primary monitor 
                    // (due to disconnect), destroy it to stop the "focus battle"
                    const bounds = sw.win.getBounds();
                    if (bounds.x === primaryDisplay.bounds.x && bounds.y === primaryDisplay.bounds.y) {
                        console.log('[Sentinel] Secondary window detected on primary display, destroying it.');
                        sw.win.destroy();
                        return false;
                    }
                    sw.win.setAlwaysOnTop(true, 'screen-saver', 1);
                    if (isLinux) {
                        sw.win.setSkipTaskbar(true);
                    }
                    sw.win.moveTop();
                    sw.win.focus();
                    return true;
                });
            }, heartbeatDelay);
        }
        else {
            console.log('[Main] Deactivating persistent alert and restoring state');
            isPersistentAlertLocked = false;
            // Unregister all global shortcuts
            electron_1.globalShortcut.unregisterAll();
            // Cleanup heartbeat
            if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
                heartbeatInterval = null;
            }
            electron_1.screen.removeListener('display-added', handleDisplayAdded);
            electron_1.screen.removeListener('display-removed', handleDisplayRemoved);
            // Cleanup secondary windows
            secondaryWindows.forEach(sw => {
                if (!sw.win.isDestroyed())
                    sw.win.destroy();
            });
            secondaryWindows = [];
            // Restore window state
            const isLinux = process.platform === 'linux';
            if (isLinux) {
                win.setKiosk(false);
                win.setFullScreen(false);
            }
            else {
                win.setKiosk(false);
                win.setFullScreen(false);
            }
            win.setAlwaysOnTop(false);
            win.setSkipTaskbar(false);
            win.setMinimizable(true);
            win.setClosable(true);
            win.setMovable(true);
            win.setResizable(true);
            win.setMaximizable(true);
            win.setFullScreenable(true);
            // Remove listeners
            if (win) {
                win.removeListener('blur', handleWindowBlur);
                win.removeListener('minimize', handleWindowMinimize);
            }
            // Restore previous window state
            if (lastKnownWindowState) {
                if (lastKnownWindowState.isMaximized) {
                    win.maximize();
                }
                else if (lastKnownWindowState.isMinimized) {
                    win.minimize();
                }
                else {
                    win.unmaximize();
                    win.setBounds(lastKnownWindowState.bounds);
                }
                lastKnownWindowState = null;
            }
            setTimeout(() => {
                if (win) {
                    win.setMinimizable(true);
                    win.setClosable(true);
                    win.setMovable(true);
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
        console.log('[IPC Main] Handling db-get-polls request');
        const polls = (0, db_1.getPolls)();
        console.log(`[IPC Main] Sending ${polls.length} polls to frontend`);
        return polls;
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
        console.log('[IPC Main] Handling db-get-responses request');
        const responses = (0, db_1.getResponses)();
        console.log(`[IPC Main] Sending ${responses.length} responses to frontend`);
        return responses;
    }
    catch (error) {
        console.error('Error getting responses:', error);
        return [];
    }
});
electron_1.ipcMain.handle('db-update-poll', async (_event, { pollId, updates, republish }) => {
    const time = new Date().toLocaleTimeString();
    console.log('\n' + '-'.repeat(80));
    console.log(`[IPC Handler] [${time}] 💾 db-update-poll received (Local)`);
    console.log(`[IPC Handler] Poll ID: ${pollId}`);
    console.log(`[IPC Handler] Republish: ${republish}`);
    console.log(`[IPC Handler] Updates:`, updates);
    try {
        (0, db_1.updatePoll)(pollId, updates, republish);
        console.log(`[IPC Handler] [${time}] ✅ Local update complete for ${pollId}`);
        // Sync to cloud if it's a cloud-synced poll
        const polls = (0, db_1.getPolls)();
        const updatedPoll = polls.find(p => p.id === pollId);
        console.log(`[IPC Handler] [${time}] Check Cloud Sync | exists=${!!updatedPoll} | cloudSignalId=${updatedPoll?.cloudSignalId}`);
        if (updatedPoll && updatedPoll.cloudSignalId) {
            console.log(`[IPC Handler] [${time}] ☁️ Syncing poll update to cloud for signalId: ${updatedPoll.cloudSignalId}`);
            backendApi.editPoll(updatedPoll.cloudSignalId, updatedPoll, republish)
                .then(() => {
                console.log(`[IPC Handler] [${time}] ✅ Cloud sync Success for signalId: ${updatedPoll.cloudSignalId}`);
            })
                .catch(err => {
                console.error(`[IPC Handler] [${time}] ❌ Cloud sync Failed for signalId: ${updatedPoll.cloudSignalId}:`, err.message);
            });
        }
        else {
            console.log(`[IPC Handler] [${time}] ℹ️ Skipping cloud sync for poll ${pollId}: cloudSignalId is missing.`);
        }
        console.log('-'.repeat(80) + '\n');
        return { success: true };
    }
    catch (error) {
        console.error(`[IPC Handler] [${time}] ❌ db-update-poll FAILED:`, error.message);
        return { success: false, error: error.message };
    }
});
// ------------------------------------
// Labels (Experimental)
// ------------------------------------
electron_1.ipcMain.handle('db-create-label', async (event, label) => {
    const time = new Date().toLocaleTimeString();
    console.log('\n' + '*'.repeat(80));
    console.log(`[IPC Handler] [${time}] 🏷️ db-create-label received: "${label.name}"`);
    console.log(`[IPC Handler] Label Data:`, label);
    try {
        const result = (0, db_1.createLabel)(label);
        console.log(`[IPC Handler] [${time}] ✅ Local label created: ${label.name} (id: ${label.id})`);
        // Sync to backend (Fire & Forget / Optimistic)
        console.log(`[IPC Handler] [${time}] ☁️ Syncing new label to cloud: "${label.name}"`);
        backendApi.createLabel({
            name: label.name,
            color: label.color,
            description: label.description,
            localId: label.id
        }).then((response) => {
            console.log(`[IPC Handler] [${time}] ✅ Cloud sync SUCCESS for label: "${label.name}"`);
            try {
                // Update with backend ID (cloudId) and sync status
                (0, db_1.updateLabel)(label.id, {
                    cloudId: response.id,
                    syncStatus: 'synced'
                });
                console.log(`[IPC Handler] [${time}] 💾 Local label updated with cloudId: ${response.id}`);
            }
            catch (syncErr) {
                console.error(`[IPC Handler] [${time}] ❌ Failed to update local label with cloudId:`, syncErr.message);
            }
        }).catch(err => {
            console.error(`[IPC Handler] [${time}] ❌ Cloud sync FAILED for label "${label.name}":`, err.message);
        });
        console.log('*'.repeat(80) + '\n');
        return { success: true, data: result };
    }
    catch (error) {
        console.error(`[IPC Handler] [${time}] ❌ db-create-label FAILED:`, error);
        return { success: false, error: error.message };
    }
});
electron_1.ipcMain.handle('db-get-labels', async () => {
    console.log('[IPC Main] Handling db-get-labels request');
    try {
        const labels = (0, db_1.getLabels)();
        return { success: true, data: labels };
    }
    catch (error) {
        console.error('[IPC Main] Error getting labels:', error);
        return { success: false, error: error.message };
    }
});
electron_1.ipcMain.handle('db-delete-label', async (event, id) => {
    console.log('[IPC Main] Handling db-delete-label request:', id);
    try {
        const result = (0, db_1.deleteLabel)(id);
        return { success: true, data: result };
    }
    catch (error) {
        console.error('[IPC Main] Error deleting label:', error);
        return { success: false, error: error.message };
    }
});
electron_1.ipcMain.handle('db-update-label', async (event, { id, updates }) => {
    const time = new Date().toLocaleTimeString();
    console.log('\n' + '+'.repeat(80));
    console.log(`[IPC Handler] [${time}] ✏️ db-update-label received`);
    console.log(`[IPC Handler] Label ID: ${id}`);
    console.log(`[IPC Handler] Updates:`, updates);
    try {
        // 1. Update Locally
        const result = (0, db_1.updateLabel)(id, updates);
        console.log(`[IPC Handler] [${time}] ✅ Local label update complete for ID: ${id}`);
        // 2. Sync to Cloud
        try {
            // Re-fetch label to get cloudId
            const labels = (0, db_1.getLabels)(); // Explicit cast
            const updatedLabel = labels.find((l) => l.id === id);
            if (updatedLabel && updatedLabel.cloudId) {
                console.log(`[IPC Handler] [${time}] ☁️ Syncing edit to cloud for label CloudID: ${updatedLabel.cloudId}`);
                await backendApi.editLabel({
                    id: updatedLabel.cloudId,
                    description: updates.description,
                    color: updates.color
                });
                // Mark as synced again after successful cloud update
                (0, db_1.updateLabelSyncStatus)(id, 'synced');
                console.log(`[IPC Handler] [${time}] ✅ Cloud sync SUCCESS for label edit`);
            }
            else {
                console.log(`[IPC Handler] [${time}] ℹ️ Skipping cloud sync: Label has no cloudId (not yet synced to cloud)`);
            }
        }
        catch (syncError) {
            console.error(`[IPC Handler] [${time}] ❌ Cloud sync FAILED for label edit:`, syncError.message);
        }
        console.log('+'.repeat(80) + '\n');
        return { success: true, data: result };
    }
    catch (error) {
        console.error(`[IPC Handler] [${time}] ❌ db-update-label FAILED:`, error);
        return { success: false, error: error.message };
    }
});
//# sourceMappingURL=main.js.map