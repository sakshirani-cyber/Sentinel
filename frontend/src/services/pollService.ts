import apiClient, { ApiResponse } from './apiClient';
import { Poll, Response } from '../App';

// ============================================================================
// Backend API Types
// ============================================================================

export interface PollCreateDTO {
    createdBy: string;
    anonymous: boolean;
    endTimestamp: string; // ISO-8601
    sharedWith: string[];
    type: string; // "POLL"
    localId: number;
    defaultFlag?: boolean;
    defaultOption?: string;
    question: string;
    options: string[];
}

export interface CreatePollResponse {
    cloudSignalId: number;
    localId: number;
}

export interface SubmitPollRequest {
    signalId: number;
    userId: string;
    selectedOption: string;
}

export interface PollResultDTO {
    signalId: number;
    totalAssigned: number;
    totalResponded: number;
    optionCounts: Record<string, number>;
    optionToUsers: Record<string, string[]> | null; // null if anonymous
    archivedOptions: Record<string, string[]>;
}

// ============================================================================
// Data Transformation Utilities
// ============================================================================

/**
 * Convert frontend Poll to backend PollCreateDTO
 */
export function mapPollToDTO(poll: Poll): PollCreateDTO {
    // Extract numeric ID from poll.id (format: "poll-timestamp-random")
    const localId = parseInt(poll.id.split('-')[1]) || Date.now();

    // Convert deadline to ISO-8601 UTC format
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
        options: poll.options.map(o => o.text),
    };
}

/**
 * Convert backend PollResultDTO to frontend Response[]
 */
export function mapResultsToResponses(dto: PollResultDTO, poll: Poll): Response[] {
    const responses: Response[] = [];

    if (dto.optionToUsers) {
        // Non-anonymous: map users to responses
        for (const [option, users] of Object.entries(dto.optionToUsers)) {
            for (const user of users) {
                responses.push({
                    pollId: poll.id,
                    consumerEmail: user,
                    response: option,
                    submittedAt: new Date().toISOString(),
                    isDefault: false,
                    skipReason: undefined,
                });
            }
        }

        // Add users who haven't responded (default responses)
        const respondedUsers = new Set(responses.map(r => r.consumerEmail));
        for (const consumer of poll.consumers) {
            if (!respondedUsers.has(consumer)) {
                responses.push({
                    pollId: poll.id,
                    consumerEmail: consumer,
                    response: poll.defaultResponse || '',
                    submittedAt: poll.deadline,
                    isDefault: true,
                    skipReason: undefined,
                });
            }
        }
    }
    // If anonymous, we can't create individual Response objects
    // Frontend will need to handle this differently in analytics

    return responses;
}

// ============================================================================
// API Service Methods
// ============================================================================

class PollService {
    private readonly basePath = '/api/signals';

    /**
     * Create a new poll on the backend
     */
    async createPoll(poll: Poll): Promise<CreatePollResponse> {
        const dto = mapPollToDTO(poll);
        const response = await apiClient.post<ApiResponse<CreatePollResponse>>(
            this.basePath,
            dto
        );
        return response.data.data;
    }

    /**
     * Submit or update a vote for a poll
     */
    async submitVote(signalId: number, userId: string, selectedOption: string): Promise<void> {
        const request: SubmitPollRequest = {
            signalId,
            userId,
            selectedOption,
        };
        await apiClient.post<ApiResponse<void>>(
            `${this.basePath}/poll/response`,
            request
        );
    }

    /**
     * Get poll results/analytics
     */
    async getPollResults(signalId: number): Promise<PollResultDTO> {
        const response = await apiClient.get<ApiResponse<PollResultDTO>>(
            `${this.basePath}/${signalId}/poll/results`
        );
        return response.data.data;
    }

    /**
     * Edit an existing poll
     * @param signalId - Backend signal ID
     * @param poll - Updated poll data
     * @param republish - If true, deletes all existing votes
     */
    async editPoll(signalId: number, poll: Poll, republish: boolean): Promise<void> {
        const dto = mapPollToDTO(poll);
        await apiClient.put<ApiResponse<void>>(
            `${this.basePath}/${signalId}`,
            dto,
            {
                params: { republish },
            }
        );
    }

    /**
     * Delete a poll
     */
    async deletePoll(signalId: number): Promise<void> {
        await apiClient.delete<ApiResponse<void>>(
            `${this.basePath}/${signalId}`
        );
    }
}

// Export singleton instance
export const pollService = new PollService();
export default pollService;
