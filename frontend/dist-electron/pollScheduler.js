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
exports.pollScheduler = void 0;
const db_1 = require("./db");
const backendApi = __importStar(require("./backendApi"));
class PollScheduler {
    constructor() {
        this.checkInterval = null;
        this.CHECK_FREQUENCY_MS = 10000; // Check every 10 seconds
    }
    start() {
        if (this.checkInterval) {
            console.log('[PollScheduler] Already running');
            return;
        }
        console.log('[PollScheduler] Starting scheduler...');
        this.checkScheduledPolls(); // Run immediately
        this.checkInterval = setInterval(() => {
            this.checkScheduledPolls();
        }, this.CHECK_FREQUENCY_MS);
    }
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            console.log('[PollScheduler] Stopped');
        }
    }
    async checkScheduledPolls() {
        try {
            const polls = (0, db_1.getPolls)();
            const now = new Date();
            // Find scheduled polls whose time has arrived
            const pollsToPublish = polls.filter(poll => {
                if (poll.status !== 'scheduled' || !poll.scheduledFor) {
                    return false;
                }
                const scheduledTime = new Date(poll.scheduledFor);
                return scheduledTime <= now;
            });
            if (pollsToPublish.length > 0) {
                console.log(`[PollScheduler] Found ${pollsToPublish.length} poll(s) ready to publish`);
            }
            // Publish each poll
            for (const poll of pollsToPublish) {
                await this.publishScheduledPoll(poll);
            }
        }
        catch (error) {
            console.error('[PollScheduler] Error checking scheduled polls:', error);
        }
    }
    async publishScheduledPoll(poll) {
        try {
            console.log(`[PollScheduler] Publishing scheduled poll: ${poll.id} - "${poll.question}"`);
            console.log(`[PollScheduler] Scheduled time: ${poll.scheduledFor}, Current time: ${new Date().toISOString()}`);
            // Update poll status to 'active' and set publishedAt to current time
            const updates = {
                status: 'active',
                publishedAt: new Date().toISOString(),
                syncStatus: 'pending'
            };
            await (0, db_1.updatePoll)(poll.id, updates);
            console.log(`[PollScheduler] Updated poll ${poll.id} status to 'active'`);
            // Sync to cloud
            try {
                const pollToSync = {
                    ...poll,
                    title: poll.title || poll.question, // Ensure title is set (use question as fallback if title not available)
                    ...updates
                };
                const result = await backendApi.createPoll(pollToSync);
                console.log(`[PollScheduler] Successfully synced poll ${poll.id} to cloud`);
                if (result && result.signalId) {
                    await (0, db_1.updatePoll)(poll.id, {
                        cloudSignalId: result.signalId,
                        syncStatus: 'synced'
                    });
                    console.log(`[PollScheduler] Poll ${poll.id} marked as synced with cloudSignalId: ${result.signalId}`);
                }
            }
            catch (syncError) {
                console.error(`[PollScheduler] Failed to sync poll ${poll.id} to cloud:`, syncError.message);
                console.log(`[PollScheduler] Poll ${poll.id} will be retried by SyncManager`);
                // Poll is already marked as pending, SyncManager will retry
            }
            console.log(`[PollScheduler] ✅ Successfully published poll: ${poll.id}`);
        }
        catch (error) {
            console.error(`[PollScheduler] Error publishing poll ${poll.id}:`, error);
        }
    }
}
exports.pollScheduler = new PollScheduler();
//# sourceMappingURL=pollScheduler.js.map