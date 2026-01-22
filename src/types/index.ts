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

export interface ExpenseCategory {
  id: number;
  name: string;
  sort: number;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCategoryStat {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

export interface ExpenseDetailedStatistics {
  total_amount: number;
  total_count: number;
  category_stats: ExpenseCategoryStat[];
}

export interface IncomeExpenseSummary {
  total_expense: number;
  total_income: number;
}

export interface AIModel {
  id: number;
  name: string;
  base_url: string;
  created_at: string;
  updated_at: string;
}

export interface AIChatRequest {
  model_id: number;
  message: string;
}

export interface AnalysisRequest {
  model_id: number;
  start_time: string; // YYYY-MM-DD
  end_time: string; // YYYY-MM-DD
}

// 历史记录字段后端文档未给出详细 schema，这里做宽松定义（便于展示与删除）
export interface AIChatHistoryItem {
  id: number;
  model_id: number;
  created_at?: string;
  updated_at?: string;
  message?: string;
  content?: string;
  answer?: string;
  [k: string]: any;
}

export interface AIAnalysisHistoryItem {
  id: number;
  model_id: number;
  created_at?: string;
  updated_at?: string;
  start_time?: string;
  end_time?: string;
  content?: string;
  result?: string;
  [k: string]: any;
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
