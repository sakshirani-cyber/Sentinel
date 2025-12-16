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

interface SubmitPollRequest {
    signalId: number;
    userId: string;
    selectedOption: string;
}

interface PollResultDTO {
    signalId: number;
    totalAssigned: number;
    totalResponded: number;
    optionCounts: Record<string, number>;
    optionToUsers: Record<string, string[]> | null;
    archivedOptions: Record<string, string[]>;
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
    const dto = mapPollToDTO(poll);
    const response = await apiClient.post<ApiResponse<CreatePollResponse>>(
        '/api/signals',
        dto
    );
    return response.data.data;
}

export async function submitVote(
    signalId: number,
    userId: string,
    selectedOption: string
): Promise<void> {
    const request: SubmitPollRequest = { signalId, userId, selectedOption };
    await apiClient.post<ApiResponse<void>>('/api/signals/poll/response', request);
}

export async function getPollResults(signalId: number): Promise<PollResultDTO> {
    const response = await apiClient.get<ApiResponse<PollResultDTO>>(
        `/api/signals/${signalId}/poll/results`
    );
    return response.data.data;
}

export async function editPoll(
    signalId: number,
    poll: any,
    republish: boolean
): Promise<void> {
    const dto = mapPollToDTO(poll);
    await apiClient.put<ApiResponse<void>>(
        `/api/signals/${signalId}`,
        dto,
        { params: { republish } }
    );
}

export async function deletePoll(signalId: number): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/api/signals/${signalId}`);
}
