export const API_CONFIG = {
    baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
};
