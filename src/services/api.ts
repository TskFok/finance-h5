import axios from 'axios';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterWithVerificationRequest,
  SendVerificationCodeRequest,
  VerifyEmailCodeRequest,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  CreateIncomeRequest,
  UpdateIncomeRequest,
  Expense,
  Income,
  PageResponse,
  ApiResponse,
  User
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL+'/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器：添加 token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：处理错误
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 认证相关 API
export const authApi = {
  login: (data: LoginRequest): Promise<ApiResponse<LoginResponse>> =>
    api.post('/auth/login', data),
  
  register: (data: RegisterRequest): Promise<ApiResponse<User>> =>
    api.post('/auth/register', data),
  
  registerWithVerification: (data: RegisterWithVerificationRequest): Promise<ApiResponse<User>> =>
    api.post('/auth/register-verified', data),
  
  sendVerificationCode: (data: SendVerificationCodeRequest): Promise<ApiResponse> =>
    api.post('/auth/send-code', data),
  
  verifyEmailCode: (data: VerifyEmailCodeRequest): Promise<ApiResponse> =>
    api.post('/auth/verify-code', data),
  
  getProfile: (): Promise<ApiResponse<User>> =>
    api.get('/auth/profile')
};

// 支出相关 API
export const expenseApi = {
  getList: (params?: {
    page?: number;
    page_size?: number;
    category?: string;
    start_time?: string;
    end_time?: string;
  }): Promise<ApiResponse<PageResponse<Expense>>> =>
    api.get('/expenses', { params }),
  
  getById: (id: number): Promise<ApiResponse<Expense>> =>
    api.get(`/expenses/${id}`),
  
  create: (data: CreateExpenseRequest): Promise<ApiResponse<Expense>> =>
    api.post('/expenses', data),
  
  update: (id: number, data: UpdateExpenseRequest): Promise<ApiResponse<Expense>> =>
    api.put(`/expenses/${id}`, data),
  
  delete: (id: number): Promise<ApiResponse> =>
    api.delete(`/expenses/${id}`),
  
  getStatistics: (params?: {
    start_time?: string;
    end_time?: string;
  }): Promise<ApiResponse> =>
    api.get('/expenses/statistics', { params })
};

// 收入相关 API
export const incomeApi = {
  getList: (params?: {
    page?: number;
    page_size?: number;
    type?: string;
    start_time?: string;
    end_time?: string;
  }): Promise<ApiResponse<PageResponse<Income>>> =>
    api.get('/incomes', { params }),
  
  getById: (id: number): Promise<ApiResponse<Income>> =>
    api.get(`/incomes/${id}`),
  
  create: (data: CreateIncomeRequest): Promise<ApiResponse<Income>> =>
    api.post('/incomes', data),
  
  update: (id: number, data: UpdateIncomeRequest): Promise<ApiResponse<Income>> =>
    api.put(`/incomes/${id}`, data),
  
  delete: (id: number): Promise<ApiResponse> =>
    api.delete(`/incomes/${id}`)
};

// 类别相关 API
export const categoryApi = {
  getList: (): Promise<ApiResponse<string[]>> =>
    api.get('/categories')
};

export default api;
