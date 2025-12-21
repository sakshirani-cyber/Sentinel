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
exports.login = login;
exports.getActivePolls = getActivePolls;
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
        persistentAlert: !!poll.isPersistentFinalAlert, // Add required field
        question: poll.question,
        options: poll.options.map((o) => o.text),
    };
}
// ============================================================================
// API Methods
// ============================================================================
async function createPoll(poll) {
    console.log('[Backend API] Creating poll:', poll.question);
    console.log('[Backend API] Request URL:', `${API_BASE_URL}/api/signals/create/poll`);
    const dto = mapPollToDTO(poll);
    console.log('[Backend API] Poll DTO:', dto);
    const response = await apiClient.post('/api/signals/create/poll', dto);
    console.log('[Backend API] Create poll response:', response.data);
    return response.data.data;
}
async function submitVote(signalId, userId, selectedOption, defaultResponse, reason) {
    console.log('[Backend API] Submitting vote:', { signalId, userId, selectedOption, defaultResponse, reason });
    const request = {
        signalId,
        userId
    };
    if (selectedOption !== undefined)
        request.selectedOption = selectedOption;
    if (defaultResponse !== undefined)
        request.defaultResponse = defaultResponse;
    if (reason !== undefined)
        request.reason = reason;
    console.log('[Backend API] Request object:', request);
    await apiClient.post('/api/signals/poll/response', request);
    console.log('[Backend API] Vote submitted successfully');
}
async function getPollResults(signalId) {
    console.log(`[Backend API] Fetching poll results for signalId: ${signalId}`);
    try {
        console.log(`[Backend API] Request URL: ${API_BASE_URL}/api/signals/${signalId}/poll/results`);
        const response = await apiClient.get(`/api/signals/${signalId}/poll/results`);
        console.log('[Backend API] Poll results RAW DATA:', JSON.stringify(response.data.data, null, 2));
        return response.data.data;
    }
    catch (error) {
        console.error('[Backend API] Error fetching poll results:', error);
        throw error;
    }
}
async function editPoll(signalId, poll, republish) {
    console.log('[Backend API] Editing poll:', { signalId, republish });
    const baseDTO = mapPollToDTO(poll);
    // PollEditDTO extends PollCreateDTO with additional fields
    const editDTO = {
        ...baseDTO,
        signalId,
        republish,
        lastEditedBy: poll.publisherEmail // or get from current user
    };
    console.log('[Backend API] Edit DTO:', editDTO);
    await apiClient.put('/api/signals/poll/edit', editDTO);
    console.log('[Backend API] Poll edited successfully');
}
async function deletePoll(signalId) {
    console.log('[Backend API] Deleting poll:', signalId);
    await apiClient.delete(`/api/signals/${signalId}`);
    console.log('[Backend API] Poll deleted successfully');
}
async function login(email, password) {
    console.log('[Backend API] Logging in:', email);
    const response = await apiClient.post('/api/signals/login', null, { params: { email, password } });
    console.log('[Backend API] Login success, role:', response.data.data);
    return response.data.data;
}
async function getActivePolls(userEmail) {
    console.log('[Backend API] Fetching active polls for:', userEmail);
    const response = await apiClient.get('/api/polls/active', {
        params: { userEmail }
    });
    console.log('[Backend API] Active polls received:', response.data.length);
    return response.data;
}
//# sourceMappingURL=backendApi.js.map