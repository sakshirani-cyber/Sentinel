import { useState, useEffect } from 'react';
import { Poll, Response } from '../types';

export function usePollData() {
    const [polls, setPolls] = useState<Poll[]>([]);
    const [responses, setResponses] = useState<Response[]>([]);
    const [loading, setLoading] = useState(true);

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                if (window.electron) {
                    console.log('[App] Fetching data from local DB...');
                    const loadedPolls = await window.electron.db.getPolls();
                    const loadedResponses = await window.electron.db.getResponses();
                    console.log(`[App] Received ${loadedPolls.length} polls and ${loadedResponses.length} responses from local DB.`);
                    setPolls(loadedPolls);
                    setResponses(loadedResponses);
                }
            } catch (error) {
                console.error('Failed to load data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();

        // Set up polling for updates
        const interval = setInterval(loadData, 5000);
        return () => clearInterval(interval);
    }, []);

    const createPoll = async (newPoll: Poll): Promise<boolean> => {
        console.log(`[App] [${new Date().toLocaleTimeString()}] 📥 handleCreatePoll called with poll:`, {
            id: newPoll.id,
            question: newPoll.question,
            consumersCount: newPoll.consumers.length
        });

        try {
            // Always save to local DB
            if (window.electron) {
                console.log(`[App] [${new Date().toLocaleTimeString()}] 💾 Calling electron.backend.createPoll (IPC: backend-create-poll)...`);
                const result = await window.electron.backend.createPoll(newPoll);

                console.log(`[App] [${new Date().toLocaleTimeString()}] 📬 Received result from IPC:`, result);

                if (result.success) {
                    console.log(`[App] [${new Date().toLocaleTimeString()}] ✅ Poll saved to local DB successfully`);
                    setPolls(prev => [...prev, newPoll]);
                    return true;
                } else {
                    console.error('[App] ❌ Failed to create poll locally:', result.error);
                    alert('Failed to create poll: ' + result.error);
                    return false;
                }
            } else {
                console.warn('[App] ⚠️ Electron API not available');
                return false;
            }
        } catch (error) {
            console.error('[App] ❌ Error creating poll:', error);
            alert('Error creating poll: ' + (error as Error).message);
            return false;
        }
    };

    const updatePoll = async (pollId: string, updates: Partial<Poll>, republish: boolean) => {
        try {
            const poll = polls.find(p => p.id === pollId);
            if (!poll) throw new Error('Poll not found');

            console.log('[App] handleUpdatePoll (local-first) called:', { pollId, updates, republish });
            console.log('[App] Calling IPC db-update-poll...');

            // Always update local DB
            if (window.electron) {
                const result = await window.electron.ipcRenderer.invoke('db-update-poll', { pollId, updates, republish });
                console.log('[App] IPC db-update-poll response received:', result);
                if (result.success) {
                    setPolls(prev => prev.map(p => p.id === pollId ? { ...p, ...updates } : p));
                    // If republished, clear local responses for this poll
                    if (republish) {
                        setResponses(prev => prev.filter(r => r.pollId !== pollId));
                    }
                } else {
                    console.error('Failed to update poll:', result.error);
                    alert('Failed to update poll: ' + result.error);
                }
            }
        } catch (error) {
            console.error('Error updating poll:', error);
            alert('Error updating poll: ' + (error as Error).message);
        }
    };

    const deletePoll = async (pollId: string) => {
        try {
            const poll = polls.find(p => p.id === pollId);
            if (!poll) {
                console.error('Poll not found:', pollId);
                return;
            }

            // Always delete from local state
            setPolls(prev => prev.filter(p => p.id !== pollId));
            console.log('[Frontend] Poll deleted from local state:', pollId);

            // Delete from local DB via Electron IPC
            if (window.electron) {
                try {
                    console.log('[Frontend] Initiating DB deletion for:', pollId);
                    const result = await window.electron.db.deletePoll(pollId);
                    if (result.success) {
                        console.log('[Frontend] Poll deleted from local DB successfully. Changes:', result.changes);
                        if (result.changes === 0) {
                            console.warn('[Frontend] Deletion called but 0 rows affected in DB. Poll might have been already deleted.');
                        }
                    } else {
                        console.error('[Frontend] Failed to delete poll from local DB:', result.error);
                        alert(`Failed to delete poll from local database: ${result.error}`);
                        // Re-fetch to restore state if deletion failed
                        const latestPolls = await window.electron.db.getPolls();
                        setPolls(latestPolls);
                    }
                } catch (error) {
                    console.error('[Frontend] IPC Error deleting from local DB:', error);
                }
            }

        } catch (error) {
            console.error('Error deleting poll:', error);
            alert('Error deleting poll: ' + (error as Error).message);
        }
    };

    const submitResponse = async (response: Response) => {
        try {
            // Find poll by ID or by cloudSignalId (for backend polls)
            let poll = polls.find(p => p.id === response.pollId);

            // If not found, try to find by cloudSignalId (backend polls use signalId.toString() as ID)
            if (!poll) {
                poll = polls.find(p => p.cloudSignalId?.toString() === response.pollId);
            }

            if (window.electron?.backend) {
                console.log('[Frontend] Calling local-first submitVote:', response.pollId);

                // Use the simplified IPC handler which writes to local DB
                const result = await window.electron.backend.submitVote(
                    poll?.id || response.pollId,
                    poll?.cloudSignalId,
                    response.consumerEmail,
                    response.response,
                    response.isDefault ? response.response : undefined,
                    response.isDefault ? response.skipReason : undefined
                );

                if (result.success) {
                    setResponses(prev => [...prev, response]);
                } else {
                    // Show user-friendly error message
                    alert(result.error || 'Failed to submit response');
                    throw new Error(result.error || 'Failed to submit response');
                }
            } else {
                // No electron, just add to state
                setResponses(prev => [...prev, response]);
            }
        } catch (error) {
            console.error('Error submitting response:', error);
            alert('Error submitting response: ' + (error as Error).message);
        }
    };

    return {
        polls,
        responses,
        loading,
        createPoll,
        updatePoll,
        deletePoll,
        submitResponse
    };
}
