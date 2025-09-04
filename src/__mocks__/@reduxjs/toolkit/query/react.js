// Mock for @reduxjs/toolkit/query/react
const createApi = jest.fn(() => ({
  reducer: jest.fn(),
  reducerPath: 'mockApi',
  middleware: jest.fn(),
  endpoints: {},
  util: {
    resetApiState: jest.fn(),
  },
  injectEndpoints: jest.fn(),
}));

module.exports = {
  createApi,
  fetchBaseQuery: jest.fn(),
};
