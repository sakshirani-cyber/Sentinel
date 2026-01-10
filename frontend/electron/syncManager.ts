import { powerMonitor, net } from 'electron';
import { randomUUID } from 'crypto';
const EventSourceLib = require('eventsource');
const EventSource = EventSourceLib.EventSource || EventSourceLib.default || EventSourceLib;
import * as backendApi from './backendApi';
import { getPolls, getResponses, createPoll, submitResponse, updatePoll, deletePollByCloudId, deleteResponsesForPoll, updateResponseSyncStatus, createLabel, getLabels, updateLabel, updateLabelSyncStatus } from './db';

export class SyncManager {
    private email: string | null = null;
    private sse: EventSource | null = null;
    private isOnline: boolean = false;
    private deviceStatus: string = 'active';
    private checkOnlineInterval: NodeJS.Timeout | null = null;
    private lastSyncTime: string | null = null;
    private isSyncing: boolean = false;
    private syncPending: boolean = false;
    private pingTimeoutTrace: NodeJS.Timeout | null = null;
    private readonly PING_TIMEOUT_MS = 65000;

    constructor() {
        this.setupDeviceMonitoring();
        this.startOnlineCheck();
    }

    public async login(email: string) {
        this.email = email;
        console.log(`[SyncManager] Logged in as ${email}`);
        this.startSyncLoop();
        this.updateConnection();
    }

    public logout() {
        this.email = null;
        this.disconnectSSE();
    }

