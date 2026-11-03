export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ResendOtpRequest {
  email: string;
}

export interface OtpResponse {
  success: boolean;
  message: string;
  data?: string;
  timestamp?: string;
}

