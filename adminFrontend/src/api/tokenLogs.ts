import request from '../utils/request';

export interface TokenLog {
  id: string;
  user_id: string;
  model_id: string;
  request_id: string;
  business_type: string;
  request_url: string;
  request_method: string;
  request_params: any;
  request_messages: any;
  response_status_code: number;
  response_success: boolean;
  response_data: any;
  error_message?: string;
  token_usage?: any;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  created_at: string;
  completed_at?: string;
  duration_ms?: number;
  user?: {
    username: string;
    email: string;
  };
  model?: {
    name: string;
    model: string;
    provider?: string;
  };
}

export interface TokenLogStats {
  total_requests: number;
  success_requests: number;
  failed_requests: number;
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
  avg_duration: number;
  max_duration: number;
}

export interface TokenLogListResponse {
  list: TokenLog[];
  total: number;
  page: number;
  pageSize: number;
}

export const getTokenLogs = (params: {
  page?: number;
  pageSize?: number;
  user_id?: string;
  model_id?: string;
  business_type?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
}) => {
  return request.get<any, TokenLogListResponse>('/token-logs', { params });
};

export const getTokenLogStats = (params?: {
  user_id?: string;
  model_id?: string;
  business_type?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
}) => {
  return request.get<any, TokenLogStats>('/token-logs/stats', { params });
};

export const getTokenLogDetail = (id: string) => {
  return request.get<any, TokenLog>(`/token-logs/${id}`);
};

export const deleteTokenLogsBatch = (ids: string[]) => {
  return request.delete('/token-logs/batch', { data: ids });
};