    private setupDeviceMonitoring() {
        powerMonitor.on('lock-screen', () => {
            this.deviceStatus = 'locked';
            console.log('[SyncManager] Device locked');
            this.updateConnection();
        });

        powerMonitor.on('unlock-screen', () => {
            this.deviceStatus = 'active';
            console.log('[SyncManager] Device unlocked');
            this.updateConnection();
        });

        powerMonitor.on('suspend', () => {
            this.deviceStatus = 'sleep';
            console.log('[SyncManager] Device sleeping');
            this.updateConnection();
        });

        powerMonitor.on('resume', () => {
            this.deviceStatus = 'active';
            console.log('[SyncManager] Device resumed');
            this.updateConnection();
        });

        // Idle monitoring (check every 30s)
        setInterval(() => {
            const idleState = powerMonitor.getSystemIdleState(60);
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

    private startOnlineCheck() {
        // Initial check
        this.isOnline = net.isOnline();
        console.log(`[SyncManager] Initial online status: ${this.isOnline}`);

        // Poll for online status changes (every 10s) - net.isOnline is fast/local
        this.checkOnlineInterval = setInterval(() => {
            const wasOnline = this.isOnline;
            this.isOnline = net.isOnline();

            if (wasOnline !== this.isOnline) {
                console.log(`[SyncManager] Online status changed: ${this.isOnline}`);
                this.updateConnection();
            }
        }, 10000);
    }

    private updateConnection() {
        if (!this.email) return;

        const shouldBeConnected = this.isOnline;

        if (shouldBeConnected) {
            if (!this.sse) {
                console.log(`[SyncManager] [${new Date().toLocaleTimeString()}] 🟢 Device is ONLINE. Re-establishing connections...`);
                this.connectSSE();
                console.log(`[SyncManager] [${new Date().toLocaleTimeString()}] 🔄 Initiating catch-up sync (performSync)...`);
                this.performSync();
            }
        } else if (this.sse) {
            console.log(`[SyncManager] [${new Date().toLocaleTimeString()}] 🔴 Device is OFFLINE. Disconnecting...`);
            this.disconnectSSE();
        }
    }

    private connectSSE() {
        if (!this.email || this.sse) return;

        // Extra safety check
        if (!net.isOnline()) {
            console.log('[SyncManager] Offline, skipping SSE connection');
            setTimeout(() => this.updateConnection(), 10000);
            return;
        }

        const url = `${process.env.VITE_BACKEND_URL || 'http://localhost:8080'}/sse/connect?userEmail=${encodeURIComponent(this.email)}`;
        console.log(`[SyncManager] Connecting to SSE: ${this.email}`);

        try {
            const sse = new EventSource(url) as any;
            this.sse = sse;

            sse.addEventListener('CONNECTED', (event: any) => {
                console.log('[SyncManager] SSE Handshake successful:', event.data);
            });

            sse.addEventListener('POLL_CREATED', async (event: any) => {
                const time = new Date().toLocaleTimeString();
                console.log(`[📡 SSE] [${time}] 📥 EVENT RECEIVED: POLL_CREATED`);
                try {
                    const data = JSON.parse(event.data);
                    const payload = data.payload || data;
                    console.log(`[📡 SSE] 📦 Payload Question: "${payload.question}"`);
                    if (payload.labels) console.log(`[📡 SSE] 🏷️ Payload Labels:`, payload.labels);

                    await this.handleIncomingPoll(payload);
                } catch (e) {
                    console.error(`[📡 SSE] [${time}] ❌ Error handling POLL_CREATED:`, e);
                }
            });

            sse.addEventListener('POLL_EDITED', async (event: any) => {
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
                            deleteResponsesForPoll(pollId);
                        }
                    }

                    await this.handleIncomingPoll(payload);
                } catch (e) {
                    console.error(`[SyncManager] [${time}] ❌ Error handling POLL_EDITED:`, e);
                }
            });

            // Heartbeat / Ping Listener
            sse.addEventListener('HEARTBEAT', () => {
                const now = new Date().toLocaleTimeString();
                console.log(`[SyncManager] 📡 SSE Ping received at ${now}`);
                this.resetPingWatchdog()
            });

            sse.addEventListener('POLL_DELETED', async (event: any) => {
                const time = new Date().toLocaleTimeString();
                console.log(`[SyncManager] [${time}] 🗑️ SSE EVENT: POLL_DELETED`);
                console.log(`[SyncManager] [${time}] 📝 RAW DATA:`, event.data);
                try {
                    const data = JSON.parse(event.data);
                    const signalId = data.payload || data;
                    if (signalId) {
                        console.log(`[SyncManager] [${time}] 🔄 Deleting poll by cloudSignalId: ${signalId}`);
                        deletePollByCloudId(Number(signalId));
                    }
                } catch (e) {
                    console.error(`[SyncManager] [${time}] ❌ Error handling POLL_DELETED:`, e);
                }
            });

            sse.onerror = (err: any) => {
                // Log but don't crash
                console.error('[SyncManager] SSE Error:', err);
                this.disconnectSSE();
                // Retry later
                setTimeout(() => this.updateConnection(), 5000);
            };
        } catch (error) {
            console.error('[SyncManager] Error creating EventSource:', error);
            // Ensure status is clean
            this.disconnectSSE();
            setTimeout(() => this.updateConnection(), 10000);
        }
    }

