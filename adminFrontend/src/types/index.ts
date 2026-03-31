export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  roles: string[];
  createdAt: string;
}

export interface Role {
  id: string;
  name: string;
  code: string;
  description?: string;
  status?: string;
  parent_ids?: string[];
  createdAt?: string;
  updatedAt?: string;
  directMenus?: any[];
  allMenus?: any[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface PageParams {
  page: number;
  pageSize: number;
}

export interface PageResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Review {
  id: string;
  userId: string;
  title: string;
  content: string;
  score: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}
