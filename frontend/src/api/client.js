import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

apiClient.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem('access_token');
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

let isRefreshing = false;

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        if (
            error.response?.status == 401 && 
            !originalRequest._retry &&
            localStorage.getItem('refresh_token') && 
            !isRefreshing
        ){
            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshtoken = localStorage.getItem('refresh_token');
                const res = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
                    refresh: refreshtoken,
                });
                
                const newAccessToken = res.data.access;
                localStorage.setItem('access_token', newAccessToken);

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                isRefreshing = false;

                return apiClient(originalRequest);
            }catch (refreshError){
                isRefreshing = false;
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;