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

export default function DashboardHeader({ user, incompleteCount, onSwitchMode, onLogout }: DashboardHeaderProps) {
    const [showSettings, setShowSettings] = useState(false);

    return (
        <header className="bg-mono-primary border-b border-mono-primary sticky top-0 z-40 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative w-11 h-11 bg-mono-accent rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                            <img src={logo} alt="Sentinel Logo" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h1 className="text-mono-bg">Sentinel</h1>
                            <p className="text-sm text-mono-bg/70">Consumer Dashboard</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {incompleteCount > 0 && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-mono-accent/20 border border-mono-accent/30 rounded-xl">
                                <AlertTriangle className="w-4 h-4 text-mono-accent" />
                                <span className="text-sm text-mono-bg">
                                    {incompleteCount} pending
                                </span>
                            </div>
                        )}

                        <div className="hidden sm:block text-right mr-4 px-4 py-2 bg-mono-bg/10 backdrop-blur rounded-xl border border-mono-bg/20">
                            <p className="text-sm text-mono-bg">{user.name}</p>
                            <p className="text-xs text-mono-bg/70">{user.email}</p>
                        </div>

                        {user.isPublisher && (
                            <button
                                onClick={onSwitchMode}
                                className="flex items-center gap-2 px-4 py-2.5 bg-mono-accent text-mono-primary rounded-xl hover:bg-mono-accent/90 transition-all shadow-lg"
                            >
                                <span className="hidden sm:inline">Switch to Publisher</span>
                            </button>
                        )}

                        <div className="relative">
                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className="p-2.5 text-mono-bg/70 hover:text-mono-bg hover:bg-mono-bg/10 rounded-xl transition-colors"
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
                                    <div className="absolute right-0 mt-2 w-48 bg-mono-primary rounded-xl shadow-xl border border-mono-bg/10 py-1 z-50 overflow-hidden">
                                        <button
                                            onClick={() => {
                                                onLogout();
                                                setShowSettings(false);
                                            }}
                                            className="w-full text-left px-4 py-2.5 text-sm text-mono-bg hover:bg-mono-accent/10 flex items-center gap-2 transition-colors"
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
