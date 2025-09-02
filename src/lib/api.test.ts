import { describe, it, expect, vi, beforeEach, afterEach } from '@testing-library/jest-dom';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import api from './api';

// Create a mock adapter for axios
const mock = new MockAdapter(api);

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock console.error to avoid test output pollution
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('API Client', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mock.reset();
    localStorageMock.getItem.mockReset();
    localStorageMock.removeItem.mockReset();
    consoleErrorSpy.mockClear();
  });

  afterEach(() => {
    // Clean up after each test
    mock.reset();
  });

  describe('Configuration', () => {
    it('should have correct base URL from environment variable', () => {
      expect(api.defaults.baseURL).toBe(import.meta.env.VITE_API_URL || 'http://localhost:8000');
    });

    it('should have correct default headers', () => {
      expect(api.defaults.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('Authentication', () => {
    it('should add auth token to request headers when token exists', async () => {
      const testToken = 'test-auth-token-123';
      localStorageMock.getItem.mockReturnValue(testToken);

      // Set up mock response
      mock.onGet('/test').reply(200, { data: 'success' });

      // Make request
      const response = await api.get('/test');

      // Verify auth header was added
      expect(mock.history.get[0].headers?.Authorization).toBe(`Bearer ${testToken}`);
      expect(response.data).toEqual({ data: 'success' });
    });

    it('should not add auth header when no token exists', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      // Set up mock response
      mock.onGet('/test').reply(200, { data: 'success' });

      // Make request
      await api.get('/test');

      // Verify no auth header was added
      expect(mock.history.get[0].headers?.Authorization).toBeUndefined();
    });

    it('should call localStorage.getItem with correct key', async () => {
      mock.onGet('/test').reply(200);
      await api.get('/test');

      expect(localStorageMock.getItem).toHaveBeenCalledWith('authToken');
    });
  });

  describe('Error Handling', () => {
    describe('401 Unauthorized', () => {
      it('should clear auth token and throw authentication error', async () => {
        mock.onGet('/test').reply(401);

        await expect(api.get('/test')).rejects.toThrow('Authentication required. Please log in.');

        expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
        // Note: console.error is called in the axios-mock-adapter internals
      });
    });

    describe('403 Forbidden', () => {
      it('should throw permission error', async () => {
        mock.onGet('/test').reply(403);

        await expect(api.get('/test')).rejects.toThrow(
          'You do not have permission to perform this action.'
        );
      });
    });

    describe('404 Not Found', () => {
      it('should throw not found error', async () => {
        mock.onGet('/test').reply(404);

        await expect(api.get('/test')).rejects.toThrow('The requested resource was not found.');
      });
    });

    describe('500 Server Error', () => {
      it('should throw server error message', async () => {
        mock.onGet('/test').reply(500);

        await expect(api.get('/test')).rejects.toThrow('Server error. Please try again later.');
      });
    });

    describe('Custom Error Messages', () => {
      it('should use custom message from response data', async () => {
        mock.onGet('/test').reply(400, { message: 'Custom error message' });

        await expect(api.get('/test')).rejects.toThrow('Custom error message');
      });

      it('should use error field if message is not available', async () => {
        mock.onGet('/test').reply(400, { error: 'Error field message' });

        await expect(api.get('/test')).rejects.toThrow('Error field message');
      });

      it('should use default message for unknown errors', async () => {
        mock.onGet('/test').reply(418); // I'm a teapot!

        await expect(api.get('/test')).rejects.toThrow('An unexpected error occurred.');
      });
    });

    describe('Network Errors', () => {
      it('should handle network errors', async () => {
        mock.onGet('/test').networkError();

        await expect(api.get('/test')).rejects.toThrow('An unexpected error occurred.');
      });

      it('should handle timeout errors', async () => {
        mock.onGet('/test').timeout();

        await expect(api.get('/test')).rejects.toThrow('An unexpected error occurred.');
      });
    });

    describe('Request Configuration Errors', () => {
      it('should handle request setup errors', async () => {
        // Force an error during request setup
        const badApi = axios.create({
          baseURL: 'http://localhost:8000',
          transformRequest: [
            () => {
              throw new Error('Transform error');
            },
          ],
        });

        await expect(badApi.get('/test')).rejects.toThrow();
      });
    });
  });

  describe('Request Types', () => {
    it('should handle GET requests', async () => {
      mock.onGet('/users').reply(200, [{ id: 1, name: 'John' }]);

      const response = await api.get('/users');
      expect(response.data).toEqual([{ id: 1, name: 'John' }]);
    });

    it('should handle POST requests with data', async () => {
      const postData = { name: 'New User', email: 'user@example.com' };
      mock.onPost('/users', postData).reply(201, { id: 2, ...postData });

      const response = await api.post('/users', postData);
      expect(response.data).toEqual({ id: 2, ...postData });
      expect(mock.history.post[0].data).toBe(JSON.stringify(postData));
    });

    it('should handle PUT requests', async () => {
      const updateData = { name: 'Updated User' };
      mock.onPut('/users/1', updateData).reply(200, { id: 1, ...updateData });

      const response = await api.put('/users/1', updateData);
      expect(response.data).toEqual({ id: 1, ...updateData });
    });

    it('should handle DELETE requests', async () => {
      mock.onDelete('/users/1').reply(204);

      const response = await api.delete('/users/1');
      expect(response.status).toBe(204);
    });

    it('should handle PATCH requests', async () => {
      const patchData = { status: 'active' };
      mock.onPatch('/users/1', patchData).reply(200, { id: 1, ...patchData });

      const response = await api.patch('/users/1', patchData);
      expect(response.data).toEqual({ id: 1, ...patchData });
    });
  });

  describe('Query Parameters', () => {
    it('should handle query parameters correctly', async () => {
      mock.onGet('/users').reply((config) => {
        // Verify the params were passed correctly
        expect(config.params).toEqual({ page: 1, limit: 10, search: 'john' });
        return [200, []];
      });

      await api.get('/users', {
        params: { page: 1, limit: 10, search: 'john' },
      });

      // Verify the request was made
      expect(mock.history.get.length).toBe(1);
    });
  });

  describe('Custom Headers', () => {
    it('should allow custom headers in requests', async () => {
      mock.onGet('/test').reply(200);

      await api.get('/test', {
        headers: {
          'X-Custom-Header': 'custom-value',
        },
      });

      expect(mock.history.get[0].headers?.['X-Custom-Header']).toBe('custom-value');
    });

    it('should merge custom headers with defaults', async () => {
      mock.onPost('/test').reply(200);

      await api.post(
        '/test',
        { data: 'test' },
        {
          headers: {
            'X-Custom-Header': 'custom-value',
          },
        }
      );

      const { headers } = mock.history.post[0];
      expect(headers?.['Content-Type']).toBe('application/json');
      expect(headers?.['X-Custom-Header']).toBe('custom-value');
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple simultaneous requests', async () => {
      mock.onGet('/users').reply(200, [{ id: 1 }]);
      mock.onGet('/posts').reply(200, [{ id: 1, title: 'Post' }]);
      mock.onGet('/comments').reply(200, [{ id: 1, text: 'Comment' }]);

      const [users, posts, comments] = await Promise.all([
        api.get('/users'),
        api.get('/posts'),
        api.get('/comments'),
      ]);

      expect(users.data).toEqual([{ id: 1 }]);
      expect(posts.data).toEqual([{ id: 1, title: 'Post' }]);
      expect(comments.data).toEqual([{ id: 1, text: 'Comment' }]);
    });
  });

  describe('Request Cancellation', () => {
    it('should support request cancellation', async () => {
      const controller = new AbortController();

      mock.onGet('/slow-endpoint').reply(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve([200, { data: 'slow' }]), 1000);
        });
      });

      const requestPromise = api.get('/slow-endpoint', {
        signal: controller.signal,
      });

      // Cancel the request immediately
      controller.abort();

      await expect(requestPromise).rejects.toThrow();
    });
  });

  describe('Response Transformations', () => {
    it('should preserve response data structure', async () => {
      const complexData = {
        users: [{ id: 1, name: 'John' }],
        meta: { total: 1, page: 1 },
        nested: {
          deep: {
            value: 'test',
          },
        },
      };

      mock.onGet('/complex').reply(200, complexData);

      const response = await api.get('/complex');
      expect(response.data).toEqual(complexData);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty responses', async () => {
      mock.onGet('/empty').reply(200, '');

      const response = await api.get('/empty');
      expect(response.data).toBe('');
    });

    it('should handle non-JSON responses', async () => {
      mock.onGet('/text').reply(200, 'Plain text response', {
        'Content-Type': 'text/plain',
      });

      const response = await api.get('/text');
      expect(response.data).toBe('Plain text response');
    });

    it('should handle malformed error responses', async () => {
      mock.onGet('/bad-error').reply(400, 'Not JSON');

      await expect(api.get('/bad-error')).rejects.toThrow('An unexpected error occurred.');
    });
  });
});
