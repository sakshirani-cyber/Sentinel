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
        const timestamp = new Date().toLocaleTimeString();
        
        try {
            const poll = polls.find(p => p.id === pollId);
            
            console.log(`[DELETE-DEBUG] [${timestamp}] ========== DELETE FLOW STARTED ==========`);
            console.log(`[DELETE-DEBUG] [${timestamp}] Looking for poll | localId=${pollId}`);
            
            if (!poll) {
                console.error(`[DELETE-DEBUG] [${timestamp}] ❌ POLL NOT FOUND | localId=${pollId}`);
                console.log(`[DELETE-DEBUG] [${timestamp}] Available polls:`, polls.map(p => ({ id: p.id, cloudSignalId: p.cloudSignalId })));
                return;
            }

            console.log(`[DELETE-DEBUG] [${timestamp}] ✓ Poll found | localId=${pollId} | cloudSignalId=${poll.cloudSignalId} | type=${typeof poll.cloudSignalId} | question="${poll.question?.substring(0, 40)}..."`);

            // Step 1: Delete from cloud backend if poll has cloudSignalId
            console.log(`[DELETE-DEBUG] [${timestamp}] STEP 1: Cloud Backend Deletion`);
            console.log(`[DELETE-DEBUG] [${timestamp}] Checking conditions | hasElectronBackend=${!!window.electron?.backend} | hasCloudSignalId=${!!poll.cloudSignalId} | cloudSignalId=${poll.cloudSignalId}`);
            
            if (window.electron?.backend && poll.cloudSignalId) {
                try {
                    console.log(`[DELETE-DEBUG] [${timestamp}] 🌐 Calling backend.deletePoll() | cloudSignalId=${poll.cloudSignalId}`);
                    const backendResult = await window.electron.backend.deletePoll(poll.cloudSignalId);
                    console.log(`[DELETE-DEBUG] [${timestamp}] 🌐 Backend response received:`, JSON.stringify(backendResult));
                    
                    if (backendResult.success) {
                        console.log(`[DELETE-DEBUG] [${timestamp}] ✅ CLOUD DELETE SUCCESS | cloudSignalId=${poll.cloudSignalId}`);
                    } else {
                        console.error(`[DELETE-DEBUG] [${timestamp}] ❌ CLOUD DELETE FAILED | cloudSignalId=${poll.cloudSignalId} | error=${backendResult.error}`);
                        console.warn(`[DELETE-DEBUG] [${timestamp}] ⚠️ Continuing with local deletion despite cloud failure`);
                    }
                } catch (backendError) {
                    console.error(`[DELETE-DEBUG] [${timestamp}] ❌ CLOUD DELETE EXCEPTION | cloudSignalId=${poll.cloudSignalId}`, backendError);
                    console.warn(`[DELETE-DEBUG] [${timestamp}] ⚠️ Continuing with local deletion despite cloud error`);
                }
            } else {
                console.warn(`[DELETE-DEBUG] [${timestamp}] ⚠️ SKIPPING CLOUD DELETE | reason=${!window.electron?.backend ? 'no electron.backend' : 'no cloudSignalId'} | cloudSignalId=${poll.cloudSignalId}`);
            }

            // Step 2: Delete from local DB via Electron IPC
            console.log(`[DELETE-DEBUG] [${timestamp}] STEP 2: Local DB Deletion`);
            
            if (window.electron?.db) {
                try {
                    console.log(`[DELETE-DEBUG] [${timestamp}] 💾 Calling db.deletePoll() | localId=${pollId}`);
                    const result = await window.electron.db.deletePoll(pollId);
                    console.log(`[DELETE-DEBUG] [${timestamp}] 💾 Local DB response:`, JSON.stringify(result));
                    
                    if (result.success) {
                        console.log(`[DELETE-DEBUG] [${timestamp}] ✅ LOCAL DELETE SUCCESS | localId=${pollId} | rowsAffected=${result.changes}`);
                        if (result.changes === 0) {
                            console.warn(`[DELETE-DEBUG] [${timestamp}] ⚠️ 0 rows affected - poll may have been already deleted`);
                        }
                        // Step 3: Update local state only after successful DB deletion
                        setPolls(prev => prev.filter(p => p.id !== pollId));
                        setResponses(prev => prev.filter(r => r.pollId !== pollId));
                        console.log(`[DELETE-DEBUG] [${timestamp}] ✓ React state updated - poll removed from UI`);
                    } else {
                        console.error(`[DELETE-DEBUG] [${timestamp}] ❌ LOCAL DELETE FAILED | localId=${pollId} | error=${result.error}`);
                        alert(`Failed to delete poll from local database: ${result.error}`);
                    }
                } catch (dbError) {
                    console.error(`[DELETE-DEBUG] [${timestamp}] ❌ LOCAL DELETE EXCEPTION | localId=${pollId}`, dbError);
                    alert('Error deleting poll from local database');
                }
            } else {
                // No electron, just update state
                setPolls(prev => prev.filter(p => p.id !== pollId));
                setResponses(prev => prev.filter(r => r.pollId !== pollId));
                console.log(`[DELETE-DEBUG] [${timestamp}] ✓ Poll deleted from state (no Electron DB)`);
            }

            console.log(`[DELETE-DEBUG] [${timestamp}] ========== DELETE FLOW COMPLETED ==========`);

        } catch (error) {
            console.error(`[DELETE-DEBUG] [${timestamp}] ❌ UNEXPECTED ERROR IN DELETE FLOW:`, error);
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
