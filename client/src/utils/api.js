import axios from 'axios';
import useEcomStore from '../store/ecom-store'; 
import { toast } from 'react-toastify';
import { BASE_API_URL } from '../config';

const api = axios.create({
  baseURL: BASE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = useEcomStore.getState().token;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      
      console.warn("Unauthorized! System is forcing logout...");
      useEcomStore.getState().logout();
      localStorage.clear();
      window.location.href = '/'; 
      
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

export default api;