import axios from 'axios';


const BASE_URL = import.meta.env.VITE_API_URL;

export const axiosClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Required to send and receive cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optional: global response interceptor for handling auth errors
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // You can trigger a global logout or redirect here
      // For example, you might want to clear auth state
      console.warn('Unauthorized – redirecting to login');
      // window.location.href = '/login'; // Uncomment if you want redirect
    }
    return Promise.reject(error);
  }
);