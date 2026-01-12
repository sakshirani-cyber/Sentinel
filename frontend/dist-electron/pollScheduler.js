"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pollScheduler = void 0;
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
}
exports.pollScheduler = new PollScheduler();
//# sourceMappingURL=pollScheduler.js.map