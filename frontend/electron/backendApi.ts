import axios, { AxiosInstance } from 'axios';

// Backend API service for Electron main process
// This bypasses CORS since Node.js doesn't have browser CORS restrictions

const API_BASE_URL = process.env.VITE_BACKEND_URL || 'http://localhost:8080';

const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ============================================================================
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
    question: string;
    options: string[];
}

interface CreatePollResponse {
    cloudSignalId: number;
    localId: number;
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

    archivedOptions: Record<string, UserVoteDTO[]>;
    removedUsers: Record<string, UserVoteDTO[]>;

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

// ============================================================================
// Data Transformation
// ============================================================================

function mapPollToDTO(poll: any): PollCreateDTO {
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
        options: poll.options.map((o: any) => o.text),
    };
}

// ============================================================================
// API Methods
// ============================================================================

export async function createPoll(poll: any): Promise<CreatePollResponse> {
    console.log('[Backend API] Creating poll:', poll.question);
    console.log('[Backend API] Request URL:', `${API_BASE_URL}/api/signals/create/poll`);

    const dto = mapPollToDTO(poll);
    console.log('[Backend API] Poll DTO:', dto);

    const response = await apiClient.post<ApiResponse<CreatePollResponse>>(
        '/api/signals/create/poll',
        dto
    );

    console.log('[Backend API] Create poll response:', response.data);
    return response.data.data;
}

export async function submitVote(
    signalId: number,
    userId: string,
    selectedOption: string,
    defaultResponse?: string,
    reason?: string
): Promise<void> {
    console.log('[Backend API] Submitting vote:', { signalId, userId, selectedOption, defaultResponse, reason });

    const request: SubmitPollRequest = {
        signalId,
        userId,
        selectedOption,
        defaultResponse,
        reason
    };
    await apiClient.post<ApiResponse<void>>('/api/signals/poll/response', request);

    console.log('[Backend API] Vote submitted successfully');
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
    console.log('[Backend API] Editing poll:', { signalId, republish });

    const dto = mapPollToDTO(poll);
    await apiClient.put<ApiResponse<void>>(
        `/api/signals/${signalId}`,
        dto,
        { params: { republish } }
    );
    console.log('[Backend API] Poll edit response received');

    console.log('[Backend API] Poll edited successfully');
}

export async function deletePoll(signalId: number): Promise<void> {
    console.log('[Backend API] Deleting poll:', signalId);

    await apiClient.delete<ApiResponse<void>>(`/api/signals/${signalId}`);

    console.log('[Backend API] Poll deleted successfully');
}

export async function login(email: string, password: string): Promise<string> {
    console.log('[Backend API] Logging in:', email);

    const response = await apiClient.post<ApiResponse<string>>(
        '/api/signals/login',
        null,
        { params: { email, password } }
    );

    console.log('[Backend API] Login success, role:', response.data.data);
    return response.data.data;
}

