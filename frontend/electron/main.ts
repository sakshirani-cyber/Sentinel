import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, powerMonitor } from 'electron';
import * as path from 'path';
import isDev from 'electron-is-dev';
import { initDB, createPoll, getPolls, submitResponse, getResponses, updatePoll } from './db';
import * as backendApi from './backendApi';

// Set app name for notifications (Windows/macOS/Linux)
app.setName('Sentinel');

// Set AppUserModelId for Windows notifications to show correct app name
if (process.platform === 'win32') {
    app.setAppUserModelId('Sentinel');
}

let tray: Tray | null = null;
let win: BrowserWindow | null = null;

// Simple icon for tray (16x16 blue circle)
const iconBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFMSURBVDiNpZMxSwNBEIW/vb29JBcQFBELsbATrPwBNv4CK/+Alf9AO0EQrGwsLCwEwUKwsLOxEQQLC0EQbCwUQUQQvLu9nZndsUgOc5dEfM3uzHvfzO4MrLH+V8AYcwI0gQPgEHgCboAr4FJKebcSgDHmGDgFdoEt4BV4AC6Acynl8xKAMWYPOAO2gQ/gHrgFbqSUH0sAxpgGcAzsAJ/APXADXEsp3xcAjDFN4AjYBl6AO+AauJBSvi0CGGN2gUNgC3gG7oBr4FJK+bIIYIzZBw6ATeAJuAWugXMp5esiQB04ADaAR+AWuAHOpZRviwB14BDYBx6AW+AGuJBSvi8C1IFDoBZ4AG6BG+BcSvm+CFAHjoAa8ADcAjfAhZTyfRGgDhwBNeABuAVugHMp5ccigDHmCGgAD8AtcANcSCk/FwGMMUdAA3gAbv8A/FbXX2v9D/gBnqV8VC6kqXwAAAAASUVORK5CYII=';

function createWindow() {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
        minimizable: true,  // Allow minimize by default
        closable: true,     // Allow close by default
        movable: true,      // Allow dragging by default
        icon: path.join(__dirname, isDev ? '../public/logo.png' : '../dist/logo.png')
    });

    if (isDev) {
        win.loadURL('http://localhost:3000');
        win.webContents.openDevTools();
    } else {
        win.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    // Prevent window from closing, hide instead
    win.on('close', (event) => {
        if (!(app as any).isQuitting) {
            event.preventDefault();
            win?.hide();
        }
        return false;
    });
}

