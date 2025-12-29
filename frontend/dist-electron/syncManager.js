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
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncManager = exports.SyncManager = void 0;
const electron_1 = require("electron");
const EventSourceLib = require('eventsource');
const EventSource = EventSourceLib.EventSource || EventSourceLib.default || EventSourceLib;
const backendApi = __importStar(require("./backendApi"));
const db_1 = require("./db");
class SyncManager {
    constructor() {
        this.email = null;
        this.sse = null;
        this.isOnline = false;
        this.deviceStatus = 'active';
        this.checkOnlineInterval = null;
        this.lastSyncTime = null;
        this.isSyncing = false;
        this.syncPending = false;
        this.setupDeviceMonitoring();
        this.startOnlineCheck();
    }
    async login(email) {
        this.email = email;
        console.log(`[SyncManager] Logged in as ${email}`);
        this.startSyncLoop();
        this.updateConnection();
    }
    logout() {
        this.email = null;
        this.disconnectSSE();
    }
    setupDeviceMonitoring() {
        electron_1.powerMonitor.on('lock-screen', () => {
            this.deviceStatus = 'locked';
            console.log('[SyncManager] Device locked');
            this.updateConnection();
        });
        electron_1.powerMonitor.on('unlock-screen', () => {
            this.deviceStatus = 'active';
            console.log('[SyncManager] Device unlocked');
            this.updateConnection();
        });
        electron_1.powerMonitor.on('suspend', () => {
            this.deviceStatus = 'sleep';
            console.log('[SyncManager] Device sleeping');
            this.updateConnection();
        });
        electron_1.powerMonitor.on('resume', () => {
            this.deviceStatus = 'active';
            console.log('[SyncManager] Device resumed');
            this.updateConnection();
        });
        // Idle monitoring (check every 30s)
        setInterval(() => {
            const idleState = electron_1.powerMonitor.getSystemIdleState(60);
            if (this.deviceStatus !== 'locked' && this.deviceStatus !== 'sleep') {
                const newStatus = idleState === 'idle' ? 'idle' : 'active';
                if (newStatus !== this.deviceStatus) {
                    this.deviceStatus = newStatus;
                    console.log(`[SyncManager] Device status changed to: ${this.deviceStatus}`);
                    this.updateConnection();
                }
            }
        }, 30000);
    }
    startOnlineCheck() {
        // Initial check
        this.isOnline = electron_1.net.isOnline();
        console.log(`[SyncManager] Initial online status: ${this.isOnline}`);
        // Poll for online status changes (every 10s) - net.isOnline is fast/local
        this.checkOnlineInterval = setInterval(() => {
            const wasOnline = this.isOnline;
            this.isOnline = electron_1.net.isOnline();
            if (wasOnline !== this.isOnline) {
                console.log(`[SyncManager] Online status changed: ${this.isOnline}`);
                this.updateConnection();
            }
        }, 10000);
    }
    updateConnection() {
        if (!this.email)
            return;
        const shouldBeConnected = (this.deviceStatus === 'active' || this.deviceStatus === 'idle') &&
            this.isOnline;
        if (shouldBeConnected) {
            if (!this.sse) {
                console.log('[SyncManager] Re-establishing connections (Activation/Online)');
                this.connectSSE();
                this.performSync(); // One-shot sync when we become active/online
            }
        }
        else if (this.sse) {
            this.disconnectSSE();
        }
    }
    connectSSE() {
        if (!this.email || this.sse)
            return;
        // Extra safety check
        if (!electron_1.net.isOnline()) {
            console.log('[SyncManager] Offline, skipping SSE connection');
            setTimeout(() => this.updateConnection(), 10000);
            return;
        }
        const url = `${process.env.VITE_BACKEND_URL || 'https://sentinel-ha37.onrender.com'}/sse/connect?userEmail=${encodeURIComponent(this.email)}`;
        console.log(`[SyncManager] Connecting to SSE: ${this.email}`);
        try {
            const sse = new EventSource(url);
            this.sse = sse;
            sse.addEventListener('CONNECTED', (event) => {
                console.log('[SyncManager] SSE Handshake successful:', event.data);
            });
            sse.addEventListener('POLL_CREATED', async (event) => {
                console.log('[SyncManager] SSE: POLL_CREATED:', event.data);
                try {
                    const data = JSON.parse(event.data);
                    const payload = data.payload || data;
                    await this.handleIncomingPoll(payload);
                }
                catch (e) {
                    console.error('[SyncManager] Error handling POLL_CREATED:', e);
                }
            });
            sse.addEventListener('POLL_EDITED', async (event) => {
                console.log('[SyncManager] SSE: POLL_EDITED:', event.data);
                try {
                    const data = JSON.parse(event.data);
                    const payload = data.payload || data;
                    await this.handleIncomingPoll(payload); // handleIncomingPoll uses INSERT OR REPLACE
                }
                catch (e) {
                    console.error('[SyncManager] Error handling POLL_EDITED:', e);
                }
            });
            sse.addEventListener('POLL_DELETED', async (event) => {
                console.log('[SyncManager] SSE: POLL_DELETED:', event.data);
                try {
                    const data = JSON.parse(event.data);
                    const signalId = data.payload || data;
                    // Logic to delete local poll by cloudSignalId would go here
                    // For now, let's just log it. We might need a db function for this.
                }
                catch (e) {
                    console.error('[SyncManager] Error handling POLL_DELETED:', e);
                }
            });
            sse.onerror = (err) => {
                // Log but don't crash
                console.error('[SyncManager] SSE Error:', err);
                this.disconnectSSE();
                // Retry later
                setTimeout(() => this.updateConnection(), 5000);
            };
        }
        catch (error) {
            console.error('[SyncManager] Error creating EventSource:', error);
            // Ensure status is clean
            this.disconnectSSE();
            setTimeout(() => this.updateConnection(), 10000);
        }
    }
    disconnectSSE() {
        if (this.sse) {
            console.log('[SyncManager] Disconnecting SSE');
            this.sse.close();
            this.sse = null;
        }
    }
    async handleIncomingPoll(dto) {
        // Transform DTO to Local Poll Format
        const isSelf = dto.publisherEmail === this.email || dto.createdBy === this.email;
        const poll = {
            // Priority: signalId-based ID for consistent mapping, fallback to localId (if provided), then temp ID
            id: dto.signalId ? `poll-${dto.signalId}` : (dto.localId ? `poll-${dto.localId}` : `temp-${Date.now()}`),
            question: dto.question,
            options: (dto.options || []).map((text) => ({ text })),
            publisherEmail: dto.publisherEmail || dto.createdBy,
            publisherName: dto.publisherName || dto.createdBy,
            deadline: dto.endTimestamp,
            status: 'active',
            defaultResponse: dto.defaultOption,
            showDefaultToConsumers: dto.defaultFlag,
            anonymityMode: dto.anonymous ? 'anonymous' : 'record',
            isPersistentFinalAlert: dto.persistentAlert,
            publishedAt: new Date().toISOString(),
            cloudSignalId: dto.signalId,
            consumers: dto.sharedWith && dto.sharedWith.length > 0 ? dto.sharedWith : (dto.consumers || []),
            syncStatus: 'synced'
        };
        try {
            await (0, db_1.createPoll)(poll);
            console.log(`[SyncManager] Poll ${poll.id} saved to local DB`);
        }
        catch (error) {
            console.error('[SyncManager] Error saving incoming poll:', error);
        }
    }
    startSyncLoop() {
        this.performSync();
    }
    async performSync() {
        if (!this.isOnline || !this.email)
            return;
        if (this.isSyncing) {
            console.log('[SyncManager] Sync already in progress, queuing next run');
            this.syncPending = true;
            return;
        }
        this.isSyncing = true;
        this.syncPending = false;
        console.log('[SyncManager] Performing background sync...');
        try {
            // 1. Fetch unsynced polls created locally (though mostly publishers write to cloud first currently)
            // But per new requirement, they write to Local DB first.
            const allPolls = await (0, db_1.getPolls)();
            const unsyncedPolls = allPolls.filter(p => p.syncStatus === 'pending' || p.syncStatus === 'error');
            for (const poll of unsyncedPolls) {
                try {
                    console.log(`[SyncManager] Syncing local poll: ${poll.question}`);
                    // BACKEND VALIDATION: End Time Stamp must be in the future
                    const isExpired = new Date(poll.deadline) < new Date();
                    if (isExpired) {
                        console.warn(`[SyncManager] Skipping sync for expired poll: ${poll.id}`);
                        await (0, db_1.updatePoll)(poll.id, { syncStatus: 'error' });
                        continue;
                    }
                    const result = await backendApi.createPoll(poll);
                    if (result && result.signalId) {
                        await (0, db_1.updatePoll)(poll.id, { cloudSignalId: result.signalId, syncStatus: 'synced' });
                    }
                }
                catch (e) {
                    console.error(`[SyncManager] Failed to sync poll ${poll.id}:`, e);
                }
            }
            // 2. Sync Responses
            const allResponses = await (0, db_1.getResponses)();
            const pendingResponses = allResponses.filter(r => r.syncStatus === 'pending');
            for (const response of pendingResponses) {
                try {
                    const poll = allPolls.find(p => p.id === response.pollId);
                    if (poll && typeof poll.cloudSignalId === 'number') {
                        // Check if poll has expired before attempting to sync
                        const isExpired = new Date(poll.deadline) < new Date();
                        if (isExpired) {
                            console.warn(`[SyncManager] Skipping response sync for poll ${poll.cloudSignalId} - poll has expired (deadline: ${poll.deadline})`);
                            // Mark as synced to avoid retrying this expired response
                            await (0, db_1.updateResponseSyncStatus)(response.pollId, response.consumerEmail, 'synced');
                            continue;
                        }
                        console.log(`[SyncManager] Syncing response for poll ${poll.cloudSignalId} from ${response.consumerEmail}`);
                        // BACKEND VALIDATION: Exactly one of [selectedOption, defaultResponse, reason]
                        let selectedOption = undefined;
                        let defaultResponse = undefined;
                        let reason = undefined;
                        if (response.skipReason) {
                            reason = response.skipReason;
                        }
                        else if (!response.isDefault) {
                            selectedOption = response.response;
                        }
                        else {
                            defaultResponse = response.response;
                        }
                        await backendApi.submitVote(poll.cloudSignalId, response.consumerEmail, selectedOption, defaultResponse, reason);
                        await (0, db_1.updateResponseSyncStatus)(response.pollId, response.consumerEmail, 'synced');
                    }
                    else {
                        console.warn(`[SyncManager] Skipping response sync for ${response.pollId} - poll not synced yet or not found`);
                    }
                }
                catch (e) {
                    console.error(`[SyncManager] Failed to sync response for ${response.pollId}:`, e);
                }
            }
            // 3. Fetch updates from cloud (Incremental Sync)
            // Use last sync time or default to a past date if first run
            const since = this.lastSyncTime || new Date(0).toISOString();
            const updates = await backendApi.syncPolls(this.email, since);
            if (updates.length > 0) {
                for (const dto of updates) {
                    await this.handleIncomingSync(dto);
                }
                // Update lastSyncTime to now (or max lastEdited)
                this.lastSyncTime = new Date().toISOString();
            }
        }
        catch (error) {
            console.error('[SyncManager] Error during sync loop:', error);
        }
        finally {
            this.isSyncing = false;
            if (this.syncPending) {
                console.log('[SyncManager] Running queued sync');
                this.performSync();
            }
        }
    }
    async handleIncomingSync(dto) {
        // Transform Sync DTO to Local Poll Format
        // Note: PollSyncDTO fields slightly differ from PollCreateDTO/ActivePollDTO
        const poll = {
            id: dto.signalId ? `poll-${dto.signalId}` : `temp-${Date.now()}`, // Consistent with handleIncomingPoll
            question: dto.question,
            options: dto.options ? dto.options.map((text) => ({ text })) : [],
            publisherEmail: dto.publisher,
            publisherName: dto.publisher, // sync DTO doesn't have separate name
            deadline: dto.endTimestamp,
            status: 'active', // Default to active, or map from dto.status
            defaultResponse: dto.defaultOption,
            showDefaultToConsumers: dto.defaultFlag,
            anonymityMode: dto.anonymous ? 'anonymous' : 'record',
            isPersistentFinalAlert: dto.persistentAlert,
            publishedAt: dto.lastEdited?.toString() || new Date().toISOString(),
            cloudSignalId: dto.signalId,
            consumers: dto.sharedWith || [],
            syncStatus: 'synced',
            updatedAt: dto.lastEdited
        };
        try {
            await (0, db_1.createPoll)(poll);
            console.log(`[SyncManager] Synced poll ${poll.id} from cloud`);
        }
        catch (error) {
            console.error('[SyncManager] Error saving synced poll:', error);
        }
    }
    getStatus() {
        return {
            deviceStatus: this.deviceStatus,
            isOnline: this.isOnline,
            sseConnected: !!this.sse,
            email: this.email
        };
    }
}
exports.SyncManager = SyncManager;
exports.syncManager = new SyncManager();
//# sourceMappingURL=syncManager.js.map