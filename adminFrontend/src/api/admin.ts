import request from '../utils/request';
import axios from 'axios';
import type { LoginRequest, User, ApiResponse, PageParams, PageResponse, Review } from '../types';

export const login = (data: LoginRequest) => {
  return request.post<any, { token: string; user: User }>('/auth/login', data);
};

export const getUserInfo = () => {
  return request.get<any, User>('/auth/user');
};

export const logout = () => {
  return request.post<any, ApiResponse>('/auth/logout');
};

export const verifyToken = (token: string) => {
  return axios.post('http://localhost:3000/api/auth/verify', { token });
};

export const getUserList = (params: PageParams) => {
  return request.get<any, PageResponse<User>>('/admin/users', { params });
};

export const getUserById = (userId: string) => {
  return request.get<any, User>(`/admin/users/${userId}`);
};

export const createUser = (data: {
  username: string;
  email: string;
  password: string;
  roles?: string[];
}) => {
  return request.post<any, ApiResponse>('/admin/users', data);
};

export const updateUser = (userId: string, data: {
  username?: string;
  email?: string;
  password?: string;
  roles?: string[];
}) => {
  return request.put<any, ApiResponse>(`/admin/users/${userId}`, data);
};

export const updateUserRole = (userId: string, role: string) => {
  return request.put<any, ApiResponse>(`/admin/users/${userId}/role`, { role });
};

export const deleteUser = (userId: string) => {
  return request.delete<any, ApiResponse>(`/admin/users/${userId}`);
};

export const getReviewList = (params: PageParams & { status?: string }) => {
  return request.get<any, PageResponse<Review>>('/admin/reviews', { params });
};

export const approveReview = (reviewId: string) => {
  return request.put<any, ApiResponse>(`/admin/reviews/${reviewId}/approve`);
};

export const rejectReview = (reviewId: string) => {
  return request.put<any, ApiResponse>(`/admin/reviews/${reviewId}/reject`);
};

export const getRoles = (params?: { page?: number; pageSize?: number; includeDisabled?: string }) => {
  return request.get<any, { list: any[]; total: number; page: number; pageSize: number }>('/roles', { params });
};

export const getRoleById = (roleId: string) => {
  return request.get<any, any>(`/roles/${roleId}`);
};

export const createRole = (data: {
  name: string;
  code: string;
  description: string;
  menuIds: string[];
}) => {
  return request.post<any, ApiResponse>('/roles', data);
};

export const updateRole = (roleId: string, data: {
  name: string;
  code: string;
  description: string;
  menuIds: string[];
}) => {
  return request.put<any, ApiResponse>(`/roles/${roleId}`, data);
};

export const deleteRole = (roleId: string) => {
  return request.delete<any, ApiResponse>(`/roles/${roleId}`);
};

export const getMenuList = (clientType: string) => {
  return request.get<any, any[]>(`/menus?clientType=${clientType}`);
};

export const getMenuById = (menuId: string) => {
  return request.get<any, any>(`/menus/${menuId}`);
};

export const getUserMenus = (clientType: string) => {
  return request.get<any, any[]>('/roles/menus/user', { params: { clientType } });
};

export const createMenu = (data: {
  name: string;
  path: string;
  component: string;
  icon: string;
  parentId?: string | null;
  sortOrder: number;
  type: string;
  isShow: boolean;
  clientType: string;
}) => {
  return request.post<any, ApiResponse>('/menus', data);
};

export const updateMenu = (menuId: string, data: {
  name: string;
  path: string;
  component: string;
  icon: string;
  parentId?: string | null;
  sortOrder: number;
  type: string;
  isShow: boolean;
  clientType: string;
}) => {
  return request.put<any, ApiResponse>(`/menus/${menuId}`, data);
};

export const deleteMenu = (menuId: string) => {
  return request.delete<any, ApiResponse>(`/menus/${menuId}`);
};
