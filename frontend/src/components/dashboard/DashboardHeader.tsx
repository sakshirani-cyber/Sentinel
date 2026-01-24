/**
 * @deprecated This component is deprecated and will be removed in a future version.
 * Use the new Ribbit layout components instead:
 * - Topbar from '@/components/layout' for the header
 * - ProfileMenu from '@/components/layout' for user menu
 * - Sidebar from '@/components/layout' for navigation
 * 
 * The new layout provides a consistent experience across all pages with
 * persistent sidebar navigation and a unified topbar.
 */

import { useState } from 'react';
import { User } from '../../types';
import logo from '../../assets/logo.png';
import { AlertTriangle, Settings, LogOut } from 'lucide-react';

interface DashboardHeaderProps {
    user: User;
    incompleteCount: number;
    onSwitchMode: () => void;
    onLogout: () => void;
}

/** @deprecated Use Topbar from '@/components/layout' instead */
export default function DashboardHeader({ user, incompleteCount, onSwitchMode, onLogout }: DashboardHeaderProps) {
    const [showSettings, setShowSettings] = useState(false);

    return (
        <header className="bg-card-solid border-b border-border sticky top-0 z-40 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative w-11 h-11 bg-primary rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                            <img src={logo} alt="Sentinel Logo" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h1 className="text-foreground">Sentinel</h1>
                            <p className="text-sm text-foreground-secondary">Consumer Dashboard</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {incompleteCount > 0 && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-warning/20 border border-warning/30 rounded-xl">
                                <AlertTriangle className="w-4 h-4 text-warning" />
                                <span className="text-sm text-foreground">
                                    {incompleteCount} pending
                                </span>
                            </div>
                        )}

                        <div className="hidden sm:block text-right mr-4 px-4 py-2 bg-muted backdrop-blur rounded-xl border border-border">
                            <p className="text-sm text-foreground">{user.name}</p>
                            <p className="text-xs text-foreground-secondary">{user.email}</p>
                        </div>

                        {user.isPublisher && (
                            <button
                                onClick={onSwitchMode}
                                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary-hover transition-all shadow-lg glow-on-hover"
                            >
                                <span className="hidden sm:inline">Switch to Publisher</span>
                            </button>
                        )}

                        <div className="relative">
                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className="p-2.5 text-foreground-secondary hover:text-foreground hover:bg-muted rounded-xl transition-colors"
                                title="Settings"
                            >
                                <Settings className="w-5 h-5" />
                            </button>

                            {showSettings && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setShowSettings(false)}
                                    />
                                    <div className="absolute right-0 mt-2 w-48 bg-card-solid rounded-xl shadow-xl border border-border py-1 z-50 overflow-hidden">
                                        <button
                                            onClick={() => {
                                                onLogout();
                                                setShowSettings(false);
                                            }}
                                            className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-primary/10 flex items-center gap-2 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Logout
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
