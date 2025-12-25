import { powerMonitor } from 'electron';
const EventSource = require('eventsource');
import * as backendApi from './backendApi';
import { getPolls, getResponses, createPoll, submitResponse, updatePoll } from './db';
import * as dns from 'dns';

export class SyncManager {
    private email: string | null = null;
    private sse: EventSource | null = null;
    private isOnline: boolean = false;
    private deviceStatus: string = 'active';
    private syncInterval: NodeJS.Timeout | null = null;
    private checkOnlineInterval: NodeJS.Timeout | null = null;

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
        const check = () => {
            dns.lookup('google.com', (err) => {
                const wasOnline = this.isOnline;
                this.isOnline = !err;
                if (wasOnline !== this.isOnline) {
                    console.log(`[SyncManager] Online status changed: ${this.isOnline}`);
                    this.updateConnection();
                }
            });
        };
        check();
        this.checkOnlineInterval = setInterval(check, 10000);
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

        const url = `${process.env.VITE_BACKEND_URL || 'https://sentinel-ha37.onrender.com'}/sse/connect?email=${encodeURIComponent(this.email)}`;
        console.log(`[SyncManager] Connecting to SSE: ${this.email}`);

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
            console.error('[SyncManager] SSE Error:', err);
            this.disconnectSSE();
            setTimeout(() => this.updateConnection(), 5000);
        };
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
            consumers: dto.sharedWith || [],
            defaultResponse: dto.defaultOption,
            showDefaultToConsumers: dto.defaultFlag,
            anonymityMode: dto.anonymous ? 'anonymous' : 'record',
            isPersistentFinalAlert: dto.persistentAlert,
            publishedAt: new Date().toISOString(),
            cloudSignalId: dto.signalId,
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

            // 3. Fetch missed polls from cloud (Pull fallback in case SSE missed something)
            const remotePolls = await backendApi.getActivePolls(this.email);
            for (const dto of remotePolls) {
                await this.handleIncomingPoll(dto);
            }

        } catch (error) {
            console.error('[SyncManager] Error during sync loop:', error);
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
