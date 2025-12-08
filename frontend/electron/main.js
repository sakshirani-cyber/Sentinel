"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var path = require("path");
var electron_is_dev_1 = require("electron-is-dev");
var tray = null;
var win = null;
var store;
// Simple icon for tray (16x16 blue circle)
var iconBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFMSURBVDiNpZMxSwNBEIW/vb29JBcQFBELsbATrPwBNv4CK/+Alf9AO0EQrGwsLCwEwUKwsLOxEQQLC0EQbCwUQUQQvLu9nZndsUgOc5dEfM3uzHvfzO4MrLH+V8AYcwI0gQPgEHgCboAr4FJKebcSgDHmGDgFdoEt4BV4AC6Acynl8xKAMWYPOAO2gQ/gHrgFbqSUH0sAxpgGcAzsAJ/APXADXEsp3xcAjDFN4AjYBl6AO+AauJBSvi0CGGN2gUNgC3gG7oBr4FJK+bIIYIzZBw6ATeAJuAWugXMp5esiQB04ADaAR+AWuAHOpZRviwB14BDYBx6AW+AGuJBSvi8C1IFDoBZ4AG6BG+BcSvm+CFAHjoAa8ADcAjfAhZTyfRGgDhwBNeABuAVugHMp5ccigDHmCGgAD8AtcANcSCk/FwGMMUdAA3gAbv8A/FbXX2v9D/gBnqV8VC6kqXwAAAAASUVORK5CYII=';
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
    });
    if (electron_is_dev_1.default) {
        win.loadURL('http://localhost:3000');
        win.webContents.openDevTools();
    }
    else {
        win.loadFile(path.join(__dirname, '../dist/index.html'));
    }
    // Prevent window from closing, hide instead
    win.on('close', function (event) {
        if (!electron_1.app.isQuitting) {
            event.preventDefault();
            win === null || win === void 0 ? void 0 : win.hide();
        }
        return false;
    });
}
electron_1.app.whenReady().then(function () { return __awaiter(void 0, void 0, void 0, function () {
    var Store, error_1, icon, contextMenu;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, Promise.resolve().then(function () { return require('electron-store'); })];
            case 1:
                Store = (_a.sent()).default;
                store = new Store();
                console.log('Electron Store initialized successfully');
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                console.error('Failed to initialize Electron Store:', error_1);
                return [3 /*break*/, 3];
            case 3:
                createWindow();
                icon = electron_1.nativeImage.createFromDataURL(iconBase64);
                tray = new electron_1.Tray(icon);
                contextMenu = electron_1.Menu.buildFromTemplate([
                    {
                        label: 'Show App',
                        click: function () {
                            win === null || win === void 0 ? void 0 : win.show();
                            win === null || win === void 0 ? void 0 : win.focus();
                        }
                    },
                    {
                        label: 'Quit',
                        click: function () {
                            electron_1.app.isQuitting = true;
                            electron_1.app.quit();
                        }
                    }
                ]);
                tray.setToolTip('Sentinel - Signal Enforcement System');
                tray.setContextMenu(contextMenu);
                // Double-click tray icon to show window
                tray.on('double-click', function () {
                    win === null || win === void 0 ? void 0 : win.show();
                    win === null || win === void 0 ? void 0 : win.focus();
                });
                electron_1.app.on('activate', function () {
                    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
                        createWindow();
                    }
                    else {
                        win === null || win === void 0 ? void 0 : win.show();
                    }
                });
                return [2 /*return*/];
        }
    });
}); });
electron_1.app.on('window-all-closed', function () {
    // Don't quit on window close - keep running in tray
    if (process.platform !== 'darwin') {
        // Keep app running
    }
});
// IPC Handlers for window control
electron_1.ipcMain.on('set-always-on-top', function (_event, shouldBeOnTop) {
    if (win) {
        win.setAlwaysOnTop(shouldBeOnTop);
        if (shouldBeOnTop) {
            win.show();
            win.focus();
        }
    }
});
electron_1.ipcMain.on('restore-window', function () {
    if (win) {
        if (win.isMinimized()) {
            win.restore();
        }
        win.show();
        win.focus();
    }
});
// Prevent window minimize/close during persistent alert
electron_1.ipcMain.on('set-persistent-alert-active', function (_event, isActive) {
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
            setTimeout(function () {
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
electron_1.ipcMain.handle('electron-store-get', function (_event, key) { return __awaiter(void 0, void 0, void 0, function () {
    var value;
    return __generator(this, function (_a) {
        console.log("[IPC] Getting key: ".concat(key, ", Store initialized: ").concat(!!store));
        if (!store)
            return [2 /*return*/, null];
        value = store.get(key);
        console.log("[IPC] Value for ".concat(key, ":"), value);
        return [2 /*return*/, value];
    });
}); });
electron_1.ipcMain.handle('electron-store-set', function (_event, key, value) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        console.log("[IPC] Setting key: ".concat(key, ", Store initialized: ").concat(!!store));
        if (!store)
            return [2 /*return*/];
        store.set(key, value);
        return [2 /*return*/];
    });
}); });
electron_1.ipcMain.handle('electron-store-delete', function (_event, key) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        console.log("[IPC] Deleting key: ".concat(key));
        if (!store)
            return [2 /*return*/];
        store.delete(key);
        return [2 /*return*/];
    });
}); });
