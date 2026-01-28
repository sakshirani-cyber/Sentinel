import axios, { AxiosInstance } from 'axios';
console.log('>>> [Backend API] MODULE LOADED <<<');

// Backend API service for Electron main process
// This bypasses CORS since Node.js doesn't have browser CORS restrictions

const API_BASE_URL = process.env.VITE_BACKEND_URL || 'http://localhost:8080';
console.log(`[Backend API] Initialized with BASE_URL: ${API_BASE_URL}`);

const apiClient: AxiosInstance = axios.create({
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
    return config;
}, error => {
    console.error(`[🌐 API ERROR] [${new Date().toLocaleTimeString()}] Request failed:`, error);
    return Promise.reject(error);
});

// Add response interceptor for logging
apiClient.interceptors.response.use(response => {
    console.log(`[Backend API] [${new Date().toLocaleTimeString()}] ✅ INCOMING RESPONSE: ${response.status} from ${response.config.url}`);
    if (response.data) console.log('[Backend API] Response Data:', JSON.stringify(response.data, null, 2));
    return response;
}, error => {
    const time = new Date().toLocaleTimeString();
    if (error.response) {
        console.error(`[Backend API] [${time}] ❌ RESPONSE ERROR: ${error.response.status} from ${error.config.url}`);
        console.error('[Backend API] Error Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
        console.error(`[Backend API] [${time}] ❌ CONNECTION ERROR: No response received from ${error.config.url}`);
    } else {
        console.error(`[Backend API] [${time}] ❌ ERROR:`, error.message);
    }
    return Promise.reject(error);
});

// Backend API Types
// ============================================================================

interface PollCreateDTO {
    createdBy: string;
    anonymous: boolean;
    endTimestamp: string;
    sharedWith: string[];
    type: string;
    localId: number;
    defaultFlag?: boolean;
    defaultOption?: string;
    persistentAlert: boolean;
    title: string; // Required by backend
    question: string;
    options: string[];
    labels?: string[];
    scheduledTime?: string;
    showIndividualResponses?: boolean;
}

export interface LabelCreateDTO {
    name: string;
    description: string;
    localId?: string | number; // Numeric ID from frontend (timestamp)
}

export interface LabelEditDTO {
    id: number; // Backend ID
    description: string;
}

export interface LabelResponseDTO {
    id: number;
    name: string;
    description: string;
    createdAt: string;
    editedAt?: string;
}

interface CreatePollResponse {
    signalId: number;
    localId: number;
}

interface CreateLabelResponse {
    id: number;
    localId: string;
}

interface UserVoteDTO {
    userId: string;
    selectedOption: string;
    submittedAt: string; // Instant from backend
}

interface SubmitPollRequest {
    signalId: number;
    userId: string;
    selectedOption: string;
    defaultResponse?: string;
    reason?: string;
}

interface PollResultDTO {
    signalId: number;
    totalAssigned: number;
    totalResponded: number;

    optionCounts: Record<string, number>;
    optionVotes: Record<string, UserVoteDTO[]>;

    removedOptions: Record<string, UserVoteDTO[]>;
    removedUsers: Record<string, UserVoteDTO[]>;
    removedOptionCount?: Record<string, number>; // Count of votes for removed options

    defaultResponses: UserVoteDTO[];
    reasonResponses: Record<string, string>;

    defaultCount: number;
    reasonCount: number;
}

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}



export interface PollSyncDTO {
    signalId: number;
    question: string;
    options: string[];
    status: string;
    publisher: string;
    sharedWith: string[];
    anonymous: boolean;
    defaultFlag: boolean;
    defaultOption: string;
    persistentAlert: boolean;
    endTimestamp: string;
    lastEdited: string;
    showIndividualResponses?: boolean;
    selectedOption: string;
    defaultResponse: string;
    reason: string;
    timeOfSubmission: string;
    labels?: string[];
}

// ============================================================================
// Data Transformation
// ============================================================================

