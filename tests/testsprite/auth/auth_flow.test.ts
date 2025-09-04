/**
 * TestSprite Authentication Flow Tests
 *
 * Comprehensive tests for the War Room authentication system including:
 * - User registration
 * - Login/logout flows
 * - JWT token management
 * - Password reset
 * - Role-based access control
 */

import { TestSprite } from '@testsprite/core';
import { type APITestSuite } from '@testsprite/api';
import { type DatabaseTestSuite } from '@testsprite/database';
import { type SecurityTestSuite } from '@testsprite/security';

describe('War Room Authentication Tests', () => {
  let testSuite: TestSprite;
  let apiTests: APITestSuite;
  let dbTests: DatabaseTestSuite;
  let securityTests: SecurityTestSuite;

  beforeAll(async () => {
    testSuite = new TestSprite({
      baseUrl: process.env.API_URL || 'http://localhost:8000',
      database: {
        url: process.env.DATABASE_URL,
        resetBetweenTests: true,
      },
    });

    apiTests = testSuite.api();
    dbTests = testSuite.database();
    securityTests = testSuite.security();

    await testSuite.initialize();
  });

  afterAll(async () => {
    await testSuite.cleanup();
  });

  describe('User Registration', () => {
    test('should successfully register a new user', async () => {
      const newUser = {
        email: 'test@warroom.com',
        password: 'SecurePassword123!',
        firstName: 'Test',
        lastName: 'User',
        organizationName: 'Test Campaign',
      };

      const response = await apiTests.post('/api/v1/auth/register', newUser);

      expect(response.status).toBe(201);
      expect(response.data).toMatchObject({
        user: {
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
        },
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      });

      // Verify user was created in database
      const dbUser = await dbTests.query('SELECT * FROM users WHERE email = $1', [newUser.email]);
      expect(dbUser.rows).toHaveLength(1);
      expect(dbUser.rows[0].email).toBe(newUser.email);
    });

    test('should reject registration with invalid email', async () => {
      const invalidUser = {
        email: 'invalid-email',
        password: 'SecurePassword123!',
        firstName: 'Test',
        lastName: 'User',
      };

      const response = await apiTests.post('/api/v1/auth/register', invalidUser);

      expect(response.status).toBe(422);
      expect(response.data.detail).toContain('email');
    });

    test('should reject weak passwords', async () => {
      const weakPasswordUser = {
        email: 'weak@warroom.com',
        password: '123456',
        firstName: 'Test',
        lastName: 'User',
      };

      const response = await apiTests.post('/api/v1/auth/register', weakPasswordUser);

      expect(response.status).toBe(422);
      expect(response.data.detail).toContain('password');
    });

    test('should prevent duplicate email registration', async () => {
      const user = {
        email: 'duplicate@warroom.com',
        password: 'SecurePassword123!',
        firstName: 'Test',
        lastName: 'User',
      };

      // First registration should succeed
      await apiTests.post('/api/v1/auth/register', user);

      // Second registration should fail
      const response = await apiTests.post('/api/v1/auth/register', user);
      expect(response.status).toBe(409);
      expect(response.data.detail).toContain('already exists');
    });
  });

  describe('Login Flow', () => {
    const testUser = {
      email: 'login@warroom.com',
      password: 'SecurePassword123!',
    };

    beforeEach(async () => {
      // Create test user
      await apiTests.post('/api/v1/auth/register', {
        ...testUser,
        firstName: 'Login',
        lastName: 'Test',
      });
    });

    test('should successfully login with valid credentials', async () => {
      const response = await apiTests.post('/api/v1/auth/login', {
        username: testUser.email,
        password: testUser.password,
      });

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        tokenType: 'bearer',
      });

      // Verify JWT token is valid
      const tokenValid = await securityTests.verifyJWT(response.data.accessToken);
      expect(tokenValid).toBe(true);
    });

    test('should reject login with invalid password', async () => {
      const response = await apiTests.post('/api/v1/auth/login', {
        username: testUser.email,
        password: 'WrongPassword123!',
      });

      expect(response.status).toBe(401);
      expect(response.data.detail).toContain('Invalid credentials');
    });

    test('should reject login with non-existent user', async () => {
      const response = await apiTests.post('/api/v1/auth/login', {
        username: 'nonexistent@warroom.com',
        password: 'AnyPassword123!',
      });

      expect(response.status).toBe(401);
      expect(response.data.detail).toContain('Invalid credentials');
    });

    test('should implement rate limiting on login attempts', async () => {
      // Make 10 rapid login attempts
      const attempts = Array(10).fill(null).map(() =>
        apiTests.post('/api/v1/auth/login', {
          username: testUser.email,
          password: 'WrongPassword',
        }),
      );

      const responses = await Promise.all(attempts);
      const rateLimited = responses.some(r => r.status === 429);

      expect(rateLimited).toBe(true);
    });
  });

  describe('JWT Token Management', () => {
    let accessToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      // Create and login user
      const user = {
        email: 'token@warroom.com',
        password: 'SecurePassword123!',
        firstName: 'Token',
        lastName: 'Test',
      };

      await apiTests.post('/api/v1/auth/register', user);
      const loginResponse = await apiTests.post('/api/v1/auth/login', {
        username: user.email,
        password: user.password,
      });

      accessToken = loginResponse.data.accessToken;
      refreshToken = loginResponse.data.refreshToken;
    });

    test('should access protected endpoints with valid token', async () => {
      const response = await apiTests.get('/api/v1/users/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.email).toBe('token@warroom.com');
    });

    test('should reject requests with invalid token', async () => {
      const response = await apiTests.get('/api/v1/users/me', {
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });

      expect(response.status).toBe(401);
    });

    test('should refresh access token with valid refresh token', async () => {
      const response = await apiTests.post('/api/v1/auth/refresh', {
        refreshToken,
      });

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      });

      // New access token should be different
      expect(response.data.accessToken).not.toBe(accessToken);
    });

    test('should reject expired tokens', async () => {
      // Create an expired token for testing
      const expiredToken = await securityTests.createExpiredJWT({
        sub: 'test-user',
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      });

      const response = await apiTests.get('/api/v1/users/me', {
        headers: {
          Authorization: `Bearer ${expiredToken}`,
        },
      });

      expect(response.status).toBe(401);
      expect(response.data.detail).toContain('expired');
    });
  });

  describe('Password Reset Flow', () => {
    const testUser = {
      email: 'reset@warroom.com',
      password: 'OldPassword123!',
    };

    beforeEach(async () => {
      await apiTests.post('/api/v1/auth/register', {
        ...testUser,
        firstName: 'Reset',
        lastName: 'Test',
      });
    });

    test('should initiate password reset for valid email', async () => {
      const response = await apiTests.post('/api/v1/auth/forgot-password', {
        email: testUser.email,
      });

      expect(response.status).toBe(200);
      expect(response.data.message).toContain('reset link sent');

      // Verify reset token was created in database
      const resetToken = await dbTests.query(
        'SELECT * FROM password_reset_tokens WHERE user_email = $1',
        [testUser.email],
      );
      expect(resetToken.rows).toHaveLength(1);
    });

    test('should successfully reset password with valid token', async () => {
      // Request reset
      await apiTests.post('/api/v1/auth/forgot-password', {
        email: testUser.email,
      });

      // Get reset token from database (in real scenario, this would come from email)
      const tokenResult = await dbTests.query(
        'SELECT token FROM password_reset_tokens WHERE user_email = $1',
        [testUser.email],
      );
      const resetToken = tokenResult.rows[0].token;

      // Reset password
      const newPassword = 'NewSecurePassword123!';
      const response = await apiTests.post('/api/v1/auth/reset-password', {
        token: resetToken,
        newPassword,
      });

      expect(response.status).toBe(200);

      // Verify can login with new password
      const loginResponse = await apiTests.post('/api/v1/auth/login', {
        username: testUser.email,
        password: newPassword,
      });
      expect(loginResponse.status).toBe(200);
    });

    test('should reject invalid reset tokens', async () => {
      const response = await apiTests.post('/api/v1/auth/reset-password', {
        token: 'invalid-token',
        newPassword: 'NewPassword123!',
      });

      expect(response.status).toBe(400);
      expect(response.data.detail).toContain('Invalid');
    });
  });

  describe('Role-Based Access Control', () => {
    let adminToken: string;
    let userToken: string;
    let platformAdminToken: string;

    beforeAll(async () => {
      // Create users with different roles
      const users = [
        { email: 'admin@warroom.com', role: 'admin' },
        { email: 'user@warroom.com', role: 'user' },
        { email: 'platform@warroom.com', role: 'platform_admin' },
      ];

      for (const user of users) {
        await apiTests.post('/api/v1/auth/register', {
          ...user,
          password: 'SecurePassword123!',
          firstName: user.role,
          lastName: 'Test',
        });

        // Update role in database
        await dbTests.query(
          'UPDATE users SET role = $1 WHERE email = $2',
          [user.role, user.email],
        );

        // Login to get token
        const loginResponse = await apiTests.post('/api/v1/auth/login', {
          username: user.email,
          password: 'SecurePassword123!',
        });

        if (user.role === 'admin') {adminToken = loginResponse.data.accessToken;}
        if (user.role === 'user') {userToken = loginResponse.data.accessToken;}
        if (user.role === 'platform_admin') {platformAdminToken = loginResponse.data.accessToken;}
      }
    });

    test('should allow admin access to admin endpoints', async () => {
      const response = await apiTests.get('/api/v1/admin/users', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
    });

    test('should deny regular user access to admin endpoints', async () => {
      const response = await apiTests.get('/api/v1/admin/users', {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      expect(response.status).toBe(403);
    });

    test('should allow platform admin access to platform endpoints', async () => {
      const response = await apiTests.get('/api/v1/platform-admin/organizations', {
        headers: { Authorization: `Bearer ${platformAdminToken}` },
      });

      expect(response.status).toBe(200);
    });

    test('should enforce organization-level access control', async () => {
      // Create two organizations
      const org1Response = await apiTests.post('/api/v1/organizations', {
        name: 'Org 1',
      }, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const org2Response = await apiTests.post('/api/v1/organizations', {
        name: 'Org 2',
      }, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      // User from org1 shouldn't access org2 data
      const response = await apiTests.get(`/api/v1/organizations/${org2Response.data.id}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      expect(response.status).toBe(403);
    });
  });

  describe('Security Tests', () => {
    test('should prevent SQL injection in login', async () => {
      const sqlInjectionAttempts = [
        { username: "admin' OR '1'='1", password: 'password' },
        { username: 'admin"; DROP TABLE users; --', password: 'password' },
        { username: "admin' UNION SELECT * FROM users--", password: 'password' },
      ];

      for (const attempt of sqlInjectionAttempts) {
        const response = await apiTests.post('/api/v1/auth/login', attempt);
        expect(response.status).toBe(401);

        // Verify database is intact
        const users = await dbTests.query('SELECT COUNT(*) FROM users');
        expect(users.rows[0].count).toBeGreaterThan(0);
      }
    });

    test('should prevent XSS in registration', async () => {
      const xssAttempts = [
        { firstName: '<script>alert("XSS")</script>', lastName: 'Test' },
        { firstName: 'Test', lastName: '<img src=x onerror=alert("XSS")>' },
        { firstName: 'javascript:alert("XSS")', lastName: 'Test' },
      ];

      for (const attempt of xssAttempts) {
        const response = await apiTests.post('/api/v1/auth/register', {
          email: `xss${Date.now()}@test.com`,
          password: 'SecurePassword123!',
          ...attempt,
        });

        if (response.status === 201) {
          // Verify stored data is properly escaped
          const {user} = response.data;
          expect(user.firstName).not.toContain('<script>');
          expect(user.lastName).not.toContain('<script>');
        }
      }
    });

    test('should implement proper CORS headers', async () => {
      const response = await apiTests.options('/api/v1/auth/login');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toContain('POST');
      expect(response.headers['access-control-allow-headers']).toContain('content-type');
    });

    test('should enforce HTTPS in production', async () => {
      if (process.env.NODE_ENV === 'production') {
        const response = await apiTests.get('/api/v1/health', {
          headers: { 'X-Forwarded-Proto': 'http' },
        });

        expect(response.status).toBe(301);
        expect(response.headers.location).toMatch(/^https:/);
      }
    });
  });

  describe('Logout Flow', () => {
    test('should successfully logout and invalidate tokens', async () => {
      // Login first
      const loginResponse = await apiTests.post('/api/v1/auth/login', {
        username: 'logout@warroom.com',
        password: 'SecurePassword123!',
      });

      const { accessToken, refreshToken } = loginResponse.data;

      // Logout
      const logoutResponse = await apiTests.post('/api/v1/auth/logout', {
        refreshToken,
      }, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(logoutResponse.status).toBe(200);

      // Verify token is invalidated
      const response = await apiTests.get('/api/v1/users/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      expect(response.status).toBe(401);
    });
  });
});
