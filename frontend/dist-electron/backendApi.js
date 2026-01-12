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
exports.extractBackendError = extractBackendError;
const axios_1 = __importDefault(require("axios"));
// Backend API service for Electron main process
// This bypasses CORS since Node.js doesn't have browser CORS restrictions
const API_BASE_URL = process.env.VITE_BACKEND_URL || 'https://sentinel-ha37.onrender.com';
console.log(`[Backend API] Initialized with BASE_URL: ${API_BASE_URL}`);
const apiClient = axios_1.default.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});
// Add request interceptor for logging
apiClient.interceptors.request.use(config => {
    console.log(`[Backend API] Request: ${config.method?.toUpperCase()} ${config.url}`, config.params || '');
    return config;
}, error => {
    console.error('[Backend API] Request Error:', error);
    return Promise.reject(error);
});
// Add response interceptor for logging
apiClient.interceptors.response.use(response => {
    console.log(`[Backend API] Response: ${response.status} from ${response.config.url}`);
    return response;
}, error => {
    if (error.response) {
        console.error(`[Backend API] Response Error: ${error.response.status} from ${error.config.url}`, error.response.data);
    }
    else if (error.request) {
        console.error(`[Backend API] Connection Error: No response received from ${error.config.url}. Is the backend running?`);
    }
    else {
        console.error('[Backend API] Error:', error.message);
    }
    return Promise.reject(error);
});
// ============================================================================
// Data Transformation
// ============================================================================
function mapPollToDTO(poll) {
    const localId = parseInt(poll.id.split('-')[1]) || Date.now();
    const endTimestamp = new Date(poll.deadline).toISOString();
    const dto = {
        createdBy: poll.publisherEmail,
        anonymous: poll.anonymityMode === 'anonymous',
        endTimestamp,
        sharedWith: poll.consumers,
        type: 'POLL',
        localId,
        defaultFlag: poll.showDefaultToConsumers,
        defaultOption: poll.defaultResponse || poll.options[0]?.text || '',
        persistentAlert: !!poll.isPersistentFinalAlert,
        question: poll.question,
        options: poll.options.map((o) => o.text),
    };
    console.log(`[Backend API] [${new Date().toLocaleTimeString()}] 🔍 DTO Field Mapping:`);
    console.log('  showDefaultToConsumers:', poll.showDefaultToConsumers, '→ defaultFlag:', dto.defaultFlag);
    console.log('  defaultResponse:', poll.defaultResponse, '→ defaultOption:', dto.defaultOption);
    console.log('  isPersistentFinalAlert:', poll.isPersistentFinalAlert, '→ persistentAlert:', dto.persistentAlert);
    console.log('  anonymityMode:', poll.anonymityMode, '→ anonymous:', dto.anonymous);
    console.log('  consumers.length:', poll.consumers?.length, '→ sharedWith.length:', dto.sharedWith?.length);
    return dto;
}
async function createPoll(poll) {
    console.log('\n' + '-'.repeat(80));
    console.log(`[Backend API] [${new Date().toLocaleTimeString()}] 🌐 createPoll called`);
    console.log('[Backend API] Poll Question:', poll.question);
    console.log('[Backend API] Full Request URL:', `${API_BASE_URL}/api/signals/create/poll`);
    const dto = mapPollToDTO(poll);
    console.log(`[Backend API] [${new Date().toLocaleTimeString()}] 📦 Transformed Poll DTO:`);
    console.log(JSON.stringify(dto, null, 2));
    console.log(`[Backend API] [${new Date().toLocaleTimeString()}] 🚀 Sending POST request to backend...`);
    const response = await apiClient.post('/api/signals/create/poll', dto);
    console.log(`[Backend API] [${new Date().toLocaleTimeString()}] 📬 Response received:`);
    console.log('[Backend API] Status:', response.status);
    console.log('[Backend API] Response Data:', JSON.stringify(response.data, null, 2));
    console.log('-'.repeat(80) + '\n');
    return response.data.data;
}
async function submitVote(signalId, userId, selectedOption, defaultResponse, reason) {
    console.log('[Backend API] Submitting vote:', { signalId, userId, selectedOption, defaultResponse, reason });
    const request = {
        signalId,
        userEmail: userId
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
    const response = await apiClient.post('/api/signals/login', null, { params: { userEmail: email, password } });
    console.log('[Backend API] Login success, role:', response.data.data);
    return response.data.data;
}
// ============================================================================
// Error Handling Utility
// ============================================================================
function extractBackendError(error) {
    if (error.response && error.response.data) {
        const data = error.response.data;
        return data.message || data.error || error.message;
    }
    return error.message;
}
//# sourceMappingURL=backendApi.js.map