import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron';
import * as path from 'path';
import isDev from 'electron-is-dev';

let tray: Tray | null = null;
let win: BrowserWindow | null = null;
let store: any;

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

app.whenReady().then(async () => {
    try {
        const { default: Store } = await import('electron-store');
        store = new Store();
        console.log('Electron Store initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Electron Store:', error);
    }

    createWindow();

    // Create system tray
    const icon = nativeImage.createFromDataURL(iconBase64);
    tray = new Tray(icon);

    const contextMenu = Menu.buildFromTemplate([
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
                (app as any).isQuitting = true;
                app.quit();
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

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        } else {
            win?.show();
        }
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

// Store handling
ipcMain.handle('electron-store-get', async (_event, key: string) => {
    console.log(`[IPC] Getting key: ${key}, Store initialized: ${!!store}`);
    if (!store) return null;
    const value = store.get(key);
    console.log(`[IPC] Value for ${key}:`, value);
    return value;
});

ipcMain.handle('electron-store-set', async (_event, key: string, value: any) => {
    console.log(`[IPC] Setting key: ${key}, Store initialized: ${!!store}`);
    if (!store) return;
    store.set(key, value);
});

ipcMain.handle('electron-store-delete', async (_event, key: string) => {
    console.log(`[IPC] Deleting key: ${key}`);
    if (!store) return;
    store.delete(key);
});
