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
  return request.post<any, { token: string; user: any }>('/auth/verify', { token });
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

export const getUserMenus = (clientType: string, position?: string) => {
  return request.get<any, any[]>('/roles/menus/user', { params: { clientType, position } });
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

// 模型管理
export const getModels = () => {
  return request.get<any, any[]>('/models');
};

export const getModelById = (modelId: string) => {
  return request.get<any, any>(`/models/${modelId}`);
};

export const createModel = (data: {
  name: string;
  code: string;
  provider: string;
  model: string;
  description: string;
  status: string;
}) => {
  return request.post<any, ApiResponse>('/models', data);
};

export const updateModel = (modelId: string, data: {
  name: string;
  code: string;
  provider: string;
  model: string;
  description: string;
  status: string;
}) => {
  return request.put<any, ApiResponse>(`/models/${modelId}`, data);
};

export const deleteModel = (modelId: string) => {
  return request.delete<any, ApiResponse>(`/models/${modelId}`);
};

// 用户模型管理
export const getUserModels = () => {
  return request.get<any, any[]>('/admin/user-models');
};

export const getAgents = () => {
  return request.get<any, any[]>('/agents');
};

export const getAgent = (id: string) => {
  return request.get<any, any>(`/agents/${id}`);
};

export const createAgent = (data: any) => {
  return request.post<any, any>('/agents', data);
};

export const updateAgent = (id: string, data: any) => {
  return request.put<any, any>(`/agents/${id}`, data);
};

export const deleteAgent = (id: string) => {
  return request.delete<any, any>(`/agents/${id}`);
};

export const getUserAgents = () => {
  return request.get<any, any[]>('/admin/user-agents');
};

// 模型提供商管理
export const getModelProviders = () => {
  return request.get<any, any[]>('/model-providers');
};

export const getModelProviderById = (providerId: string) => {
  return request.get<any, any>(`/model-providers/${providerId}`);
};

export const createModelProvider = (data: {
  name: string;
  code: string;
  url: string;
  openai_base_url: string;
  protocol_base_url: string;
  description: string;
  status: string;
}) => {
  return request.post<any, ApiResponse>('/model-providers', data);
};

export const updateModelProvider = (providerId: string, data: {
  name: string;
  code: string;
  url: string;
  openai_base_url: string;
  protocol_base_url: string;
  description: string;
  status: string;
}) => {
  return request.put<any, ApiResponse>(`/model-providers/${providerId}`, data);
};

export const deleteModelProvider = (providerId: string) => {
  return request.delete<any, ApiResponse>(`/model-providers/${providerId}`);
};
