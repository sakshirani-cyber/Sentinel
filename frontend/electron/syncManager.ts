import { powerMonitor, net } from 'electron';
const EventSourceLib = require('eventsource');
const EventSource = EventSourceLib.EventSource || EventSourceLib.default || EventSourceLib;
import * as backendApi from './backendApi';
import { getPolls, getResponses, createPoll, submitResponse, updatePoll } from './db';

export class SyncManager {
    private email: string | null = null;
    private sse: EventSource | null = null;
    private isOnline: boolean = false;
    private deviceStatus: string = 'active';
    private syncInterval: NodeJS.Timeout | null = null;
    private checkOnlineInterval: NodeJS.Timeout | null = null;
    private lastSyncTime: string | null = null;

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
        this.stopSyncLoop();
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

        const shouldBeConnected =
            (this.deviceStatus === 'active' || this.deviceStatus === 'idle') &&
            this.isOnline;

        if (shouldBeConnected && !this.sse) {
            this.connectSSE();
        } else if (!shouldBeConnected && this.sse) {
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

        const url = `${process.env.VITE_BACKEND_URL || 'http://localhost:8080'}/sse/connect?email=${encodeURIComponent(this.email)}`;
        console.log(`[SyncManager] Connecting to SSE: ${this.email}`);

        try {
            const sse = new EventSource(url) as any;
            this.sse = sse;

            sse.addEventListener('CONNECTED', (event: any) => {
                console.log('[SyncManager] SSE Handshake successful:', event.data);
            });

            sse.addEventListener('POLL_CREATED', async (event: any) => {
                console.log('[SyncManager] SSE: New poll received:', event.data);
                try {
                    const poll = JSON.parse(event.data);
                    await this.handleIncomingPoll(poll);
                } catch (e) {
                    console.error('[SyncManager] Error handling POLL_CREATED:', e);
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
        if (this.sse) {
            console.log('[SyncManager] Disconnecting SSE');
            this.sse.close();
            this.sse = null;
        }
    }

    private async handleIncomingPoll(dto: any) {
        // Transform DTO to Local Poll Format
        const poll = {
            id: dto.localId ? `poll-${dto.localId}` : `temp-${Date.now()}`,
            question: dto.question,
            options: dto.options.map((text: string) => ({ text })),
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
            syncStatus: 'synced'
        };

        try {
            await createPoll(poll as any);
            console.log(`[SyncManager] Poll ${poll.id} saved to local DB`);
        } catch (error) {
            console.error('[SyncManager] Error saving incoming poll:', error);
        }
    }

    private startSyncLoop() {
        if (this.syncInterval) return;
        this.syncInterval = setInterval(() => this.performSync(), 30000);
        this.performSync(); // Run immediately
    }

    private stopSyncLoop() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    private async performSync() {
        if (!this.isOnline || !this.email) return;

        console.log('[SyncManager] Performing background sync...');

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
            // Note: Responses table currently doesn't have a syncStatus column.
            // We should ideally add it or check if they exist in cloud.
            // For now, let's assume we sync ones that are missing signalIds if we have them.
            // Actually, we should probably add syncStatus to responses too.

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

        } catch (error) {
            console.error('[SyncManager] Error during sync loop:', error);
        }
    }

    private async handleIncomingSync(dto: backendApi.PollSyncDTO) {
        // Transform Sync DTO to Local Poll Format
        // Note: PollSyncDTO fields slightly differ from PollCreateDTO/ActivePollDTO
        const poll = {
            id: dto.signalId ? `poll-${dto.signalId}` : `temp-${Date.now()}`, // Sync DTO uses signalId as primary
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
            updatedAt: dto.lastEdited
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
