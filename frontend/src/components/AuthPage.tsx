import { useState } from 'react';
import { Mail, Lock, ArrowRight, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import RibbitLogo from './RibbitLogo';

interface AuthPageProps {
    onLogin: (email: string, password: string) => Promise<void>;
    error?: string | null;
    success?: string | null;
}

export default function AuthPage({ onLogin, error, success }: AuthPageProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (email && password) {
            setIsLoading(true);
            try {
                await onLogin(email, password);
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="min-h-screen bg-ribbit-dust-grey flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated background elements - organic forest shapes */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-ribbit-dry-sage/30 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-ribbit-fern/15 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-ribbit-dry-sage/10 rounded-full blur-3xl"></div>
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-ribbit-dust-grey/50 via-transparent to-ribbit-dry-sage/20"></div>
            </div>

            <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center relative z-10">
                {/* Left Side - Branding */}
                <div className="hidden md:block">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="relative">
                                <RibbitLogo size={80} variant="animated" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-foreground tracking-tight">Ribbit</h1>
                                <p className="text-foreground-secondary">Signal with Nature's Clarity</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Feature Card 1 */}
                            <div className="flex items-start gap-3 p-5 bg-ribbit-dry-sage/60 backdrop-blur-sm border border-ribbit-fern/30 rounded-2xl shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:bg-ribbit-dry-sage/80">
                                <div className="w-12 h-12 rounded-xl bg-ribbit-hunter-green flex items-center justify-center flex-shrink-0 shadow-lg">
                                    <svg className="w-6 h-6 text-ribbit-dust-grey" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-ribbit-hunter-green mb-1">Enforce Accountability</h3>
                                    <p className="text-sm text-ribbit-pine-teal/70">Track every response with timestamp and context</p>
                                </div>
                            </div>

                            {/* Feature Card 2 */}
                            <div className="flex items-start gap-3 p-5 bg-ribbit-dry-sage/60 backdrop-blur-sm border border-ribbit-fern/30 rounded-2xl shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:bg-ribbit-dry-sage/80">
                                <div className="w-12 h-12 rounded-xl bg-ribbit-hunter-green flex items-center justify-center flex-shrink-0 shadow-lg">
                                    <svg className="w-6 h-6 text-ribbit-dust-grey" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-ribbit-hunter-green mb-1">Real-time Notifications</h3>
                                    <p className="text-sm text-ribbit-pine-teal/70">Desktop alerts with persistent reminders</p>
                                </div>
                            </div>

                            {/* Feature Card 3 */}
                            <div className="flex items-start gap-3 p-5 bg-ribbit-dry-sage/60 backdrop-blur-sm border border-ribbit-fern/30 rounded-2xl shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:bg-ribbit-dry-sage/80">
                                <div className="w-12 h-12 rounded-xl bg-ribbit-hunter-green flex items-center justify-center flex-shrink-0 shadow-lg">
                                    <svg className="w-6 h-6 text-ribbit-dust-grey" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-ribbit-hunter-green mb-1">Powerful Analytics</h3>
                                    <p className="text-sm text-ribbit-pine-teal/70">Comprehensive response tracking and insights</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="w-full">
                    <div className="bg-ribbit-dry-sage/70 backdrop-blur-md border border-ribbit-fern/30 rounded-3xl shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="relative p-8 border-b border-ribbit-fern/20 bg-ribbit-dry-sage/30">
                            <div className="md:hidden flex items-center gap-3 mb-6">
                                <RibbitLogo size={56} variant="animated" />
                                <div>
                                    <h1 className="text-2xl font-bold text-foreground">Ribbit</h1>
                                    <p className="text-sm text-foreground-secondary">Signal Management</p>
                                </div>
                            </div>
                            <h2 className="text-xl font-semibold text-ribbit-hunter-green mb-2">Welcome back</h2>
                            <p className="text-ribbit-pine-teal/70">
                                Sign in to manage your signals
                            </p>
                        </div>

                        {/* Form Container */}
                        <div className="relative p-8">
                            {/* Error Message */}
                            {error && (
                                <div className="mb-4 p-4 bg-red-500/15 border border-red-500/40 rounded-xl flex items-start gap-3 animate-fade-in">
                                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-red-700 font-medium text-sm">{error}</p>
                                    </div>
                                </div>
                            )}

                            {/* Success Message */}
                            {success && (
                                <div className="mb-4 p-4 bg-green-500/15 border border-green-500/40 rounded-xl flex items-start gap-3 animate-fade-in">
                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-green-700 font-medium text-sm">{success}</p>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Email Field */}
                                <div>
                                    <label htmlFor="email" className="block text-ribbit-pine-teal font-medium mb-2">
                                        Email address
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-ribbit-fern/60 group-focus-within:text-ribbit-hunter-green transition-colors" />
                                        </div>
                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-ribbit-fern/30 bg-ribbit-dust-grey/80 text-ribbit-pine-teal placeholder:text-ribbit-pine-teal/40 focus:outline-none focus:ring-4 focus:ring-ribbit-fern/20 focus:border-ribbit-fern transition-all duration-200"
                                            placeholder="you@company.com"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Password Field */}
                                <div>
                                    <label htmlFor="password" className="block text-ribbit-pine-teal font-medium mb-2">
                                        Password
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-ribbit-fern/60 group-focus-within:text-ribbit-hunter-green transition-colors" />
                                        </div>
                                        <input
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-ribbit-fern/30 bg-ribbit-dust-grey/80 text-ribbit-pine-teal placeholder:text-ribbit-pine-teal/40 focus:outline-none focus:ring-4 focus:ring-ribbit-fern/20 focus:border-ribbit-fern transition-all duration-200"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="relative w-full bg-ribbit-hunter-green text-ribbit-dust-grey py-4 rounded-xl font-semibold shadow-lg flex items-center justify-center gap-2 group overflow-hidden transition-all duration-200 hover:bg-[#2f4a35] hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-ribbit-fern focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-ribbit-hunter-green"
                                >
                                    {/* Hover glow effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-ribbit-fern/0 via-ribbit-fern/20 to-ribbit-fern/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    
                                    {isLoading ? (
                                        <>
                                            <Loader className="w-5 h-5 animate-spin relative z-10" />
                                            <span className="relative z-10">Signing in...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="relative z-10">Sign in</span>
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform relative z-10" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Footer text */}
                    <p className="text-center text-sm text-ribbit-pine-teal/50 mt-6">
                        Secure signal management for teams
                    </p>
                </div>
            </div>
        </div>
    );
}
