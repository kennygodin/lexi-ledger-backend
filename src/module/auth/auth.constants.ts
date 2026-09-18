export const BCRYPT_SALT_ROUNDS = 10;

export const AUTH_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid credentials',
  LOGIN_SUCCESS: 'Login successful',
  EMAIL_ALREADY_EXISTS: 'User with this email already exists',
  CREATED: 'Account created successfully',
  INVALID_CLIENT_TYPE: 'Invalid client type',
  INVALID_REFRESH_TOKEN: 'Invalid refresh token',
  REFRESH_SUCCESS: 'Refresh successful',
  LOGOUT_SUCCESS: 'Logout successful',
  LOGOUT_ALL_SUCCESS: 'Logout all successful',
  INVALID_RESET_TOKEN: 'Invalid reset token',
  FORGOT_PASSWORD_GENERIC: 'If that email exists, we sent a reset link',
  RESET_SUCCESSFUL: 'Password reset successful',
  VERIFICATION_EMAIL_SENT_GENERIC: 'Verification email sent',
  INVALID_VERIFICATION_TOKEN: 'Invalid verification token',
  EMAIL_VERIFIED: 'Email verified successfully',
} as const;

export const LOGIN_STATUS = {
  SUCCESS: 'SUCCESS',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  TWO_FA_REQUIRED: 'TWO_FA_REQUIRED',
} as const;

export type LoginStatus = (typeof LOGIN_STATUS)[keyof typeof LOGIN_STATUS];

export enum ClientType {
  WEB = 'web',
  MOBILE = 'mobile',
}

export function isClientType(value: unknown): value is ClientType {
  return (
    typeof value === 'string' &&
    Object.values(ClientType).includes(value as ClientType)
  );
}
