import { useState } from 'react';
import { Shield, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import logo from '../assets/logo.png';

interface AuthPageProps {
    onLogin: (email: string, password: string) => void;
}

export default function AuthPage({ onLogin }: AuthPageProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email && password) {
            onLogin(email, password);
        }
    };

    const handleDemoLogin = (demoEmail: string) => {
        setEmail(demoEmail);
        setPassword('demo123');
        onLogin(demoEmail, 'demo123');
    };

    return (
        <div className="min-h-screen bg-mono-bg flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-mono-accent/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-mono-primary/20 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-mono-accent/5 rounded-full blur-3xl"></div>
            </div>

            <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center relative z-10">
                {/* Left Side - Branding */}
                <div className="hidden md:block">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="relative w-20 h-20 bg-mono-primary rounded-3xl flex items-center justify-center shadow-2xl overflow-hidden">
                                <img src={logo} alt="Sentinel Logo" className="w-full h-full object-cover" />
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-mono-accent rounded-full flex items-center justify-center shadow-lg">
                                    <Sparkles className="w-3 h-3 text-mono-primary" strokeWidth={3} />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-mono-text">Sentinel</h1>
                                <p className="text-mono-text/60">Signal Enforcement System</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Card 1 */}
                            <div className="group flex items-start gap-3 p-5 bg-mono-bg border-2 border-mono-primary/20 rounded-2xl shadow-xl hover:shadow-2xl hover:border-mono-accent transition-all hover:-translate-y-1">
                                <div className="w-12 h-12 rounded-xl bg-mono-primary flex items-center justify-center flex-shrink-0 shadow-lg group-hover:bg-mono-accent transition-colors">
                                    <svg className="w-6 h-6 text-mono-bg group-hover:text-mono-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-mono-text mb-1">Enforce Accountability</h3>
                                    <p className="text-sm text-mono-text/60">Track every response with timestamp and context</p>
                                </div>
                            </div>

                            {/* Card 2 */}
                            <div className="group flex items-start gap-3 p-5 bg-mono-bg border-2 border-mono-primary/20 rounded-2xl shadow-xl hover:shadow-2xl hover:border-mono-accent transition-all hover:-translate-y-1">
                                <div className="w-12 h-12 rounded-xl bg-mono-primary flex items-center justify-center flex-shrink-0 shadow-lg group-hover:bg-mono-accent transition-colors">
                                    <svg className="w-6 h-6 text-mono-bg group-hover:text-mono-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-mono-text mb-1">Real-time Notifications</h3>
                                    <p className="text-sm text-mono-text/60">Desktop alerts with persistent reminders</p>
                                </div>
                            </div>

                            {/* Card 3 */}
                            <div className="group flex items-start gap-3 p-5 bg-mono-bg border-2 border-mono-primary/20 rounded-2xl shadow-xl hover:shadow-2xl hover:border-mono-accent transition-all hover:-translate-y-1">
                                <div className="w-12 h-12 rounded-xl bg-mono-primary flex items-center justify-center flex-shrink-0 shadow-lg group-hover:bg-mono-accent transition-colors">
                                    <svg className="w-6 h-6 text-mono-bg group-hover:text-mono-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-mono-text mb-1">Powerful Analytics</h3>
                                    <p className="text-sm text-mono-text/60">Comprehensive response tracking and insights</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="w-full">
                    <div className="bg-mono-bg border-2 border-mono-primary/20 rounded-3xl shadow-2xl overflow-hidden">

                        <div className="relative p-8 border-b border-mono-primary/20">
                            <div className="md:hidden flex items-center gap-3 mb-6">
                                <div className="w-14 h-14 bg-mono-primary rounded-2xl flex items-center justify-center shadow-lg overflow-hidden">
                                    <img src={logo} alt="Sentinel Logo" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h1 className="text-mono-text">Sentinel</h1>
                                    <p className="text-sm text-mono-text/60">Signal Enforcement</p>
                                </div>
                            </div>
                            <h2 className="text-mono-text mb-2">Welcome back</h2>
                            <p className="text-mono-text/60">
                                Sign in to manage your signals
                            </p>
                        </div>

                        <div className="relative p-8">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label htmlFor="email" className="block text-mono-text/70 mb-2">
                                        Email address
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-mono-text/40 group-focus-within:text-mono-accent transition-colors" />
                                        </div>
                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-mono-primary/20 focus:outline-none focus:ring-4 focus:ring-mono-accent/20 focus:border-mono-accent bg-mono-bg text-mono-text placeholder:text-mono-text/40 transition-all"
                                            placeholder="you@company.com"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-mono-text/70 mb-2">
                                        Password
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-mono-text/40 group-focus-within:text-mono-accent transition-colors" />
                                        </div>
                                        <input
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-mono-primary/20 focus:outline-none focus:ring-4 focus:ring-mono-accent/20 focus:border-mono-accent bg-mono-bg text-mono-text placeholder:text-mono-text/40 transition-all"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="relative w-full bg-mono-primary text-mono-bg py-4 rounded-xl hover:bg-mono-accent hover:text-mono-primary transition-all shadow-lg flex items-center justify-center gap-2 group overflow-hidden"
                                >
                                    <span className="relative">Sign in</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform relative" />
                                </button>
                            </form>

                            <div className="mt-8 pt-6 border-t border-mono-primary/20">
                                <p className="text-sm text-mono-text/60 mb-4 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-mono-accent" />
                                    Quick access (MVP Demo)
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => handleDemoLogin('alice@company.com')}
                                        className="px-4 py-3 text-sm bg-mono-accent/20 hover:bg-mono-accent/30 text-mono-primary border border-mono-accent/30 rounded-xl transition-all"
                                    >
                                        🙋‍♀️ Alice
                                    </button>
                                    <button
                                        onClick={() => handleDemoLogin('hr@company.com')}
                                        className="px-4 py-3 text-sm bg-mono-primary/20 hover:bg-mono-primary/30 text-mono-primary border border-mono-primary/30 rounded-xl transition-all"
                                    >
                                        👤 HR
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="text-center text-sm text-mono-text/60 mt-6 bg-mono-primary/10 rounded-lg p-3 border border-mono-primary/20">
                        MVP Demo • Use any email and password to sign in
                    </p>
                </div>
            </div>
        </div>
    );
}
