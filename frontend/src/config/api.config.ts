export const API_CONFIG = {
    baseURL: import.meta.env.VITE_BACKEND_URL || 'https://sentinel-ha37.onrender.com',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
};
