// Mock for @reduxjs/toolkit
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

const createSlice = jest.fn(() => ({
  name: 'mockSlice',
  reducer: jest.fn(),
  actions: {},
  caseReducers: {},
  getInitialState: jest.fn(() => ({})),
}));

const configureStore = jest.fn(() => ({
  dispatch: jest.fn(),
  getState: jest.fn(() => ({})),
  subscribe: jest.fn(),
  replaceReducer: jest.fn(),
}));

const createAsyncThunk = jest.fn(() => jest.fn());

module.exports = {
  createApi,
  createSlice,
  configureStore,
  createAsyncThunk,
  fetchBaseQuery: jest.fn(),
};
