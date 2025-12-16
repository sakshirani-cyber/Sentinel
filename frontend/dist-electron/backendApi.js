"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPoll = createPoll;
exports.submitVote = submitVote;
exports.getPollResults = getPollResults;
exports.editPoll = editPoll;
exports.deletePoll = deletePoll;
const axios_1 = __importDefault(require("axios"));
// Backend API service for Electron main process
// This bypasses CORS since Node.js doesn't have browser CORS restrictions
const API_BASE_URL = process.env.VITE_BACKEND_URL || 'http://localhost:8080';
const apiClient = axios_1.default.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});
// ============================================================================
// Data Transformation
// ============================================================================
function mapPollToDTO(poll) {
    const localId = parseInt(poll.id.split('-')[1]) || Date.now();
    const endTimestamp = new Date(poll.deadline).toISOString();
    return {
        createdBy: poll.publisherEmail,
        anonymous: poll.anonymityMode === 'anonymous',
        endTimestamp,
        sharedWith: poll.consumers,
        type: 'POLL',
        localId,
        defaultFlag: !!poll.defaultResponse,
        defaultOption: poll.defaultResponse || poll.options[0]?.text || '',
        question: poll.question,
        options: poll.options.map((o) => o.text),
    };
}
// ============================================================================
// API Methods
// ============================================================================
async function createPoll(poll) {
    const dto = mapPollToDTO(poll);
    const response = await apiClient.post('/api/signals', dto);
    return response.data.data;
}
async function submitVote(signalId, userId, selectedOption) {
    const request = { signalId, userId, selectedOption };
    await apiClient.post('/api/signals/poll/response', request);
}
async function getPollResults(signalId) {
    const response = await apiClient.get(`/api/signals/${signalId}/poll/results`);
    return response.data.data;
}
async function editPoll(signalId, poll, republish) {
    const dto = mapPollToDTO(poll);
    await apiClient.put(`/api/signals/${signalId}`, dto, { params: { republish } });
}
async function deletePoll(signalId) {
    await apiClient.delete(`/api/signals/${signalId}`);
}
//# sourceMappingURL=backendApi.js.map