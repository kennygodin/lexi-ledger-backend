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
} as const;

export const BCRYPT_SALT_ROUNDS = 10;

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
