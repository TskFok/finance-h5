export interface User {
  id: number;
  username: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user_info: User;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email?: string;
}

export interface RegisterWithVerificationRequest {
  username: string;
  password: string;
  email: string;
  code: string;
}

export interface SendVerificationCodeRequest {
  email: string;
  type: 'register' | 'bind';
}

export interface VerifyEmailCodeRequest {
  email: string;
  code: string;
  type: 'register' | 'bind';
}

export interface Expense {
  id: number;
  user_id: number;
  amount: number;
  category: string;
  description?: string;
  expense_time: string;
  created_at: string;
  updated_at: string;
}

export interface Income {
  id: number;
  user_id: number;
  amount: number;
  type: string;
  income_time: string;
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseRequest {
  amount: number;
  category: string;
  description?: string;
  expense_time: string;
}

export interface UpdateExpenseRequest {
  amount?: number;
  category?: string;
  description?: string;
  expense_time?: string;
}

export interface CreateIncomeRequest {
  amount: number;
  type: string;
  income_time: string;
}

export interface UpdateIncomeRequest {
  amount?: number;
  type?: string;
  income_time?: string;
}

export interface PageResponse<T> {
  list: T[];
  page: number;
  page_size: number;
  total: number;
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}
