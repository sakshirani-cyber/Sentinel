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
exports.createLabel = createLabel;
exports.editLabel = editLabel;
exports.triggerDataSync = triggerDataSync;
exports.getAllLabels = getAllLabels;
exports.extractBackendError = extractBackendError;
const axios_1 = __importDefault(require("axios"));
console.log('>>> [Backend API] MODULE LOADED <<<');
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
    console.log(`[🌐 API REQUEST] [${new Date().toLocaleTimeString()}] ${config.method?.toUpperCase()} ${config.url}`);
    if (config.data) {
        console.log('[🌐 API PAYLOAD] Full Body:', JSON.stringify(config.data, null, 2));
    }
    // #region agent log
    if (config.url?.includes('labels')) {
        fetch('http://127.0.0.1:7242/ingest/b037c4cd-e290-4f65-92ad-6438505f9618', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'backendApi.ts:24', message: 'Request interceptor for labels', data: { method: config.method, url: config.url, fullUrl: config.baseURL + config.url, headers: config.headers, params: config.params }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A,B,C' }) }).catch(() => { });
    }
    // #endregion
    return config;
}, error => {
    console.error(`[🌐 API ERROR] [${new Date().toLocaleTimeString()}] Request failed:`, error);
    return Promise.reject(error);
});
// Add response interceptor for logging
apiClient.interceptors.response.use(response => {
    console.log(`[Backend API] [${new Date().toLocaleTimeString()}] ✅ INCOMING RESPONSE: ${response.status} from ${response.config.url}`);
    if (response.data)
        console.log('[Backend API] Response Data:', JSON.stringify(response.data, null, 2));
    return response;
}, error => {
    const time = new Date().toLocaleTimeString();
    if (error.response) {
        console.error(`[Backend API] [${time}] ❌ RESPONSE ERROR: ${error.response.status} from ${error.config.url}`);
        console.error('[Backend API] Error Data:', JSON.stringify(error.response.data, null, 2));
    }
    else if (error.request) {
        console.error(`[Backend API] [${time}] ❌ CONNECTION ERROR: No response received from ${error.config.url}`);
    }
    else {
        console.error(`[Backend API] [${time}] ❌ ERROR:`, error.message);
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
        title: poll.title || poll.question, // Use title if provided, otherwise fallback to question (backend requires title)
        question: poll.question,
        options: poll.options.map((o) => o.text),
        labels: poll.labels || [],
        scheduledTime: poll.scheduledFor
    };
    console.log(`[Backend API] [${new Date().toLocaleTimeString()}] 🔍 DTO Field Mapping:`);
    console.log('  title:', poll.title || poll.question, '→ title:', dto.title);
    console.log('  showDefaultToConsumers:', poll.showDefaultToConsumers, '→ defaultFlag:', dto.defaultFlag);
    console.log('  defaultResponse:', poll.defaultResponse, '→ defaultOption:', dto.defaultOption);
    console.log('  isPersistentFinalAlert:', poll.isPersistentFinalAlert, '→ persistentAlert:', dto.persistentAlert);
    console.log('  anonymityMode:', poll.anonymityMode, '→ anonymous:', dto.anonymous);
    console.log('  consumers.length:', poll.consumers?.length, '→ sharedWith.length:', dto.sharedWith?.length);
    console.log('  labels:', poll.labels);
    console.log('  scheduledTime:', poll.scheduledFor, '→ scheduledTime:', dto.scheduledTime);
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
    console.log(`[Backend API] [${new Date().toLocaleTimeString()}] 🗳️ Submitting vote for signal ${signalId}...`);
    console.log('[Backend API] Full payload:', JSON.stringify(request, null, 2));
    const response = await apiClient.post('/api/signals/poll/response', request);
    console.log(`[Backend API] [${new Date().toLocaleTimeString()}] ✅ Vote submission response:`, JSON.stringify(response.data, null, 2));
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
    const time = new Date().toLocaleTimeString();
    console.log(`[Backend API] [${time}] 📤 editPoll request | signalId=${signalId} | republish=${republish}`);
    const baseDTO = mapPollToDTO(poll);
    // PollEditDTO extends PollCreateDTO with additional fields
    const editDTO = {
        ...baseDTO,
        signalId,
        republish,
        lastEditedBy: poll.publisherEmail // or get from current user
    };
    console.log(`[Backend API] [${time}] 📤 Payload question: "${editDTO.question}"`);
    console.log(`[Backend API] [${time}] 📤 Payload labels:`, editDTO.labels || []);
    try {
        await apiClient.put('/api/signals/poll/edit', editDTO);
        console.log(`[Backend API] [${time}] 📥 editPoll response | SUCCESS | signalId=${signalId}`);
    }
    catch (error) {
        console.error(`[Backend API] [${time}] ❌ editPoll error | FAILED | signalId=${signalId}:`, error.message);
        throw error;
    }
}
async function deletePoll(signalId) {
    const time = new Date().toLocaleTimeString();
    const url = `/api/signals/${signalId}`;
    const fullUrl = `${API_BASE_URL}${url}`;
    console.log(`[DELETE-DEBUG] [${time}] ========== Backend API: deletePoll ==========`);
    console.log(`[DELETE-DEBUG] [${time}] Input | signalId=${signalId} | type=${typeof signalId}`);
    console.log(`[DELETE-DEBUG] [${time}] Request | method=DELETE | url=${fullUrl}`);
    try {
        const response = await apiClient.delete(url);
        console.log(`[DELETE-DEBUG] [${time}] ✅ Response received | status=${response.status} | statusText=${response.statusText}`);
        console.log(`[DELETE-DEBUG] [${time}] Response data:`, JSON.stringify(response.data));
    }
    catch (error) {
        console.error(`[DELETE-DEBUG] [${time}] ❌ DELETE request FAILED`);
        console.error(`[DELETE-DEBUG] [${time}] Error | message=${error.message}`);
        if (error.response) {
            console.error(`[DELETE-DEBUG] [${time}] Response | status=${error.response.status} | statusText=${error.response.statusText}`);
            console.error(`[DELETE-DEBUG] [${time}] Response data:`, JSON.stringify(error.response.data));
        }
        else if (error.request) {
            console.error(`[DELETE-DEBUG] [${time}] No response received - network error or timeout`);
        }
        throw error; // Re-throw to be handled by caller
    }
}
async function login(email, password) {
    console.log(`[Backend API] [${new Date().toLocaleTimeString()}] 🔐 Attempting login for: ${email}`);
    const response = await apiClient.post('/api/signals/login', null, { params: { userEmail: email, password } });
    console.log(`[Backend API] [${new Date().toLocaleTimeString()}] ✅ Login result:`, JSON.stringify(response.data, null, 2));
    return response.data.data;
}
async function createLabel(label) {
    const time = new Date().toLocaleTimeString();
    console.log(`[Backend API] [${time}] 📤 createLabel request | name="${label.name}"`);
    // Transform to Backend DTO
    // Note: Label is already formatted as ~#name~ by LabelManager before reaching here
    const payload = {
        label: label.name,
        description: label.description && label.description.trim() !== '' ? label.description : label.name,
        localId: Number(label.localId) // Sent as a number (Long) to match backend expectation
    };
    if (!payload.description.trim()) {
        payload.description = "No Description"; // Fallback to avoid 400/500 if name is somehow empty/trim
    }
    console.log(`[Backend API] [${time}] 📤 Payload:`, payload);
    try {
        // We use 'any' for the API response because the backend has swapped fields:
        // backend.localId -> backend ID
        // backend.labelId -> local ID we sent
        const response = await apiClient.post('/create/label', payload);
        const rawData = response.data.data;
        console.log(`[Backend API] [${time}] 📥 createLabel response | SUCCESS | name="${label.name}"`);
        console.log(`[Backend API] Raw Response Data (Swapped):`, rawData);
        // Map backend's swapped 'localId' field to our 'id' (backend ID)
        return {
            id: rawData.localId,
            localId: label.localId?.toString() || ''
        };
    }
    catch (error) {
        console.error(`[Backend API] [${time}] ❌ createLabel error | FAILED | name="${label.name}":`, error.message);
        throw error;
    }
}
async function editLabel(label) {
    const time = new Date().toLocaleTimeString();
    console.log(`[Backend API] [${time}] 📤 editLabel request | id="${label.id}"`);
    const payload = {
        id: label.id,
        description: label.description
    };
    console.log(`[Backend API] [${time}] 📤 Payload:`, payload);
    try {
        await apiClient.post('/edit/label', payload);
        console.log(`[Backend API] [${time}] 📥 editLabel response | SUCCESS | id="${label.id}"`);
    }
    catch (error) {
        console.error(`[Backend API] [${time}] ❌ editLabel error | FAILED | id="${label.id}":`, error.message);
        throw error;
    }
}
async function triggerDataSync(userEmail) {
    console.log(`[🌐 API] 🔄 Triggering data sync for user: ${userEmail}`);
    try {
        await apiClient.get('/data/sync', { params: { userEmail } });
        console.log(`[🌐 API] ✅ Data sync triggered successfully`);
    }
    catch (error) {
        console.error('[🌐 API] ❌ Failed to trigger data sync:', error.response?.status || error.message);
        // Don't throw - this is not critical, SSE will still work
    }
}
async function getAllLabels() {
    console.log('[🌐 API] 📥 Fetching all labels from backend...');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b037c4cd-e290-4f65-92ad-6438505f9618', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'backendApi.ts:388', message: 'getAllLabels entry', data: { endpoint: '/labels', baseUrl: API_BASE_URL }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A,B,C' }) }).catch(() => { });
    // #endregion
    try {
        // #region agent log
        const requestConfig = { url: '/labels', method: 'get', headers: apiClient.defaults.headers };
        fetch('http://127.0.0.1:7242/ingest/b037c4cd-e290-4f65-92ad-6438505f9618', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'backendApi.ts:392', message: 'Before API call', data: { config: requestConfig, hasAuth: !!apiClient.defaults.headers?.Authorization }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'B' }) }).catch(() => { });
        // #endregion
        const response = await apiClient.get('/labels'); // Use any[] to handle raw backend DTO
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b037c4cd-e290-4f65-92ad-6438505f9618', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'backendApi.ts:395', message: 'After API call success', data: { status: response.status, hasData: !!response.data, dataLength: response.data?.data?.length }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A,C' }) }).catch(() => { });
        // #endregion
        // Check if response is valid
        if (!response.data || !response.data.data) {
            console.warn('[🌐 API] ⚠️ Invalid response from /labels endpoint, returning empty array');
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/b037c4cd-e290-4f65-92ad-6438505f9618', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'backendApi.ts:399', message: 'Invalid response detected', data: { responseData: response.data }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' }) }).catch(() => { });
            // #endregion
            return [];
        }
        console.log(`[🌐 API] ✅ Received ${response.data.data.length} labels from backend`);
        // Map backend 'label' -> frontend 'name'
        // Keep raw format (~#name~) for sync consistency. UI will handle unwrapping.
        const labels = response.data.data.map((l) => ({
            id: l.id,
            name: l.label,
            description: l.description,
            createdAt: l.createdAt,
            editedAt: l.editedAt // Added support for editedAt
        }));
        if (labels.length > 0) {
            console.log('[🌐 API] Labels:', labels.map(l => l.name).join(', '));
        }
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b037c4cd-e290-4f65-92ad-6438505f9618', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'backendApi.ts:415', message: 'getAllLabels success exit', data: { labelCount: labels.length }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A,B,C' }) }).catch(() => { });
        // #endregion
        return labels;
    }
    catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/b037c4cd-e290-4f65-92ad-6438505f9618', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'backendApi.ts:418', message: 'getAllLabels error caught', data: { status: error.response?.status, statusText: error.response?.statusText, url: error.config?.url, fullUrl: error.config?.baseURL + error.config?.url, headers: error.config?.headers, message: error.message }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A,B,C,D' }) }).catch(() => { });
        // #endregion
        console.error('[🌐 API] ❌ Failed to fetch labels from backend:', error.response?.status || error.message);
        // Return empty array instead of throwing to allow sync to continue
        // This prevents label sync failures from blocking other sync operations
        return [];
    }
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