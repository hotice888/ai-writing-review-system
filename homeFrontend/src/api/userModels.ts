import request from '../utils/request';

// 获取用户模型列表
export const getUserModels = () => {
  return request.get<any, any[]>('/user-models');
};

// 获取单个用户模型
export const getUserModelById = (modelId: string) => {
  return request.get<any, any>(`/user-models/${modelId}`);
};

// 创建用户模型
export const createUserModel = (data: {
  name: string;
  code: string;
  provider: string;
  model: string;
  api_url?: string;
  api_key?: string;
  description?: string;
  status: string;
}) => {
  return request.post<any, any>('/user-models', data);
};

// 更新用户模型
export const updateUserModel = (modelId: string, data: {
  name: string;
  code: string;
  provider: string;
  model: string;
  api_url?: string;
  api_key?: string;
  description?: string;
  status: string;
}) => {
  return request.put<any, any>(`/user-models/${modelId}`, data);
};

// 删除用户模型
export const deleteUserModel = (modelId: string) => {
  return request.delete<any, any>(`/user-models/${modelId}`);
};

// 获取平台支持的模型列表
export const getPlatformModels = () => {
  return request.get<any, any[]>('/user-models/platform/models');
};

// 获取模型提供商列表
export const getModelProviders = () => {
  return request.get<any, any[]>('/model-providers');
};