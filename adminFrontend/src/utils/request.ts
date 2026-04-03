import axios from 'axios';
import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { ElMessage } from 'element-plus';
import { useUserStore } from '../stores/user';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    console.log('发送请求:', config.url);
    console.log('请求参数:', config.params);
    console.log('请求体:', config.data);
    const userStore = useUserStore();
    const token = userStore.token;
    console.log('Token:', token);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('收到响应:', response.config.url);
    console.log('响应状态:', response.status);
    console.log('响应数据:', response.data);
    const { code, message, data } = response.data;
    if (code === 200) {
      return data;
    } else {
      ElMessage.error(message || '请求失败');
      return Promise.reject(new Error(message || '请求失败'));
    }
  },
  (error) => {
    console.error('响应错误:', error);
    console.error('错误响应详情:', error.response?.data);
    
    let errorMessage = error.message || '网络错误';
    
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data) {
      errorMessage = JSON.stringify(error.response.data);
    }
    
    if (error.response?.status === 401) {
      ElMessage.error('登录已过期，请重新登录');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } else {
      ElMessage.error(errorMessage);
    }
    
    return Promise.reject(error);
  }
);

export default instance;
