import request from '@/utils/request';

export interface ModelProvider {
  id: string;
  name: string;
  code: string;
  openai_base_url?: string;
  anthropic_base_url?: string;
  description?: string;
  common_links?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ProviderModel {
  id: string;
  provider_id: string;
  name: string;
  model_code: string;
  memo?: string;
  created_at: string;
  updated_at: string;
}

// 获取所有模型平台
export const getAllModelProviders = () => {
  return request.get<any, ModelProvider[]>('/model-providers');
};

// 获取所有模型平台的可选模型
export const getAllProviderModels = () => {
  return request.get<any, any>('/model-providers/providers-models');
};

// 获取单个模型平台
export const getModelProviderById = (id: string) => {
  return request.get<any, ModelProvider>(`/model-providers/${id}`);
};

// 创建模型平台
export const createModelProvider = (data: Partial<ModelProvider>) => {
  return request.post<any, ModelProvider>('/model-providers', data);
};

// 更新模型平台
export const updateModelProvider = (id: string, data: Partial<ModelProvider>) => {
  return request.put<any, ModelProvider>(`/model-providers/${id}`, data);
};

// 更新模型平台状态
export const updateModelProviderStatus = (id: string, status: string) => {
  return request.put<any, any>(`/model-providers/${id}/status`, { status });
};

// 删除模型平台
export const deleteModelProvider = (id: string) => {
  return request.delete<any, any>(`/model-providers/${id}`);
};
