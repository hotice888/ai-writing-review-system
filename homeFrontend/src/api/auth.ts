import request from '../utils/request';
import type { LoginRequest, RegisterRequest, User, ApiResponse } from '../types';

export const login = (data: LoginRequest) => {
  return request.post<any, { token: string; user: User }>('/auth/login', data);
};

export const register = (data: RegisterRequest) => {
  return request.post<any, ApiResponse>('/auth/register', data);
};

export const getUserInfo = () => {
  return request.get<any, User>('/auth/user');
};

export const logout = () => {
  return request.post<any, ApiResponse>('/auth/logout');
};

export const getMenuList = (clientType: string) => {
  return request.get<any, any[]>(`/menus?clientType=${clientType}`);
};
