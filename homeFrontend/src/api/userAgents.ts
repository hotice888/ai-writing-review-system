import request from '../utils/request';

// 获取用户智能体列表
export const getUserAgents = () => {
  return request.get<any, any[]>('/user-agents');
};

// 获取单个用户智能体
export const getUserAgentById = (agentId: string) => {
  return request.get<any, any>(`/user-agents/${agentId}`);
};

// 创建用户智能体
export const createUserAgent = (data: {
  name: string;
  description?: string;
  role: string;
  instructions?: string;
  model_id?: string;
  status: string;
}) => {
  return request.post<any, any>('/user-agents', data);
};

// 更新用户智能体
export const updateUserAgent = (agentId: string, data: {
  name: string;
  description?: string;
  role: string;
  instructions?: string;
  model_id?: string;
  status: string;
}) => {
  return request.put<any, any>(`/user-agents/${agentId}`, data);
};

// 删除用户智能体
export const deleteUserAgent = (agentId: string) => {
  return request.delete<any, any>(`/user-agents/${agentId}`);
};