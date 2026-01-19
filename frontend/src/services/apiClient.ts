import axios, { AxiosInstance, AxiosError } from 'axios';
import { toast } from 'sonner';
import { API_CONFIG } from '../config/api.config';

// API Response wrapper
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
    baseURL: API_CONFIG.baseURL,
    timeout: API_CONFIG.timeout,
    headers: API_CONFIG.headers,
});

// Request interceptor
apiClient.interceptors.request.use(
    (config) => {
        // Add auth token here if needed in future
        // const token = localStorage.getItem('token');
        // if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);



// Response interceptor
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error: AxiosError<any>) => {
        if (error.response) {
            // Server responded with error
            const errorMessage = error.response.data?.message || 'An unexpected error occurred';
            console.error('API Error:', error.response.status, error.response.data);
            toast.error(errorMessage);
        } else if (error.request) {
            // Request made but no response
            console.error('Network Error:', error.message);
            toast.error('Network Error: Unable to connect to server');
        } else {
            // Error setting up request
            console.error('Request Error:', error.message);
            toast.error(`Request Error: ${error.message}`);
        }
        return Promise.reject(error);
    }
);

export default apiClient;
