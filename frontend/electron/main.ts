import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, powerMonitor, screen } from 'electron';
import * as path from 'path';
import isDev from 'electron-is-dev';
import { initDB, createPoll, getPolls, submitResponse, getResponses, updatePoll, deletePoll } from './db';
import * as backendApi from './backendApi';
import { syncManager } from './syncManager';

// Set app name for notifications (Windows/macOS/Linux)
app.setName('Sentinel');

// Set AppUserModelId for Windows notifications to show correct app name
if (process.platform === 'win32') {
    app.setAppUserModelId('Sentinel');
}

let tray: Tray | null = null;
let win: BrowserWindow | null = null;
let secondaryWindows: BrowserWindow[] = [];
let isPersistentAlertLocked = false;

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

    if (isDev) {
        win.loadURL('http://localhost:3000');
        win.webContents.openDevTools(); // Re-enabled per user request
    } else {
        win.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    // Prevent window from closing, hide instead
    win.on('close', (event) => {
        if (isPersistentAlertLocked) {
            event.preventDefault(); // STRICTLY block closing
            return false;
        }

        if (!(app as any).isQuitting) {
            event.preventDefault();
            win?.hide();
        }
        return false;
    });

    // STRICT Input Blocking for Persistent Alert
    win.webContents.on('before-input-event', (event, input) => {
        if (!isPersistentAlertLocked) return;

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
    // Register Backend API IPC Handlers (bypass CORS by making calls from main process)
    console.log('[Main] Registering Backend API IPC handlers...');

    ipcMain.handle('backend-create-poll', async (_event, poll) => {
        console.log(`[IPC Handler] backend-create-poll (local-first) called for poll: ${poll.question}`);
        try {
            // Write to local DB first
            poll.syncStatus = 'pending';
            await createPoll(poll);

            // Try to sync to backend immediately but don't block
            backendApi.createPoll(poll).then(async (result) => {
                if (result && result.signalId) {
                    await updatePoll(poll.id, { cloudSignalId: result.signalId, syncStatus: 'synced' });
                }
            }).catch(err => {
                console.error('[IPC Handler] Deferred cloud sync failed:', err);
            });

            return { success: true };
        } catch (error: any) {
            console.error('[IPC Handler] local-create-poll error:', error.message);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('db-delete-poll', async (_event, pollId) => {
        console.log(`[IPC Handler] db-delete-poll called for pollId: ${pollId}`);
        try {
            // Get the poll first to check if it has a cloudSignalId
            const polls = getPolls();
            const poll = polls.find(p => p.id === pollId);

            // Delete from local DB
            deletePoll(pollId);

            // If poll has cloudSignalId, sync deletion to cloud
            if (poll?.cloudSignalId) {
                backendApi.deletePoll(poll.cloudSignalId).catch(err => {
                    console.error('[IPC Handler] Failed to sync poll deletion to cloud:', err);
                });
            }

            return { success: true };
        } catch (error: any) {
            console.error('[IPC Handler] db-delete-poll error:', error.message);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('backend-submit-vote', async (_event, { pollId, signalId, userId, selectedOption, defaultResponse, reason }) => {
        console.log(`[IPC Handler] backend-submit-vote (local-first) called for pollId: ${pollId}, user: ${userId}`);
        try {
            // Write response to local DB first
            const responseData = {
                pollId: pollId || (signalId ? signalId.toString() : undefined),
                consumerEmail: userId,
                response: selectedOption || defaultResponse || '',
                submittedAt: new Date().toISOString(),
                isDefault: !!(defaultResponse || reason),
                skipReason: reason
            };

            if (!responseData.pollId) throw new Error('pollId or signalId is required');

            await submitResponse(responseData as any);

            // Try to sync to backend
            if (signalId) {
                backendApi.submitVote(signalId, userId, selectedOption, defaultResponse, reason).catch(err => {
                    console.error('[IPC Handler] Deferred vote sync failed:', err);
                });
            }

            return { success: true };
        } catch (error: any) {
            console.error('[IPC Handler] local-submit-vote error:', error.message);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('backend-get-results', async (_event, signalId) => {
        console.log(`[IPC Handler] backend-get-results called for signalId: ${signalId}`);
        try {
            const result = await backendApi.getPollResults(signalId);
            return { success: true, data: result };
        } catch (error: any) {
            const errorMessage = backendApi.extractBackendError(error);
            console.error('[IPC Handler] backend-get-results error:', errorMessage);
            return { success: false, error: errorMessage };
        }
    });

    ipcMain.handle('backend-edit-poll', async (_event, { signalId, poll, republish }) => {
        console.log(`[IPC Handler] backend-edit-poll called for signalId: ${signalId}`);
        try {
            await backendApi.editPoll(signalId, poll, republish);
            return { success: true };
        } catch (error: any) {
            const errorMessage = backendApi.extractBackendError(error);
            console.error('[IPC Handler] backend-edit-poll error:', errorMessage);
            return { success: false, error: errorMessage };
        }
    });

    ipcMain.handle('backend-delete-poll', async (_event, signalId) => {
        console.log(`[IPC Handler] backend-delete-poll called for signalId: ${signalId}`);
        try {
            await backendApi.deletePoll(signalId);
            return { success: true };
        } catch (error: any) {
            const errorMessage = backendApi.extractBackendError(error);
            console.error('[IPC Handler] backend-delete-poll error:', errorMessage);
            return { success: false, error: errorMessage };
        }
    });

    ipcMain.handle('backend-login', async (_event, { email, password }) => {
        console.log(`[IPC Handler] backend-login called for user: ${email}`);
        try {
            const role = await backendApi.login(email, password);
            console.log('[IPC Handler] backend-login success, role:', role);

            // Start SyncManager on successful login
            syncManager.login(email);

            return { success: true, data: role };
        } catch (error: any) {
            const errorMessage = backendApi.extractBackendError(error);
            console.error('[IPC Handler] backend-login error:', errorMessage);
            return { success: false, error: errorMessage };
        }
    });

    ipcMain.handle('backend-get-active-polls', async (_event, userEmail) => {
        console.log(`[IPC Handler] backend-get-active-polls called for user: ${userEmail}`);
        try {
            const polls = await backendApi.getActivePolls(userEmail);
            console.log(`[IPC Handler] backend-get-active-polls success, found ${polls.length} polls`);
            return { success: true, data: polls };
        } catch (error: any) {
            const errorMessage = backendApi.extractBackendError(error);
            console.error('[IPC Handler] backend-get-active-polls error:', errorMessage);
            return { success: false, error: errorMessage };
        }
    });

    try {
        console.log('[Main] Initializing local database...');
        initDB();
        console.log('[Main] Database initialization complete.');
    } catch (error) {
        console.error('[Main] CRITICAL: Failed to initialize Database:', error);
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
        return syncManager.getStatus().deviceStatus;
    });

    ipcMain.handle('get-sync-status', () => {
        return syncManager.getStatus();
    });
});

app.on('window-all-closed', () => {
    // Don't quit on window close - keep running in tray
    if (process.platform !== 'darwin') {
        // Keep app running
    }
});

// IPC Handlers for window control
ipcMain.on('restore-window', () => {
    if (win) {
        if (win.isMinimized()) {
            win.restore();
        }
        win.show();
        win.focus();
    }
});

let heartbeatInterval: NodeJS.Timeout | null = null;
let lastKnownWindowState: {
    bounds: Electron.Rectangle;
    isMaximized: boolean;
    isMinimized: boolean;
} | null = null;

// Helper to create a secondary alert window
function createSecondaryWindow(display: Electron.Display) {
    const secondaryWin = new BrowserWindow({
        x: display.bounds.x,
        y: display.bounds.y,
        width: display.bounds.width,
        height: display.bounds.height,
        frame: false,
        fullscreen: true,
        kiosk: true,
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

    secondaryWin.setAlwaysOnTop(true, 'screen-saver', 1);
    secondaryWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

    const url = isDev
        ? 'http://localhost:3000?isSecondary=true'
        : `file://${path.join(__dirname, '../dist/index.html')}?isSecondary=true`;

    if (isDev) {
        secondaryWin.loadURL(url);
    } else {
        secondaryWin.loadFile(path.join(__dirname, '../dist/index.html'), { query: { isSecondary: 'true' } });
    }

    secondaryWindows.push(secondaryWin);
    return secondaryWin;
}

// Handle display changes during active alert
const handleDisplayAdded = (_event: any, display: Electron.Display) => {
    console.log('[Sentinel] New monitor detected during alert, locking it.');
    createSecondaryWindow(display);
};

const handleDisplayRemoved = (_event: any, display: Electron.Display) => {
    console.log('[Sentinel] Monitor removed during alert, cleaning up window.');
    // Find window on this display and destroy it
    secondaryWindows = secondaryWindows.filter(sw => {
        const bounds = sw.getBounds();
        if (bounds.x === display.bounds.x && bounds.y === display.bounds.y) {
            if (!sw.isDestroyed()) sw.destroy();
            return false;
        }
        return true;
    });
};

ipcMain.on('set-persistent-alert-active', (_event, isActive: boolean) => {
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

            win.setMinimizable(false);
            win.setClosable(false);
            win.setMovable(false);

            // Main Window Protection
            win.setResizable(true); // Allow transition
            win.setFullScreenable(true);

            // Force maximize before fullscreen to ensure coverage
            win.maximize();
            win.setFullScreen(true);
            win.setKiosk(true);

            win.setResizable(false);
            win.setMaximizable(false);
            win.setFullScreenable(false);
            win.setAlwaysOnTop(true, 'screen-saver', 1);
            win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
            win.setSkipTaskbar(true);
            win.show();
            win.focus();

            // Multi-monitor support: Create secondary windows for other displays
            const displays = screen.getAllDisplays();
            const primaryDisplay = screen.getPrimaryDisplay();

            displays.forEach(display => {
                if (display.id !== primaryDisplay.id) {
                    createSecondaryWindow(display);
                }
            });

            // Listen for display changes
            screen.on('display-added', handleDisplayAdded);
            screen.on('display-removed', handleDisplayRemoved);

            // Focus Heartbeat: Force windows to front every 500ms
            if (heartbeatInterval) clearInterval(heartbeatInterval);
            heartbeatInterval = setInterval(() => {
                if (win) {
                    win.setAlwaysOnTop(true, 'screen-saver', 1);
                    win.moveTop();
                    win.focus();
                }
                secondaryWindows.forEach(sw => {
                    if (!sw.isDestroyed()) {
                        sw.setAlwaysOnTop(true, 'screen-saver', 1);
                        sw.moveTop();
                        sw.focus();
                    }
                });
            }, 500);

        } else {
            console.log('[Main] Deactivating persistent alert and restoring state');
            isPersistentAlertLocked = false;
            // Cleanup heartbeat
            if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
                heartbeatInterval = null;
            }
            screen.removeListener('display-added', handleDisplayAdded);
            screen.removeListener('display-removed', handleDisplayRemoved);

            // Cleanup secondary windows
            secondaryWindows.forEach(sw => {
                if (!sw.isDestroyed()) sw.destroy();
            });
            secondaryWindows = [];

            // Restore Main Window basic state
            win.setKiosk(false);
            win.setFullScreen(false);
            win.setResizable(true);
            win.setMaximizable(true);
            win.setFullScreenable(true);
            win.setSkipTaskbar(false);
            win.setVisibleOnAllWorkspaces(false);
            win.setAlwaysOnTop(false);

            // Precise window state restoration
            if (lastKnownWindowState) {
                if (lastKnownWindowState.isMaximized) {
                    win.maximize();
                } else if (lastKnownWindowState.isMinimized) {
                    win.minimize();
                } else {
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
        console.log('[IPC Main] Handling db-get-polls request');
        const polls = getPolls();
        console.log(`[IPC Main] Sending ${polls.length} polls to frontend`);
        return polls;
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
        console.log('[IPC Main] Handling db-get-responses request');
        const responses = getResponses();
        console.log(`[IPC Main] Sending ${responses.length} responses to frontend`);
        return responses;
    } catch (error) {
        console.error('Error getting responses:', error);
        return [];
    }
});

ipcMain.handle('db-update-poll', async (_event, { pollId, updates, republish }) => {
    try {
        updatePoll(pollId, updates, republish);

        // Sync to cloud if it's a cloud-synced poll
        const polls = getPolls();
        const updatedPoll = polls.find(p => p.id === pollId);

        if (updatedPoll && updatedPoll.cloudSignalId) {
            console.log(`[IPC Handler] Syncing poll update to cloud for signalId: ${updatedPoll.cloudSignalId}`);
            backendApi.editPoll(updatedPoll.cloudSignalId, updatedPoll, republish).catch(err => {
                console.error('[IPC Handler] Failed to sync poll update to cloud:', err);
            });
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error updating poll:', error);
        return { success: false, error: error.message };
    }
});
