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

export interface UserVoteDTO {
    userId: string;
    selectedOption: string;
    submittedAt: string; // Instant from backend
}

export interface SubmitPollRequest {
    signalId: number;
    userId: string;
    selectedOption: string;
    defaultResponse?: string;
    reason?: string;
}

export interface PollResultDTO {
    signalId: number;
    totalAssigned: number;
    totalResponded: number;

    optionCounts: Record<string, number>;
    optionVotes: Record<string, UserVoteDTO[]>;

    removedOptions: Record<string, UserVoteDTO[]>;
    removedUsers: Record<string, UserVoteDTO[]>;

    defaultResponses: UserVoteDTO[];
    reasonResponses: Record<string, string>;

    defaultCount: number;
    reasonCount: number;
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

    // 1. Process standard votes (optionVotes)
    if (dto.optionVotes) {
        for (const [option, votes] of Object.entries(dto.optionVotes)) {
            for (const vote of votes) {
                responses.push({
                    pollId: poll.id,
                    consumerEmail: vote.userId,
                    response: option,
                    submittedAt: vote.submittedAt || new Date().toISOString(),
                    isDefault: false,
                    skipReason: undefined,
                });
            }
        }
    }

    // 1b. Process archived votes (options that were removed during edit)
    if (dto.removedOptions) {
        for (const [option, votes] of Object.entries(dto.removedOptions)) {
            for (const vote of votes) {
                responses.push({
                    pollId: poll.id,
                    consumerEmail: vote.userId,
                    response: option,
                    submittedAt: vote.submittedAt || new Date().toISOString(),
                    isDefault: false,
                    skipReason: undefined,
                });
            }
        }
    }

    // 2. Process default responses
    if (dto.defaultResponses) {
        for (const vote of dto.defaultResponses) {
            responses.push({
                pollId: poll.id,
                consumerEmail: vote.userId,
                response: vote.selectedOption, // Usually the default option text
                submittedAt: vote.submittedAt || poll.deadline,
                isDefault: true,
                skipReason: undefined, // Or could be "Default Response Triggered"
            });
        }
    }

    // 3. Process removed users (users who were unshared during edit)
    if (dto.removedUsers) {
        for (const [_, votes] of Object.entries(dto.removedUsers)) {
            for (const vote of votes) {
                // Only add if not already present (safety check)
                if (!responses.some(r => r.consumerEmail === vote.userId)) {
                    responses.push({
                        pollId: poll.id,
                        consumerEmail: vote.userId,
                        response: vote.selectedOption,
                        submittedAt: vote.submittedAt || new Date().toISOString(),
                        isDefault: false,
                        skipReason: undefined,
                    });
                }
            }
        }
    }

    // 4. Map reasonResponses to the corresponding user's response
    if (dto.reasonResponses) {
        for (const response of responses) {
            const reason = dto.reasonResponses[response.consumerEmail];
            if (reason) {
                response.skipReason = reason;
            }
        }
    }

    // 5. Fill in missing users (if any remain) as strictly default (client-side fallback)
    const isCompleted = new Date(poll.deadline) <= new Date();

    if (isCompleted) {
        const respondedUsers = new Set(responses.map(r => r.consumerEmail));
        for (const consumer of poll.consumers) {
            if (!respondedUsers.has(consumer)) {
                // Check if there's a reason-only response (unlikely given backend logic, but safe to check)
                const reason = dto.reasonResponses && dto.reasonResponses[consumer];

                responses.push({
                    pollId: poll.id,
                    consumerEmail: consumer,
                    response: poll.defaultResponse || '',
                    submittedAt: poll.deadline,
                    isDefault: true,
                    skipReason: reason,
                });
            }
        }
    }

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
        // Note: The actual endpoint path is handled in apiClient / backendApi.ts configuration
        // We use the full path here to match the new backend requirement
        const response = await apiClient.post<ApiResponse<CreatePollResponse>>(
            `${this.basePath}/create/poll`,
            dto
        );
        return response.data.data;
    }

    /**
     * Submit or update a vote for a poll
     */
    async submitVote(
        signalId: number,
        userId: string,
        selectedOption: string,
        defaultResponse?: string,
        reason?: string
    ): Promise<void> {
        const request: SubmitPollRequest = {
            signalId,
            userId,
            selectedOption,
            defaultResponse,
            reason
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
        console.log(`[PollService] Fetching results for signalId: ${signalId}`);
        console.log(`[PollService] API URL: ${this.basePath}/${signalId}/poll/results`);

        try {
            const response = await apiClient.get<ApiResponse<PollResultDTO>>(
                `${this.basePath}/${signalId}/poll/results`
            );
            console.log('[PollService] Results received:', response.data.data);
            return response.data.data;
        } catch (error) {
            console.error('[PollService] Error fetching results:', error);
            throw error;
        }
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

