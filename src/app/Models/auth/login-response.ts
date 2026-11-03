import { LoginData } from './login-data';

export interface LoginResponse {
  success: boolean;
  message: string;
  data: LoginData;
  timestamp: string;
}