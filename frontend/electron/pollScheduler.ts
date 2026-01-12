import { getPolls /*, updatePoll */ } from './db';
// import * as backendApi from './backendApi';

class PollScheduler {
    // private checkInterval: NodeJS.Timeout | null = null;
    // private readonly CHECK_FREQUENCY_MS = 10000;

    start() {
        console.log('[PollScheduler] Scheduler disabled for demo');
        /*
        if (this.checkInterval) return;
        this.checkScheduledPolls();
        this.checkInterval = setInterval(() => this.checkScheduledPolls(), this.CHECK_FREQUENCY_MS);
        */
    }

    stop() {
        /*
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        */
    }

    /*
    private async checkScheduledPolls() {
        try {
            const polls = getPolls();
            const now = new Date();
            const pollsToPublish = polls.filter(poll => {
                if (poll.status !== 'scheduled' || !poll.scheduledFor) return false;
                return new Date(poll.scheduledFor) <= now;
            });
            for (const poll of pollsToPublish) {
                await this.publishScheduledPoll(poll);
            }
        } catch (error) {
            console.error('[PollScheduler] Error checking scheduled polls:', error);
        }
    }

    private async publishScheduledPoll(poll: any) {
        // ... implementation
    }
    */
}

export const pollScheduler = new PollScheduler();