function mapPollToDTO(poll: any): PollCreateDTO {
    const localId = parseInt(poll.id.split('-')[1]) || Date.now();
    const endTimestamp = new Date(poll.deadline).toISOString();

    // Enforce business rule: if anonymous is true, showIndividualResponses must be false
    const isAnonymous = poll.anonymityMode === 'anonymous';
    const showIndividualResponses = isAnonymous ? false : (poll.showIndividualResponses ?? true);

    const dto: PollCreateDTO = {
        createdBy: poll.publisherEmail,
        anonymous: isAnonymous,
        endTimestamp,
        sharedWith: poll.consumers,
        type: 'POLL',
        localId,
        defaultFlag: poll.showDefaultToConsumers,
        defaultOption: poll.defaultResponse || poll.options[0]?.text || '',
        persistentAlert: !!poll.isPersistentFinalAlert,
        title: poll.title || poll.question, // Use title if provided, otherwise fallback to question (backend requires title)
        question: poll.question,
        options: poll.options.map((o: any) => o.text),
        labels: poll.labels || [],
        scheduledTime: poll.scheduledFor,
        showIndividualResponses: showIndividualResponses
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


export async function createPoll(poll: any): Promise<CreatePollResponse> {
    console.log('\n' + '-'.repeat(80));
    console.log(`[Backend API] [${new Date().toLocaleTimeString()}] 🌐 createPoll called`);
    console.log('[Backend API] Poll Question:', poll.question);
    console.log('[Backend API] Full Request URL:', `${API_BASE_URL}/api/signals/create/poll`);

    const dto = mapPollToDTO(poll);
    console.log(`[Backend API] [${new Date().toLocaleTimeString()}] 📦 Transformed Poll DTO:`);
    console.log(JSON.stringify(dto, null, 2));

    console.log(`[Backend API] [${new Date().toLocaleTimeString()}] 🚀 Sending POST request to backend...`);
    const response = await apiClient.post<ApiResponse<CreatePollResponse>>(
        '/api/signals/create/poll',
        dto
    );

    console.log(`[Backend API] [${new Date().toLocaleTimeString()}] 📬 Response received:`);
    console.log('[Backend API] Status:', response.status);
    console.log('[Backend API] Response Data:', JSON.stringify(response.data, null, 2));
    console.log('-'.repeat(80) + '\n');

    return response.data.data;
}

export async function submitVote(
    signalId: number,
    userId: string,
    selectedOption?: string,
    defaultResponse?: string,
    reason?: string
): Promise<void> {
    console.log('[Backend API] Submitting vote:', { signalId, userId, selectedOption, defaultResponse, reason });

    const request: any = {
        signalId,
        userEmail: userId
    };
    if (selectedOption !== undefined) request.selectedOption = selectedOption;
    if (defaultResponse !== undefined) request.defaultResponse = defaultResponse;
    if (reason !== undefined) request.reason = reason;

    console.log(`[Backend API] [${new Date().toLocaleTimeString()}] 🗳️ Submitting vote for signal ${signalId}...`);
    console.log('[Backend API] Full payload:', JSON.stringify(request, null, 2));
    const response = await apiClient.post<ApiResponse<void>>('/api/signals/poll/response', request);
    console.log(`[Backend API] [${new Date().toLocaleTimeString()}] ✅ Vote submission response:`, JSON.stringify(response.data, null, 2));
}

export async function getPollResults(signalId: number): Promise<PollResultDTO> {
    console.log(`[Backend API] Fetching poll results for signalId: ${signalId}`);
    try {
        console.log(`[Backend API] Request URL: ${API_BASE_URL}/api/signals/${signalId}/poll/results`);
        const response = await apiClient.get<ApiResponse<PollResultDTO>>(
            `/api/signals/${signalId}/poll/results`
        );
        console.log('[Backend API] Poll results RAW DATA:', JSON.stringify(response.data.data, null, 2));
        return response.data.data;
    } catch (error) {
        console.error('[Backend API] Error fetching poll results:', error);
        throw error;
    }
}

export async function editPoll(
    signalId: number,
    poll: any,
    republish: boolean
): Promise<void> {
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
        await apiClient.put<ApiResponse<void>>(
            '/api/signals/poll/edit',
            editDTO
        );
        console.log(`[Backend API] [${time}] 📥 editPoll response | SUCCESS | signalId=${signalId}`);
    } catch (error: any) {
        console.error(`[Backend API] [${time}] ❌ editPoll error | FAILED | signalId=${signalId}:`, error.message);
        throw error;
    }
}

export async function deletePoll(signalId: number): Promise<void> {
    const time = new Date().toLocaleTimeString();
    const url = `/api/signals/${signalId}`;
    const fullUrl = `${API_BASE_URL}${url}`;
    
    console.log(`[DELETE-DEBUG] [${time}] ========== Backend API: deletePoll ==========`);
    console.log(`[DELETE-DEBUG] [${time}] Input | signalId=${signalId} | type=${typeof signalId}`);
    console.log(`[DELETE-DEBUG] [${time}] Request | method=DELETE | url=${fullUrl}`);
    
    try {
        const response = await apiClient.delete<ApiResponse<void>>(url);
        console.log(`[DELETE-DEBUG] [${time}] ✅ Response received | status=${response.status} | statusText=${response.statusText}`);
        console.log(`[DELETE-DEBUG] [${time}] Response data:`, JSON.stringify(response.data));
    } catch (error: any) {
        console.error(`[DELETE-DEBUG] [${time}] ❌ DELETE request FAILED`);
        console.error(`[DELETE-DEBUG] [${time}] Error | message=${error.message}`);
        if (error.response) {
            console.error(`[DELETE-DEBUG] [${time}] Response | status=${error.response.status} | statusText=${error.response.statusText}`);
            console.error(`[DELETE-DEBUG] [${time}] Response data:`, JSON.stringify(error.response.data));
        } else if (error.request) {
            console.error(`[DELETE-DEBUG] [${time}] No response received - network error or timeout`);
        }
        throw error; // Re-throw to be handled by caller
    }
}

export async function login(email: string, password: string): Promise<string> {
    console.log(`[Backend API] [${new Date().toLocaleTimeString()}] 🔐 Attempting login for: ${email}`);
    const response = await apiClient.post<ApiResponse<string>>(
        '/api/signals/login',
        null,
        { params: { userEmail: email, password } }
    );
    console.log(`[Backend API] [${new Date().toLocaleTimeString()}] ✅ Login result:`, JSON.stringify(response.data, null, 2));
    return response.data.data;
}

export async function createLabel(label: LabelCreateDTO): Promise<CreateLabelResponse> {
    const time = new Date().toLocaleTimeString();
    console.log(`[Backend API] [${time}] 📤 createLabel request | name="${label.name}"`);

    // Transform to Backend DTO
    // Note: Label name is stored as plain text (no formatting)
    // Description is required
    const payload = {
        label: label.name,
        description: label.description.trim(),
        localId: Number(label.localId) // Sent as a number (Long) to match backend expectation
    };

    console.log(`[Backend API] [${time}] 📤 Payload:`, payload);

    try {
        // We use 'any' for the API response because the backend has swapped fields:
        // backend.localId -> backend ID
        // backend.labelId -> local ID we sent
        const response = await apiClient.post<ApiResponse<any>>('/create/label', payload);
        const rawData = response.data.data;

        console.log(`[Backend API] [${time}] 📥 createLabel response | SUCCESS | name="${label.name}"`);
        console.log(`[Backend API] Raw Response Data (Swapped):`, rawData);

        // Map backend's swapped 'localId' field to our 'id' (backend ID)
        return {
            id: rawData.localId,
            localId: label.localId?.toString() || ''
        };
    } catch (error: any) {
        console.error(`[Backend API] [${time}] ❌ createLabel error | FAILED | name="${label.name}":`, error.message);
        throw error;
    }
}

export async function editLabel(label: LabelEditDTO): Promise<void> {
    const time = new Date().toLocaleTimeString();
    console.log(`[Backend API] [${time}] 📤 editLabel request | id="${label.id}"`);

    const payload = {
        id: label.id,
        description: label.description
    };

    console.log(`[Backend API] [${time}] 📤 Payload:`, payload);

    try {
        await apiClient.post<ApiResponse<void>>('/edit/label', payload);
        console.log(`[Backend API] [${time}] 📥 editLabel response | SUCCESS | id="${label.id}"`);
    } catch (error: any) {
        console.error(`[Backend API] [${time}] ❌ editLabel error | FAILED | id="${label.id}":`, error.message);
        throw error;
    }
}

export async function triggerDataSync(userEmail: string): Promise<void> {
    console.log(`[🌐 API] 🔄 Triggering data sync for user: ${userEmail}`);
    try {
        await apiClient.get('/data/sync', { params: { userEmail } });
        console.log(`[🌐 API] ✅ Data sync triggered successfully`);
    } catch (error: any) {
        console.error('[🌐 API] ❌ Failed to trigger data sync:', error.response?.status || error.message);
        // Don't throw - this is not critical, SSE will still work
    }
}

export async function getAllLabels(): Promise<LabelResponseDTO[]> {
    console.log('[🌐 API] 📥 Fetching all labels from backend...');
    try {
        const response = await apiClient.get<ApiResponse<any[]>>('/labels'); // Use any[] to handle raw backend DTO
        
        // Check if response is valid
        if (!response.data || !response.data.data) {
            console.warn('[🌐 API] ⚠️ Invalid response from /labels endpoint, returning empty array');
            return [];
        }

        console.log(`[🌐 API] ✅ Received ${response.data.data.length} labels from backend`);

        // Map backend 'label' -> frontend 'name'
        // Labels are stored as plain text (no formatting)
        const labels: LabelResponseDTO[] = response.data.data.map((l: any) => ({
            id: l.id,
            name: l.label,
            description: l.description,
            createdAt: l.createdAt,
            editedAt: l.editedAt // Added support for editedAt
        }));

        if (labels.length > 0) {
            console.log('[🌐 API] Labels:', labels.map(l => l.name).join(', '));
        }
        return labels;
    } catch (error: any) {
        console.error('[🌐 API] ❌ Failed to fetch labels from backend:', error.response?.status || error.message);
        // Return empty array instead of throwing to allow sync to continue
        // This prevents label sync failures from blocking other sync operations
        return [];
    }
}

// ============================================================================
// Error Handling Utility
// ============================================================================

export function extractBackendError(error: any): string {
    if (error.response && error.response.data) {
        const data = error.response.data;
        return data.message || data.error || error.message;
    }
    return error.message;
}
