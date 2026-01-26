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
const crypto_1 = require("crypto");
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
        this.pingTimeoutTrace = null;
        this.PING_TIMEOUT_MS = 65000;
        this.setupDeviceMonitoring();
        this.startOnlineCheck();
    }
    async login(email) {
        this.email = email;
        console.log(`[SyncManager] Logged in as ${email}`);
        // #region agent log
        const localPolls = (0, db_1.getPolls)();
        fetch('http://127.0.0.1:7242/ingest/b037c4cd-e290-4f65-92ad-6438505f9618', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'syncManager.ts:27', message: 'SyncManager login', data: { email, localPollsCount: localPolls.length, hasSSE: !!this.sse }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run2', hypothesisId: 'A,B' }) }).catch(() => { });
        // #endregion
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
        const shouldBeConnected = this.isOnline;
        if (shouldBeConnected) {
            if (!this.sse) {
                console.log(`[SyncManager] [${new Date().toLocaleTimeString()}] 🟢 Device is ONLINE. Re-establishing connections...`);
                this.connectSSE();
                console.log(`[SyncManager] [${new Date().toLocaleTimeString()}] 🔄 Initiating catch-up sync (performSync)...`);
                this.performSync();
            }
        }
        else if (this.sse) {
            console.log(`[SyncManager] [${new Date().toLocaleTimeString()}] 🔴 Device is OFFLINE. Disconnecting...`);
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
            sse.addEventListener('CONNECTED', async (event) => {
                console.log('[SyncManager] SSE Handshake successful:', event.data);
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/b037c4cd-e290-4f65-92ad-6438505f9618', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'syncManager.ts:131', message: 'SSE CONNECTED event', data: { eventData: event.data, localPollsCount: (0, db_1.getPolls)().length }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run2', hypothesisId: 'A,C' }) }).catch(() => { });
                // #endregion
                // Trigger initial data sync to fetch existing polls
                if (this.email) {
                    console.log('[SyncManager] 🔄 Triggering initial data sync...');
                    await backendApi.triggerDataSync(this.email);
                }
            });
            sse.addEventListener('POLL_CREATED', async (event) => {
                const time = new Date().toLocaleTimeString();
                console.log(`[📡 SSE] [${time}] 📥 EVENT RECEIVED: POLL_CREATED`);
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/b037c4cd-e290-4f65-92ad-6438505f9618', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'syncManager.ts:135', message: 'POLL_CREATED event received', data: { hasEventData: !!event.data }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run2', hypothesisId: 'C,D' }) }).catch(() => { });
                // #endregion
                try {
                    const data = JSON.parse(event.data);
                    const payload = data.payload || data;
                    console.log(`[📡 SSE] 📦 Payload Question: "${payload.question}"`);
                    if (payload.labels)
                        console.log(`[📡 SSE] 🏷️ Payload Labels:`, payload.labels);
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/b037c4cd-e290-4f65-92ad-6438505f9618', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'syncManager.ts:144', message: 'Before handleIncomingPoll', data: { signalId: payload.signalId, question: payload.question, publisherEmail: payload.publisherEmail }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run2', hypothesisId: 'D' }) }).catch(() => { });
                    // #endregion
                    await this.handleIncomingPoll(payload);
                    // #region agent log
                    const pollsAfter = (0, db_1.getPolls)();
                    fetch('http://127.0.0.1:7242/ingest/b037c4cd-e290-4f65-92ad-6438505f9618', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'syncManager.ts:147', message: 'After handleIncomingPoll', data: { pollsCount: pollsAfter.length, hasPoll: pollsAfter.some(p => p.cloudSignalId === payload.signalId) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run2', hypothesisId: 'D' }) }).catch(() => { });
                    // #endregion
                }
                catch (e) {
                    console.error(`[📡 SSE] [${time}] ❌ Error handling POLL_CREATED:`, e);
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/b037c4cd-e290-4f65-92ad-6438505f9618', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'syncManager.ts:150', message: 'POLL_CREATED error', data: { error: e?.message || String(e) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run2', hypothesisId: 'D' }) }).catch(() => { });
                    // #endregion
                }
            });
            sse.addEventListener('POLL_EDITED', async (event) => {
                const time = new Date().toLocaleTimeString();
                console.log(`[SyncManager] [${time}] 📝 SSE EVENT: POLL_EDITED`);
                console.log(`[SyncManager] [${time}] 📝 RAW DATA:`, event.data);
                this.resetPingWatchdog(); // Activity counts as ping
                try {
                    const data = JSON.parse(event.data);
                    const payload = data.payload || data;
                    console.log(`[SyncManager] [${time}] 📦 PARSED PAYLOAD:`, JSON.stringify(payload, null, 2));
                    console.log(`[SyncManager] [${time}] 🔄 Republish flag: ${payload.republish}`);
                    // Check if this is a republish event - if so, delete local responses
                    const isRepublish = payload.republish === true ||
                        String(payload.republish).toLowerCase() === 'true' ||
                        payload.republished === true ||
                        payload.republished === 'true';
                    if (isRepublish) {
                        const pollId = payload.signalId ? `poll-${payload.signalId}` : (payload.localId ? `poll-${payload.localId}` : null);
                        if (pollId) {
                            console.log(`[SyncManager] [${time}] �️ Republish detected for poll ${pollId}, deleting local responses`);
                            (0, db_1.deleteResponsesForPoll)(pollId);
                        }
                    }
                    await this.handleIncomingPoll(payload);
                }
                catch (e) {
                    console.error(`[SyncManager] [${time}] ❌ Error handling POLL_EDITED:`, e);
                }
            });
            // Heartbeat / Ping Listener
            sse.addEventListener('HEARTBEAT', () => {
                const now = new Date().toLocaleTimeString();
                console.log(`[SyncManager] 📡 SSE Ping received at ${now}`);
                this.resetPingWatchdog();
            });
            sse.addEventListener('POLL_DELETED', async (event) => {
                const time = new Date().toLocaleTimeString();
                console.log(`[SyncManager] [${time}] 🗑️ SSE EVENT: POLL_DELETED`);
                console.log(`[SyncManager] [${time}] 📝 RAW DATA:`, event.data);
                try {
                    const data = JSON.parse(event.data);
                    const signalId = data.payload || data;
                    if (signalId) {
                        console.log(`[SyncManager] [${time}] 🔄 Deleting poll by cloudSignalId: ${signalId}`);
                        (0, db_1.deletePollByCloudId)(Number(signalId));
                    }
                }
                catch (e) {
                    console.error(`[SyncManager] [${time}] ❌ Error handling POLL_DELETED:`, e);
                }
            });
            // Listen for DATA_SYNC events to fetch existing polls
            sse.addEventListener('DATA_SYNC', async (event) => {
                const time = new Date().toLocaleTimeString();
                console.log(`[SyncManager] [${time}] 📥 SSE EVENT: DATA_SYNC - Fetching existing polls`);
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/b037c4cd-e290-4f65-92ad-6438505f9618', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'syncManager.ts:218', message: 'DATA_SYNC event received', data: { hasEventData: !!event.data }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run2', hypothesisId: 'A' }) }).catch(() => { });
                // #endregion
                try {
                    const data = JSON.parse(event.data);
                    const polls = Array.isArray(data) ? data : (data.payload || []);
                    console.log(`[SyncManager] [${time}] 📦 Received ${polls.length} polls from DATA_SYNC`);
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/b037c4cd-e290-4f65-92ad-6438505f9618', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'syncManager.ts:223', message: 'DATA_SYNC polls received', data: { pollCount: polls.length, polls: polls.map((p) => ({ signalId: p.signalId || p.signal_id, question: p.question })) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run2', hypothesisId: 'A' }) }).catch(() => { });
                    // #endregion
                    for (const pollData of polls) {
                        try {
                            // Transform DataSyncDTO to handleIncomingPoll format
                            // DataSyncDTO uses camelCase: signalId, publisher, sharedWith, etc.
                            const payload = {
                                signalId: pollData.signalId,
                                question: pollData.question,
                                options: Array.isArray(pollData.options) ? pollData.options : [],
                                publisherEmail: pollData.publisher,
                                publisherName: pollData.publisher,
                                endTimestamp: pollData.endTimestamp,
                                defaultOption: pollData.defaultOption,
                                defaultFlag: pollData.defaultFlag,
                                anonymous: pollData.anonymous,
                                persistentAlert: pollData.persistentAlert,
                                sharedWith: Array.isArray(pollData.sharedWith) ? pollData.sharedWith : [],
                                labels: pollData.labels || [] // May not be in DataSyncDTO, but handle if present
                            };
                            await this.handleIncomingPoll(payload);
                        }
                        catch (e) {
                            console.error(`[SyncManager] [${time}] ❌ Error processing poll from DATA_SYNC:`, e);
                        }
                    }
                    // #region agent log
                    const pollsAfter = (0, db_1.getPolls)();
                    fetch('http://127.0.0.1:7242/ingest/b037c4cd-e290-4f65-92ad-6438505f9618', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'syncManager.ts:241', message: 'After DATA_SYNC processing', data: { pollsCount: pollsAfter.length }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run2', hypothesisId: 'A' }) }).catch(() => { });
                    // #endregion
                    console.log(`[SyncManager] [${time}] ✅ DATA_SYNC complete: ${polls.length} polls processed`);
                }
                catch (e) {
                    console.error(`[SyncManager] [${time}] ❌ Error handling DATA_SYNC:`, e);
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/b037c4cd-e290-4f65-92ad-6438505f9618', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'syncManager.ts:246', message: 'DATA_SYNC error', data: { error: e?.message || String(e) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run2', hypothesisId: 'A' }) }).catch(() => { });
                    // #endregion
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
        if (this.pingTimeoutTrace) {
            clearTimeout(this.pingTimeoutTrace);
            this.pingTimeoutTrace = null;
        }
        if (this.sse) {
            console.log('[SyncManager] Disconnecting SSE');
            this.sse.close();
            this.sse = null;
        }
    }
    resetPingWatchdog() {
        if (this.pingTimeoutTrace)
            clearTimeout(this.pingTimeoutTrace);
        console.log(`[SyncManager] ⏱️ Watchdog reset at ${new Date().toLocaleTimeString()}. Timeout in ${this.PING_TIMEOUT_MS}ms`);
        this.pingTimeoutTrace = setTimeout(() => {
            console.warn(`[SyncManager] ⚠️ SSE Ping Timeout (${this.PING_TIMEOUT_MS}ms). Reconnecting...`);
            this.disconnectSSE();
            this.updateConnection();
        }, this.PING_TIMEOUT_MS);
    }
    async handleIncomingPoll(dto) {
        // Transform DTO to Local Poll Format
        const isSelf = dto.publisherEmail === this.email || dto.createdBy === this.email;
        const poll = {
            // Priority: signalId-based ID for consistent mapping, fallback to localId (if provided), then temp ID
            id: dto.signalId ? `poll-${dto.signalId}` : (dto.localId ? `poll-${dto.localId}` : `temp-${Date.now()}`),
            question: dto.question,
            options: (dto.options || []).map((text) => ({ id: (0, crypto_1.randomUUID)(), text })),
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
            syncStatus: 'synced',
            labels: dto.labels || [],
            anonymousReasons: dto.anonymousReasons || []
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
        console.log(`[SyncManager] [${new Date().toLocaleTimeString()}] 📥 Starting background sync loop...`);
        console.log(`[SyncManager]   - Online: ${this.isOnline}`);
        console.log(`[SyncManager]   - User: ${this.email}`);
        try {
            // #region agent log
            const localPollsBefore = (0, db_1.getPolls)();
            fetch('http://127.0.0.1:7242/ingest/b037c4cd-e290-4f65-92ad-6438505f9618', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'syncManager.ts:296', message: 'Before sync - local polls', data: { localPollsCount: localPollsBefore.length, hasSSE: !!this.sse, email: this.email }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run2', hypothesisId: 'A,B' }) }).catch(() => { });
            // #endregion
            // 1. Fetch unsynced polls created locally (though mostly publishers write to cloud first currently)
            // But per new requirement, they write to Local DB first.
            const allPolls = localPollsBefore;
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
            // 3. Sync Labels
            await this.syncLabels();
            this.lastSyncTime = new Date().toISOString();
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
    async syncLabels() {
        if (!this.email || !this.isOnline)
            return;
        try {
            console.log('[🏷️ LABELS] 🔄 Starting Bidirectional Label Sync...');
            // 1. PUSH: Sync locally created labels to backend
            const localLabels = (0, db_1.getLabels)();
            const pendingLabels = localLabels.filter(l => l.syncStatus === 'pending');
            if (pendingLabels.length > 0) {
                console.log(`[🏷️ LABELS] 📤 Found ${pendingLabels.length} pending local labels to push`);
                for (const label of pendingLabels) {
                    try {
                        await backendApi.createLabel({
                            name: label.name,
                            description: label.description
                        });
                        await (0, db_1.updateLabelSyncStatus)(label.id, 'synced');
                        console.log(`[🏷️ LABELS] ✅ Pushed local label to backend: "${label.name}"`);
                    }
                    catch (pushErr) {
                        console.error(`[🏷️ LABELS] ❌ Failed to push label "${label.name}":`, pushErr);
                    }
                }
            }
            // 2. PULL: Fetch updates from backend
            let backendLabels = [];
            try {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/b037c4cd-e290-4f65-92ad-6438505f9618', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'syncManager.ts:411', message: 'Before getAllLabels call', data: { email: this.email, isOnline: this.isOnline }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'E' }) }).catch(() => { });
                // #endregion
                backendLabels = await backendApi.getAllLabels();
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/b037c4cd-e290-4f65-92ad-6438505f9618', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'syncManager.ts:414', message: 'After getAllLabels call', data: { labelCount: backendLabels.length }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'E' }) }).catch(() => { });
                // #endregion
            }
            catch (pullErr) {
                console.error('[🏷️ LABELS] ❌ Failed to fetch labels from backend, continuing with local labels only:', pullErr);
                // Continue with empty array - we'll still sync pending local labels
            }
            let newCount = 0;
            let updateCount = 0;
            for (const bLabel of backendLabels) {
                // Check if exists locally by NAME
                const exists = localLabels.find((l) => l.name === bLabel.name);
                if (!exists) {
                    console.log(`[🏷️ LABELS] 📥 Found NEW label from backend: "${bLabel.name}" -> Creating locally`);
                    (0, db_1.createLabel)({
                        id: (Date.now() + Math.floor(Math.random() * 1000)).toString(),
                        name: bLabel.name,
                        description: bLabel.description,
                        syncStatus: 'synced',
                        createdAt: bLabel.createdAt || new Date().toISOString(),
                        cloudId: bLabel.id
                    });
                    newCount++;
                }
                else {
                    // Update local if backend is different or cloudId is missing
                    if (exists.description !== bLabel.description || exists.syncStatus !== 'synced' || exists.cloudId !== bLabel.id) {
                        console.log(`[🏷️ LABELS] ♻️ Updating/Syncing label "${bLabel.name}" from backend`);
                        (0, db_1.updateLabel)(exists.id, {
                            description: bLabel.description,
                            cloudId: bLabel.id,
                            syncStatus: 'synced'
                        });
                        updateCount++;
                    }
                }
            }
            if (newCount > 0 || updateCount > 0 || pendingLabels.length > 0) {
                console.log(`[🏷️ LABELS] ✅ Sync Complete: ${pendingLabels.length} pushed, ${newCount} created locally, ${updateCount} updated.`);
            }
            else {
                console.log('[🏷️ LABELS] ✅ Sync Complete: No changes needed.');
            }
        }
        catch (e) {
            console.error('[🏷️ LABELS] ❌ Sync failed:', e);
        }
    }
    async handleIncomingSync(dto) {
        // Transform Sync DTO to Local Poll Format
        // Note: PollSyncDTO fields slightly differ from PollCreateDTO/ActivePollDTO
        const poll = {
            id: dto.signalId ? `poll-${dto.signalId}` : `temp-${Date.now()}`, // Consistent with handleIncomingPoll
            question: dto.question,
            options: dto.options ? dto.options.map((text) => ({ id: (0, crypto_1.randomUUID)(), text })) : [],
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
            updatedAt: dto.lastEdited,
            labels: dto.labels || []
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