import { useState, useEffect, useMemo } from 'react';
import { User, Poll, Response } from '../App';
import SignalDetail from './SignalDetail';
import PersistentAlert from './PersistentAlert';

interface GlobalAlertManagerProps {
    user: User;
    polls: Poll[];
    responses: Response[];
    onSubmitResponse: (response: Response) => void;
}

export default function GlobalAlertManager({
    user,
    polls,
    responses,
    onSubmitResponse
}: GlobalAlertManagerProps) {
    const [showPersistentAlert, setShowPersistentAlert] = useState(false);
    const [persistentAlertPoll, setPersistentAlertPoll] = useState<Poll | null>(null);
    const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null); // For filling form via Global Alert

    // Track which alerts have been sent for each poll
    const [sentAlerts, setSentAlerts] = useState<Record<string, { deadline: string, alerts: number[] }>>({});

    // Track notifying about new polls
    const [notifiedPolls, setNotifiedPolls] = useState<Set<string>>(() => {
        const saved = localStorage.getItem('sentinel_notified_polls');
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });

    // Track notifying about updates
    const [notifiedUpdates, setNotifiedUpdates] = useState<Set<string>>(() => {
        const saved = localStorage.getItem('sentinel_notified_updates');
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });

    // Drafts for Global Alert form filling
    const [drafts, setDrafts] = useState<Record<string, string>>({});

    // Load/Save drafts sync with ConsumerDashboard via localStorage
    useEffect(() => {
        const savedDrafts = localStorage.getItem('sentinel_drafts');
        if (savedDrafts) setDrafts(JSON.parse(savedDrafts));
    }, []);

    useEffect(() => {
        localStorage.setItem('sentinel_drafts', JSON.stringify(drafts));
    }, [drafts]);

    const handleSaveDraft = (pollId: string, value: string) => {
        setDrafts(prev => ({ ...prev, [pollId]: value }));
    };

    // Filter for user polls
    const userPolls = useMemo(() => {
        return polls.filter(p =>
            p.consumers.some((c: string) => c.toLowerCase() === user.email.toLowerCase())
        );
    }, [polls, user.email]);

    const incompletePolls = useMemo(() => {
        return userPolls.filter(p => {
            const hasResponse = responses.some(r => r.pollId === p.id && r.consumerEmail === user.email);
            const isExpired = p.status === 'completed' || new Date(p.deadline) < new Date();
            return !hasResponse && !isExpired;
        });
    }, [userPolls, responses, user.email]);

    // Request notification permission
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // 1. Notify for NEW polls
    useEffect(() => {
        if (Notification.permission !== 'granted') return;

        userPolls.forEach(poll => {
            const hasResponded = responses.some(r => r.pollId === poll.id && r.consumerEmail === user.email);
            if (hasResponded || notifiedPolls.has(poll.id)) return;

            setNotifiedPolls(prev => {
                const newSet = new Set(prev);
                newSet.add(poll.id);
                localStorage.setItem('sentinel_notified_polls', JSON.stringify([...newSet]));
                return newSet;
            });

            const notification = new Notification(`New Poll from ${poll.publisherName}`, {
                body: poll.question,
                silent: false,
                icon: '/logo.png'
            });

            notification.onclick = () => {
                if ((window as any).electron) {
                    (window as any).electron.ipcRenderer.send('restore-window');
                }
                window.focus();
                // If we are consumer, ideally we switch tab, but global manager just opens modal if needed? 
                // For simple notification click, we might just focus window. 
                // Or we could let App.tsx handle navigation? 
                // For now, focusing window is good.
            };
        });
    }, [userPolls, notifiedPolls, responses, user.email]);

    // 2. Notify for UPDATED polls
    useEffect(() => {
        userPolls.forEach(poll => {
            const notificationKey = poll.updatedAt ? `${poll.id}_${poll.updatedAt}` : poll.id;
            const userResponse = responses.find(r => r.pollId === poll.id && r.consumerEmail === user.email);

            if (poll.isEdited && !userResponse && !notifiedUpdates.has(notificationKey)) {
                setNotifiedUpdates(prev => {
                    const newSet = new Set(prev);
                    newSet.add(notificationKey);
                    localStorage.setItem('sentinel_notified_updates', JSON.stringify([...newSet]));
                    return newSet;
                });

                const notification = new Notification(`Poll Updated: ${poll.publisherName}`, {
                    body: `The poll "${poll.question}" has been updated. Please check the new details.`,
                    silent: false,
                    icon: '/logo.png'
                });

                notification.onclick = () => {
                    if ((window as any).electron) {
                        (window as any).electron.ipcRenderer.send('restore-window');
                    }
                    window.focus();
                };
            }
        });
    }, [incompletePolls, notifiedUpdates]);

    // 3. Deadline Alerts & Persistent Alert Check
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();

            incompletePolls.forEach(poll => {
                const deadline = new Date(poll.deadline);
                const minutesUntilDeadline = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60));

                // --- Standard Notifications (60, 30, 15, 1 min) ---
                const alertThresholds = [60, 30, 15, 1];
                const pollAlertData = sentAlerts[poll.id];
                let currentSentAlerts: number[] = [];

                if (pollAlertData && pollAlertData.deadline === poll.deadline) {
                    currentSentAlerts = pollAlertData.alerts;
                }

                alertThresholds.forEach(threshold => {
                    if (currentSentAlerts.includes(threshold)) return;

                    const isAlertTime = threshold === 1
                        ? minutesUntilDeadline <= 1 && minutesUntilDeadline >= 0
                        : minutesUntilDeadline === threshold;

                    if (isAlertTime) {
                        const isPollExpired = new Date(poll.deadline) < new Date();
                        const hasUserResponded = responses.some(r => r.pollId === poll.id && r.consumerEmail === user.email);

                        if (isPollExpired || hasUserResponded) return;

                        setSentAlerts(prev => {
                            const existing = prev[poll.id];
                            const alerts = (existing && existing.deadline === poll.deadline)
                                ? [...existing.alerts, threshold]
                                : [threshold];

                            return { ...prev, [poll.id]: { deadline: poll.deadline, alerts } };
                        });

                        if (Notification.permission === 'granted') {
                            console.log(`[GlobalAlertManager] Sending ${threshold}-min alert`);
                            const notification = new Notification(`Sentinel Alert: ${poll.publisherName}`, {
                                body: `${threshold} min left: ${poll.question}`,
                                silent: false,
                                icon: '/logo.png'
                            });
                            notification.onclick = () => {
                                if ((window as any).electron) (window as any).electron.ipcRenderer.send('restore-window');
                                window.focus();
                                // If it's the 1-min alert and persistent is ON, we might want to handle differently, 
                                // but usually focusing is enough.
                            };
                        }
                    }
                });

                // --- Persistent Alert Logic ---
                const timeUntilDeadline = deadline.getTime() - now.getTime();
                const isMin1 = timeUntilDeadline <= 60000 && timeUntilDeadline > 0;

                if (poll.isPersistentFinalAlert && isMin1 && !showPersistentAlert) {
                    // Check device status check
                    if ((window as any).electron) {
                        (window as any).electron.getDeviceStatus().then((status: string) => {
                            const isExpired = new Date(poll.deadline) < new Date();

                            if ((status === 'locked' || status === 'sleep') && !isExpired) {
                                console.log(`[GlobalAlertManager] Auto-submitting default due to status: ${status}`);
                                const response: Response = {
                                    pollId: poll.id,
                                    consumerEmail: user.email,
                                    response: poll.defaultResponse || '',
                                    submittedAt: new Date().toISOString(),
                                    isDefault: true,
                                    skipReason: `Auto-submitted: Device was ${status}`
                                };
                                onSubmitResponse(response);
                            } else if (isExpired) {
                                setShowPersistentAlert(false);
                                setPersistentAlertPoll(null);
                            } else {
                                console.log(`[GlobalAlertManager] Showing persistent alert`);
                                (window as any).electron.ipcRenderer.send('set-persistent-alert-active', true);
                                setPersistentAlertPoll(poll);
                                setShowPersistentAlert(true);
                            }
                        });
                    } else {
                        // Browser dev mode fallback
                        setPersistentAlertPoll(poll);
                        setShowPersistentAlert(true);
                    }
                }
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [incompletePolls, showPersistentAlert, sentAlerts, responses, user.email, onSubmitResponse]);

    // Auto-dismiss persistent alert when deadline passes
    useEffect(() => {
        if (!showPersistentAlert || !persistentAlertPoll) return;
        const interval = setInterval(() => {
            const now = new Date();
            if (now >= new Date(persistentAlertPoll.deadline)) {
                setShowPersistentAlert(false);
                setPersistentAlertPoll(null);
                if ((window as any).electron) {
                    (window as any).electron.ipcRenderer.send('set-persistent-alert-active', false);
                    (window as any).electron.ipcRenderer.send('set-always-on-top', false);
                }
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [showPersistentAlert, persistentAlertPoll]);


    // Safety cleanup
    useEffect(() => {
        return () => {
            if (showPersistentAlert && (window as any).electron) {
                (window as any).electron.ipcRenderer.send('set-persistent-alert-active', false);
                (window as any).electron.ipcRenderer.send('set-always-on-top', false);
            }
        };
    }, [showPersistentAlert]);


    // Handlers for Persistent Alert Components
    const handleSkip = async (pollId: string, reason: string) => {
        const poll = polls.find(p => p.id === pollId);
        const response: Response = {
            pollId,
            consumerEmail: user.email,
            response: poll?.defaultResponse || 'Skipped',
            submittedAt: new Date().toISOString(),
            isDefault: true,
            skipReason: reason
        };
        await onSubmitResponse(response);

        // Cleanup
        if ((window as any).electron) {
            (window as any).electron.ipcRenderer.send('set-persistent-alert-active', false);
            (window as any).electron.ipcRenderer.send('set-always-on-top', false);
        }
        setShowPersistentAlert(false);
        setPersistentAlertPoll(null);
    };

    const handleSubmit = async (pollId: string, value: string) => {
        const response: Response = {
            pollId,
            consumerEmail: user.email,
            response: value,
            submittedAt: new Date().toISOString(),
            isDefault: false
        };
        await onSubmitResponse(response);

        // Cleanup
        if ((window as any).electron) {
            (window as any).electron.ipcRenderer.send('set-persistent-alert-active', false);
            (window as any).electron.ipcRenderer.send('set-always-on-top', false);
        }
        setSelectedPoll(null);
        setShowPersistentAlert(false);
        setPersistentAlertPoll(null);

        setDrafts(prev => {
            const newDrafts = { ...prev };
            delete newDrafts[pollId];
            return newDrafts;
        });
    };

    return (
        <>
            {/* 1. Persistent Alert Overlay */}
            {showPersistentAlert && persistentAlertPoll && !selectedPoll && (
                <PersistentAlert
                    poll={persistentAlertPoll}
                    onSkip={handleSkip}
                    onFill={() => {
                        // "Fill Now" just sets this, waiting for user input
                        setSelectedPoll(persistentAlertPoll);
                        // We KEEP persistent alert active in backend so it stays on top/kiosk
                    }}
                />
            )}

            {/* 2. Signal Detail (Form Filling) associated with Persistent Alert */}
            {selectedPoll && (
                <SignalDetail
                    poll={selectedPoll}
                    draft={drafts[selectedPoll.id]}
                    onSaveDraft={handleSaveDraft}
                    onSubmit={handleSubmit}
                    onClose={() => {
                        // Return to pure persistent alert state
                        setSelectedPoll(null);
                    }}
                    isPersistentContext={showPersistentAlert && selectedPoll.isPersistentFinalAlert}
                    userResponse={responses.find(r => r.pollId === selectedPoll.id && r.consumerEmail === user.email)}
                />
            )}
        </>
    );
}
