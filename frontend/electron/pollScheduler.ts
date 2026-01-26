import { getPolls, updatePoll } from './db';
import * as backendApi from './backendApi';

class PollScheduler {
    private checkInterval: NodeJS.Timeout | null = null;
    private readonly CHECK_FREQUENCY_MS = 10000; // Check every 10 seconds

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

    private async checkScheduledPolls() {
        try {
            const polls = getPolls();
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
        } catch (error) {
            console.error('[PollScheduler] Error checking scheduled polls:', error);
        }
    }

    private async publishScheduledPoll(poll: any) {
        try {
            console.log(`[PollScheduler] Publishing scheduled poll: ${poll.id} - "${poll.question}"`);
            console.log(`[PollScheduler] Scheduled time: ${poll.scheduledFor}, Current time: ${new Date().toISOString()}`);

            // Update poll status to 'active' and set publishedAt to current time
            const updates: any = {
                status: 'active' as const,
                publishedAt: new Date().toISOString(),
                syncStatus: 'pending' as const
            };

            await updatePoll(poll.id, updates);
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
                    await updatePoll(poll.id, {
                        cloudSignalId: result.signalId,
                        syncStatus: 'synced'
                    });
                    console.log(`[PollScheduler] Poll ${poll.id} marked as synced with cloudSignalId: ${result.signalId}`);
                }
            } catch (syncError: any) {
                console.error(`[PollScheduler] Failed to sync poll ${poll.id} to cloud:`, syncError.message);
                console.log(`[PollScheduler] Poll ${poll.id} will be retried by SyncManager`);
                // Poll is already marked as pending, SyncManager will retry
            }

            console.log(`[PollScheduler] ✅ Successfully published poll: ${poll.id}`);
        } catch (error) {
            console.error(`[PollScheduler] Error publishing poll ${poll.id}:`, error);
        }
    }
}

export const pollScheduler = new PollScheduler();
