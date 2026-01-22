import { useState } from 'react';
import { User } from '../types';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loginError, setLoginError] = useState<string | null>(null);
    const [loginSuccess, setLoginSuccess] = useState<string | null>(null);

    const login = async (email: string, password: string) => {
        setLoginError(null);
        setLoginSuccess(null);

        try {
            if (window.electron?.backend) {
                console.log('[Frontend] Attempting login via backend:', email);
                const result = await window.electron.backend.login(email, password);

                if (result.success) {
                    console.log('[Frontend] Login successful, role:', result.data);

                    setLoginSuccess('Login successful! Loading dashboard...');
                    await new Promise(resolve => setTimeout(resolve, 500));

                    const role = result.data;
                    const isPublisher = role === 'PUBLISHER';

                    const userData: User = {
                        name: email.split('@')[0],
                        email: email,
                        role: isPublisher ? 'admin' : 'user',
                        isPublisher: isPublisher
                    };
                    setUser(userData);
                } else {
                    console.error('[Frontend] Login failed:', result.error);
                    setLoginError(result.error || 'Login failed');
                }
            } else {
                console.warn('[Frontend] Backend API not available, using mock login');
                const isPublisher =
                    email.toLowerCase().startsWith('hr') ||
                    email.toLowerCase().includes('admin') ||
                    email.toLowerCase().startsWith('publisher');
                const userData: User = {
                    name: email.split('@')[0],
                    email: email,
                    role: isPublisher ? 'admin' : 'user',
                    isPublisher: isPublisher
                };
                setUser(userData);
            }
        } catch (error) {
            console.error('[Frontend] Login error:', error);
            setLoginError('An error occurred during login');
        }
    };

    const logout = () => {
        setUser(null);
        setLoginSuccess(null);
        setLoginError(null);
    };

    return {
        user,
        loginError,
        loginSuccess,
        login,
        logout
    };
}