    private disconnectSSE() {
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

    private resetPingWatchdog() {
        if (this.pingTimeoutTrace) clearTimeout(this.pingTimeoutTrace);

        console.log(`[SyncManager] ⏱️ Watchdog reset at ${new Date().toLocaleTimeString()}. Timeout in ${this.PING_TIMEOUT_MS}ms`);

        this.pingTimeoutTrace = setTimeout(() => {
            console.warn(`[SyncManager] ⚠️ SSE Ping Timeout (${this.PING_TIMEOUT_MS}ms). Reconnecting...`);
            this.disconnectSSE();
            this.updateConnection();
        }, this.PING_TIMEOUT_MS);
    }

    private async handleIncomingPoll(dto: any) {
        // Transform DTO to Local Poll Format
        const isSelf = dto.publisherEmail === this.email || dto.createdBy === this.email;

        const poll = {
            // Priority: signalId-based ID for consistent mapping, fallback to localId (if provided), then temp ID
            id: dto.signalId ? `poll-${dto.signalId}` : (dto.localId ? `poll-${dto.localId}` : `temp-${Date.now()}`),
            question: dto.question,
            options: (dto.options || []).map((text: string) => ({ text })),
            publisherEmail: dto.publisherEmail || dto.createdBy,
            publisherName: dto.publisherName || dto.createdBy,
            deadline: dto.endTimestamp,
            status: 'active' as const,
            defaultResponse: dto.defaultOption,
            showDefaultToConsumers: dto.defaultFlag,
            anonymityMode: dto.anonymous ? 'anonymous' : 'record',
            isPersistentFinalAlert: dto.persistentAlert,
            publishedAt: new Date().toISOString(),
            cloudSignalId: dto.signalId,
            consumers: dto.sharedWith && dto.sharedWith.length > 0 ? dto.sharedWith : (dto.consumers || []),
            syncStatus: 'synced',
            labels: dto.labels || []
        };

        try {
            await createPoll(poll as any);
            console.log(`[SyncManager] Poll ${poll.id} saved to local DB`);
        } catch (error) {
            console.error('[SyncManager] Error saving incoming poll:', error);
        }
    }

    private startSyncLoop() {
        this.performSync();
    }

    private async performSync() {
        if (!this.isOnline || !this.email) return;

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
            // 1. Fetch unsynced polls created locally (though mostly publishers write to cloud first currently)
            // But per new requirement, they write to Local DB first.
            const allPolls = await getPolls();
            const unsyncedPolls = allPolls.filter(p => p.syncStatus === 'pending' || p.syncStatus === 'error');

            for (const poll of unsyncedPolls) {
                try {
                    console.log(`[SyncManager] Syncing local poll: ${poll.question}`);

                    // BACKEND VALIDATION: End Time Stamp must be in the future
                    const isExpired = new Date(poll.deadline) < new Date();
                    if (isExpired) {
                        console.warn(`[SyncManager] Skipping sync for expired poll: ${poll.id}`);
                        await updatePoll(poll.id, { syncStatus: 'error' });
                        continue;
                    }

                    const result = await backendApi.createPoll(poll);
                    if (result && result.signalId) {
                        await updatePoll(poll.id, { cloudSignalId: result.signalId, syncStatus: 'synced' });
                    }
                } catch (e) {
                    console.error(`[SyncManager] Failed to sync poll ${poll.id}:`, e);
                }
            }

            // 2. Sync Responses
            const allResponses = await getResponses();
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
                            await updateResponseSyncStatus(response.pollId, response.consumerEmail, 'synced');
                            continue;
                        }

                        console.log(`[SyncManager] Syncing response for poll ${poll.cloudSignalId} from ${response.consumerEmail}`);

                        // BACKEND VALIDATION: Exactly one of [selectedOption, defaultResponse, reason]
                        let selectedOption: string | undefined = undefined;
                        let defaultResponse: string | undefined = undefined;
                        let reason: string | undefined = undefined;

                        if (response.skipReason) {
                            reason = response.skipReason;
                        } else if (!response.isDefault) {
                            selectedOption = response.response;
                        } else {
                            defaultResponse = response.response;
                        }

                        await backendApi.submitVote(
                            poll.cloudSignalId,
                            response.consumerEmail,
                            selectedOption,
                            defaultResponse,
                            reason
                        );
                        await updateResponseSyncStatus(response.pollId, response.consumerEmail, 'synced');
                    } else {
                        console.warn(`[SyncManager] Skipping response sync for ${response.pollId} - poll not synced yet or not found`);
                    }
                } catch (e) {
                    console.error(`[SyncManager] Failed to sync response for ${response.pollId}:`, e);
                }
            }

            // 3. Sync Labels
            await this.syncLabels();

            this.lastSyncTime = new Date().toISOString();
        } catch (error) {
            console.error('[SyncManager] Error during sync loop:', error);
        } finally {
            this.isSyncing = false;
            if (this.syncPending) {
                console.log('[SyncManager] Running queued sync');
                this.performSync();
            }
        }
    }

    private async syncLabels() {
        if (!this.email || !this.isOnline) return;

        try {
            console.log('[🏷️ LABELS] 🔄 Starting Bidirectional Label Sync...');

            // 1. PUSH: Sync locally created labels to backend
            const localLabels = getLabels() as any[];
            const pendingLabels = localLabels.filter(l => l.syncStatus === 'pending');

            if (pendingLabels.length > 0) {
                console.log(`[🏷️ LABELS] 📤 Found ${pendingLabels.length} pending local labels to push`);
                for (const label of pendingLabels) {
                    try {
                        await backendApi.createLabel({
                            name: label.name,
                            color: label.color,
                            description: label.description
                        });
                        await updateLabelSyncStatus(label.id, 'synced');
                        console.log(`[🏷️ LABELS] ✅ Pushed local label to backend: "${label.name}"`);
                    } catch (pushErr) {
                        console.error(`[🏷️ LABELS] ❌ Failed to push label "${label.name}":`, pushErr);
                    }
                }
            }

            // 2. PULL: Fetch updates from backend
            const backendLabels = await backendApi.getAllLabels();

            let newCount = 0;
            let updateCount = 0;

            for (const bLabel of backendLabels) {
                // Check if exists locally by NAME
                const exists = localLabels.find((l: any) => l.name === bLabel.name);

                if (!exists) {
                    console.log(`[🏷️ LABELS] 📥 Found NEW label from backend: "${bLabel.name}" -> Creating locally`);
                    createLabel({
                        id: randomUUID(),
                        name: bLabel.name,
                        color: bLabel.color,
                        description: bLabel.description,
                        syncStatus: 'synced',
                        createdAt: bLabel.createdAt || new Date().toISOString()
                    });
                    newCount++;
                } else {
                    // Update local if backend is different
                    if (exists.color !== bLabel.color || exists.description !== bLabel.description || exists.syncStatus !== 'synced') {
                        console.log(`[🏷️ LABELS] ♻️ Updating/Syncing label "${bLabel.name}" from backend`);
                        updateLabel(exists.id, {
                            color: bLabel.color,
                            description: bLabel.description,
                            // Ensure it's marked as synced if it exists on backend
                        } as any);
                        await updateLabelSyncStatus(exists.id, 'synced');
                        updateCount++;
                    }
                }
            }
            if (newCount > 0 || updateCount > 0 || pendingLabels.length > 0) {
                console.log(`[🏷️ LABELS] ✅ Sync Complete: ${pendingLabels.length} pushed, ${newCount} created locally, ${updateCount} updated.`);
            } else {
                console.log('[🏷️ LABELS] ✅ Sync Complete: No changes needed.');
            }
        } catch (e) {
            console.error('[🏷️ LABELS] ❌ Sync failed:', e);
        }
    }

    private async handleIncomingSync(dto: backendApi.PollSyncDTO) {
        // Transform Sync DTO to Local Poll Format
        // Note: PollSyncDTO fields slightly differ from PollCreateDTO/ActivePollDTO
        const poll = {
            id: dto.signalId ? `poll-${dto.signalId}` : `temp-${Date.now()}`, // Consistent with handleIncomingPoll
            question: dto.question,
            options: dto.options ? dto.options.map((text: string) => ({ text })) : [],
            publisherEmail: dto.publisher,
            publisherName: dto.publisher, // sync DTO doesn't have separate name
            deadline: dto.endTimestamp,
            status: 'active' as const, // Default to active, or map from dto.status
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
            await createPoll(poll as any);
            console.log(`[SyncManager] Synced poll ${poll.id} from cloud`);
        } catch (error) {
            console.error('[SyncManager] Error saving synced poll:', error);
        }
    }

    public getStatus() {
        return {
            deviceStatus: this.deviceStatus,
            isOnline: this.isOnline,
            sseConnected: !!this.sse,
            email: this.email
        };
    }
}

export const syncManager = new SyncManager();
