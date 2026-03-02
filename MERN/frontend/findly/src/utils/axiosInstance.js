import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: 'http://localhost:7000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add the bearer token to every request
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors globally
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        // If the error is a 401 Unauthorized, we might want to clear the token and redirect to login
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            // We can't use useNavigate here as it's not a component, 
            // but the AuthProvider will pick up the null token on next refresh or state change
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
