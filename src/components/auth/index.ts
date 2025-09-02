/**
 * Authentication Components Export Index
 * Central export point for all auth-related components
 */

// Form Components
export { LoginForm } from './LoginForm';
export { RegisterForm } from './RegisterForm';
export { ForgotPasswordForm } from './ForgotPasswordForm';
export { ResetPasswordForm } from './ResetPasswordForm';
export { EmailVerificationPage } from './EmailVerificationPage';

// Route Protection Components
export {
  ProtectedRoute,
  AdminRoute,
  ManagerRoute,
  PermissionRoute,
  VerifiedRoute,
  PublicRoute,
  ConditionalRender,
} from './ProtectedRoute';

// Context and Hooks
export { AuthProvider, useAuth, RequireAuth, usePermissions } from '../../contexts/AuthContext';

// API Services
export {
  authApi,
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useLogoutAllDevicesMutation,
  useRefreshTokenMutation,
  useGetCurrentUserQuery,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useVerifyEmailMutation,
  useResendVerificationMutation,
  authUtils,
} from '../../services/authApi';

// Types
export type {
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  UserProfile,
  PasswordResetRequest,
  PasswordResetConfirm,
  ChangePasswordRequest,
  RefreshTokenRequest,
} from '../../services/authApi';
