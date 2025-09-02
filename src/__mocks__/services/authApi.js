// Mock for authApi service
const mockAuthApi = {
  reducerPath: 'authApi',
  reducer: (state = {}) => state,
  middleware: () => (next) => (action) => next(action),
  util: {
    resetApiState: () => ({ type: 'authApi/resetApiState' }),
  },
  endpoints: {},
  injectEndpoints: () => mockAuthApi,
  enhanceEndpoints: () => mockAuthApi,
  useLazyQuery: () => [jest.fn(), { data: null, error: null, isLoading: false }],
  useQuery: () => ({ data: null, error: null, isLoading: false }),
  useMutation: () => [jest.fn(), { data: null, error: null, isLoading: false }],
  useLoginMutation: () => [jest.fn(), { data: null, error: null, isLoading: false }],
  useRegisterMutation: () => [jest.fn(), { data: null, error: null, isLoading: false }],
  useLogoutMutation: () => [jest.fn(), { data: null, error: null, isLoading: false }],
  useForgotPasswordMutation: () => [jest.fn(), { data: null, error: null, isLoading: false }],
  useResetPasswordMutation: () => [jest.fn(), { data: null, error: null, isLoading: false }],
};

module.exports = {
  authApi: mockAuthApi,
  useLoginMutation: mockAuthApi.useLoginMutation,
  useRegisterMutation: mockAuthApi.useRegisterMutation,
  useLogoutMutation: mockAuthApi.useLogoutMutation,
  useForgotPasswordMutation: mockAuthApi.useForgotPasswordMutation,
  useResetPasswordMutation: mockAuthApi.useResetPasswordMutation,
};