function setupAutoLaunch() {
    // Windows & macOS
    if (process.platform === 'darwin' || process.platform === 'win32') {
        app.setLoginItemSettings({
            openAtLogin: true,
            path: app.getPath('exe')
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
Exec=${app.getPath('exe')}
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
Comment=Sentinel Signal Enforcement
`;
            fs.writeFileSync(desktopFile, content);
        } catch (error) {
            console.error('Failed to set up Linux autostart:', error);
        }
    }
}

app.whenReady().then(async () => {
    try {
        initDB();

        // ========================================================================
        // Backend API IPC Handlers (bypass CORS by making calls from main process)
        // ========================================================================

        ipcMain.handle('backend-create-poll', async (_event, poll) => {
            try {
                const result = await backendApi.createPoll(poll);
                return { success: true, data: result };
            } catch (error: any) {
                console.error('Backend API - Create Poll Error:', error.message);
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('backend-submit-vote', async (_event, { signalId, userId, selectedOption }) => {
            try {
                await backendApi.submitVote(signalId, userId, selectedOption);
                return { success: true };
            } catch (error: any) {
                console.error('Backend API - Submit Vote Error:', error.message);
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('backend-get-results', async (_event, signalId) => {
            try {
                const result = await backendApi.getPollResults(signalId);
                return { success: true, data: result };
            } catch (error: any) {
                console.error('Backend API - Get Results Error:', error.message);
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('backend-edit-poll', async (_event, { signalId, poll, republish }) => {
            try {
                await backendApi.editPoll(signalId, poll, republish);
                return { success: true };
            } catch (error: any) {
                console.error('Backend API - Edit Poll Error:', error.message);
                return { success: false, error: error.message };
            }
        });

        ipcMain.handle('backend-delete-poll', async (_event, signalId) => {
            try {
                await backendApi.deletePoll(signalId);
                return { success: true };
            } catch (error: any) {
                console.error('Backend API - Delete Poll Error:', error.message);
                return { success: false, error: error.message };
            }
        });

    } catch (error) {
        console.error('Failed to initialize Database:', error);
    }

    setupAutoLaunch();

    createWindow();

    // Prevent Cmd+Q on macOS
    app.on('before-quit', (event) => {
        if (!(app as any).isQuitting) {
            event.preventDefault();
        }
    });

    // Create system tray
    const icon = nativeImage.createFromDataURL(iconBase64);
    tray = new Tray(icon);

    const contextMenu = Menu.buildFromTemplate([
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

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        } else {
            win?.show();
        }
    });

    // Device Status Tracking
    let currentDeviceStatus = 'active';
    console.log('[Device Status] Tracking initialized');

    // Track lock/unlock screen
    powerMonitor.on('lock-screen', () => {
        currentDeviceStatus = 'locked';
        console.log('[Device Status] Screen locked');
    });

    powerMonitor.on('unlock-screen', () => {
        currentDeviceStatus = 'active';
        console.log('[Device Status] Screen unlocked');
    });

    // Track sleep/wake
    powerMonitor.on('suspend', () => {
        currentDeviceStatus = 'sleep';
        console.log('[Device Status] System suspended (sleep)');
    });

    powerMonitor.on('resume', () => {
        currentDeviceStatus = 'active';
        console.log('[Device Status] System resumed (wake)');
    });

    // Track idle state - check every 30 seconds
    setInterval(() => {
        // Check if system has been idle for more than 60 seconds
        const idleState = powerMonitor.getSystemIdleState(60);

        if (currentDeviceStatus !== 'locked' && currentDeviceStatus !== 'sleep') {
            if (idleState === 'idle') {
                currentDeviceStatus = 'idle';
                console.log('[Device Status] System is idle');
            } else if (idleState === 'active' && currentDeviceStatus === 'idle') {
                currentDeviceStatus = 'active';
                console.log('[Device Status] System is active');
            }
        }
    }, 30000);

    ipcMain.handle('get-device-status', () => {
        return currentDeviceStatus;
    });
});

app.on('window-all-closed', () => {
    // Don't quit on window close - keep running in tray
    if (process.platform !== 'darwin') {
        // Keep app running
    }
});

// IPC Handlers for window control
ipcMain.on('set-always-on-top', (_event, shouldBeOnTop: boolean) => {
    if (win) {
        win.setAlwaysOnTop(shouldBeOnTop);
        if (shouldBeOnTop) {
            win.show();
            win.focus();
        }
    }
});

ipcMain.on('restore-window', () => {
    if (win) {
        if (win.isMinimized()) {
            win.restore();
        }
        win.show();
        win.focus();
    }
});

// Prevent window minimize/close during persistent alert
ipcMain.on('set-persistent-alert-active', (_event, isActive: boolean) => {
    if (win) {
        win.setMinimizable(!isActive);
        win.setClosable(!isActive);
        win.setMovable(!isActive); // Prevent window from being dragged

        if (isActive) {
            win.setAlwaysOnTop(true, 'screen-saver'); // Highest priority
            win.setFullScreen(true); // Make truly fullscreen
            win.show();
            win.focus();
        } else {
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

// DB Handlers
ipcMain.handle('db-create-poll', async (_event, poll: any) => {
    try {
        createPoll(poll);
        return { success: true };
    } catch (error: any) {
        console.error('Error creating poll:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('db-get-polls', async () => {
    try {
        return getPolls();
    } catch (error) {
        console.error('Error getting polls:', error);
        return [];
    }
});

ipcMain.handle('db-submit-response', async (_event, response: any) => {
    try {
        submitResponse(response);
        return { success: true };
    } catch (error: any) {
        console.error('Error submitting response:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('db-get-responses', async () => {
    try {
        return getResponses();
    } catch (error) {
        console.error('Error getting responses:', error);
        return [];
    }
});

ipcMain.handle('db-update-poll', async (_event, { pollId, updates, republish }) => {
    try {
        updatePoll(pollId, updates, republish);
        return { success: true };
    } catch (error: any) {
        console.error('Error updating poll:', error);
        return { success: false, error: error.message };
    }
});
