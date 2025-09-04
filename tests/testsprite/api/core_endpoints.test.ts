/**
 * TestSprite Core API Endpoint Tests
 *
 * Tests for the main API endpoints:
 * - Users management
 * - Organizations CRUD
 * - Events management
 * - Volunteers coordination
 * - Donations tracking
 */

import { TestSprite } from '@testsprite/core';
import { type APITestSuite } from '@testsprite/api';
import { type DatabaseTestSuite } from '@testsprite/database';
import { type PerformanceTestSuite } from '@testsprite/performance';

describe('War Room Core API Tests', () => {
  let testSuite: TestSprite;
  let apiTests: APITestSuite;
  let dbTests: DatabaseTestSuite;
  let performanceTests: PerformanceTestSuite;
  let authToken: string;
  let testOrganizationId: string;

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
    performanceTests = testSuite.performance();

    await testSuite.initialize();

    // Create test user and get auth token
    const userResponse = await apiTests.post('/api/v1/auth/register', {
      email: 'api-test@warroom.com',
      password: 'SecurePassword123!',
      firstName: 'API',
      lastName: 'Tester',
      organizationName: 'Test Organization',
    });

    authToken = userResponse.data.accessToken;

    // Get organization ID
    const meResponse = await apiTests.get('/api/v1/users/me', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    testOrganizationId = meResponse.data.organizationId;
  });

  afterAll(async () => {
    await testSuite.cleanup();
  });

  describe('Users API', () => {
    test('GET /api/v1/users/me - should return current user', async () => {
      const response = await apiTests.get('/api/v1/users/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        email: 'api-test@warroom.com',
        firstName: 'API',
        lastName: 'Tester',
        role: expect.any(String),
        organizationId: expect.any(String),
      });
    });

    test('PUT /api/v1/users/me - should update user profile', async () => {
      const updates = {
        firstName: 'Updated',
        lastName: 'Name',
        phoneNumber: '+1234567890',
      };

      const response = await apiTests.put('/api/v1/users/me', updates, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject(updates);

      // Verify in database
      const dbUser = await dbTests.query(
        'SELECT first_name, last_name, phone_number FROM users WHERE email = $1',
        ['api-test@warroom.com'],
      );
      expect(dbUser.rows[0]).toMatchObject({
        first_name: 'Updated',
        last_name: 'Name',
        phone_number: '+1234567890',
      });
    });

    test('GET /api/v1/users - should list organization users', async () => {
      // Create additional users in same organization
      for (let i = 0; i < 3; i++) {
        await dbTests.query(
          `INSERT INTO users (email, first_name, last_name, organization_id, password_hash)
           VALUES ($1, $2, $3, $4, $5)`,
          [`user${i}@warroom.com`, 'User', `${i}`, testOrganizationId, 'hash'],
        );
      }

      const response = await apiTests.get('/api/v1/users', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.items).toHaveLength(4); // Original + 3 new
      expect(response.data.total).toBe(4);
      expect(response.data.page).toBe(1);
      expect(response.data.pageSize).toBe(20);
    });

    test('should implement pagination for users', async () => {
      const response = await apiTests.get('/api/v1/users?page=1&pageSize=2', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.items).toHaveLength(2);
      expect(response.data.hasMore).toBe(true);
    });
  });

  describe('Organizations API', () => {
    test('GET /api/v1/organizations/current - should return current organization', async () => {
      const response = await apiTests.get('/api/v1/organizations/current', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        id: testOrganizationId,
        name: 'Test Organization',
        settings: expect.any(Object),
      });
    });

    test('PUT /api/v1/organizations/:id - should update organization', async () => {
      const updates = {
        name: 'Updated Organization',
        description: 'Updated description',
        website: 'https://updated.com',
        settings: {
          primaryColor: '#FF0000',
          timezone: 'America/New_York',
        },
      };

      const response = await apiTests.put(
        `/api/v1/organizations/${testOrganizationId}`,
        updates,
        { headers: { Authorization: `Bearer ${authToken}` } },
      );

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject(updates);
    });

    test('POST /api/v1/organizations/:id/invite - should invite users', async () => {
      const inviteData = {
        email: 'invite@warroom.com',
        role: 'volunteer',
        message: 'Join our campaign!',
      };

      const response = await apiTests.post(
        `/api/v1/organizations/${testOrganizationId}/invite`,
        inviteData,
        { headers: { Authorization: `Bearer ${authToken}` } },
      );

      expect(response.status).toBe(201);
      expect(response.data).toMatchObject({
        id: expect.any(String),
        email: inviteData.email,
        role: inviteData.role,
        status: 'pending',
      });

      // Verify invite in database
      const invite = await dbTests.query(
        'SELECT * FROM invitations WHERE email = $1',
        [inviteData.email],
      );
      expect(invite.rows).toHaveLength(1);
    });
  });

  describe('Events API', () => {
    let eventId: string;

    test('POST /api/v1/events - should create new event', async () => {
      const newEvent = {
        title: 'Campaign Rally',
        description: 'Join us for a campaign rally!',
        startDate: '2024-06-01T18:00:00Z',
        endDate: '2024-06-01T20:00:00Z',
        location: {
          name: 'City Hall',
          address: '123 Main St',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62701',
        },
        capacity: 200,
        requiresRegistration: true,
      };

      const response = await apiTests.post('/api/v1/events', newEvent, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(201);
      expect(response.data).toMatchObject({
        id: expect.any(String),
        ...newEvent,
        organizationId: testOrganizationId,
        createdBy: expect.any(String),
      });

      eventId = response.data.id;
    });

    test('GET /api/v1/events - should list events with filters', async () => {
      // Create multiple events
      const events = [
        { title: 'Fundraiser', startDate: '2024-05-15T18:00:00Z' },
        { title: 'Volunteer Training', startDate: '2024-06-15T18:00:00Z' },
        { title: 'Phone Banking', startDate: '2024-07-01T18:00:00Z' },
      ];

      for (const event of events) {
        await apiTests.post('/api/v1/events', {
          ...event,
          endDate: event.startDate,
          location: { name: 'Online' },
        }, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
      }

      // Test date filtering
      const response = await apiTests.get(
        '/api/v1/events?startDate=2024-06-01&endDate=2024-06-30',
        { headers: { Authorization: `Bearer ${authToken}` } },
      );

      expect(response.status).toBe(200);
      expect(response.data.items).toHaveLength(2); // Rally + Training
      expect(response.data.items.every(e =>
        e.startDate >= '2024-06-01' && e.startDate <= '2024-06-30',
      )).toBe(true);
    });

    test('POST /api/v1/events/:id/register - should register for event', async () => {
      const registration = {
        attendeeCount: 2,
        comments: 'Looking forward to it!',
      };

      const response = await apiTests.post(
        `/api/v1/events/${eventId}/register`,
        registration,
        { headers: { Authorization: `Bearer ${authToken}` } },
      );

      expect(response.status).toBe(201);
      expect(response.data).toMatchObject({
        eventId,
        userId: expect.any(String),
        status: 'registered',
        attendeeCount: 2,
      });

      // Verify registration count updated
      const event = await apiTests.get(`/api/v1/events/${eventId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(event.data.registeredCount).toBe(2);
    });

    test('GET /api/v1/events/:id/attendees - should list event attendees', async () => {
      const response = await apiTests.get(
        `/api/v1/events/${eventId}/attendees`,
        { headers: { Authorization: `Bearer ${authToken}` } },
      );

      expect(response.status).toBe(200);
      expect(response.data.items).toHaveLength(1);
      expect(response.data.items[0]).toMatchObject({
        userId: expect.any(String),
        userName: 'Updated Name',
        attendeeCount: 2,
        status: 'registered',
      });
    });
  });

  describe('Volunteers API', () => {
    let volunteerId: string;

    test('POST /api/v1/volunteers - should create volunteer profile', async () => {
      const volunteerData = {
        skills: ['canvassing', 'phone_banking', 'data_entry'],
        availability: {
          monday: ['morning', 'evening'],
          tuesday: ['evening'],
          saturday: ['morning', 'afternoon'],
        },
        interests: ['voter_registration', 'fundraising'],
        experience: 'Previous campaign volunteer',
        emergencyContact: {
          name: 'Jane Doe',
          phone: '+1234567890',
          relationship: 'Spouse',
        },
      };

      const response = await apiTests.post('/api/v1/volunteers', volunteerData, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(201);
      expect(response.data).toMatchObject({
        id: expect.any(String),
        userId: expect.any(String),
        ...volunteerData,
      });

      volunteerId = response.data.id;
    });

    test('GET /api/v1/volunteers/search - should search volunteers by skills', async () => {
      // Create additional volunteers with different skills
      const volunteers = [
        { userId: 'user1', skills: ['canvassing', 'driving'] },
        { userId: 'user2', skills: ['phone_banking', 'social_media'] },
        { userId: 'user3', skills: ['data_entry', 'canvassing'] },
      ];

      for (const vol of volunteers) {
        await dbTests.query(
          `INSERT INTO volunteers (user_id, organization_id, skills)
           VALUES ($1, $2, $3)`,
          [vol.userId, testOrganizationId, JSON.stringify(vol.skills)],
        );
      }

      const response = await apiTests.get(
        '/api/v1/volunteers/search?skills=canvassing',
        { headers: { Authorization: `Bearer ${authToken}` } },
      );

      expect(response.status).toBe(200);
      expect(response.data.items).toHaveLength(3); // Original + 2 with canvassing
      expect(response.data.items.every(v =>
        v.skills.includes('canvassing'),
      )).toBe(true);
    });

    test('POST /api/v1/volunteers/:id/hours - should log volunteer hours', async () => {
      const hoursData = {
        date: '2024-05-20',
        hours: 4.5,
        activity: 'Phone Banking',
        notes: 'Called 50 voters',
      };

      const response = await apiTests.post(
        `/api/v1/volunteers/${volunteerId}/hours`,
        hoursData,
        { headers: { Authorization: `Bearer ${authToken}` } },
      );

      expect(response.status).toBe(201);
      expect(response.data).toMatchObject({
        volunteerId,
        ...hoursData,
        approvedBy: null,
        approvedAt: null,
      });

      // Verify total hours updated
      const volunteer = await apiTests.get(`/api/v1/volunteers/${volunteerId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(volunteer.data.totalHours).toBe(4.5);
    });
  });

  describe('Donations API', () => {
    test('POST /api/v1/donations - should record donation', async () => {
      const donation = {
        amount: 250.00,
        donorName: 'John Smith',
        donorEmail: 'john@example.com',
        donorPhone: '+1234567890',
        paymentMethod: 'credit_card',
        isRecurring: false,
        isAnonymous: false,
        notes: 'Keep up the great work!',
      };

      const response = await apiTests.post('/api/v1/donations', donation, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(201);
      expect(response.data).toMatchObject({
        id: expect.any(String),
        ...donation,
        status: 'completed',
        receiptNumber: expect.any(String),
      });
    });

    test('GET /api/v1/donations/summary - should return donation analytics', async () => {
      // Create multiple donations
      const donations = [
        { amount: 100, donorEmail: 'donor1@test.com' },
        { amount: 500, donorEmail: 'donor2@test.com' },
        { amount: 1000, donorEmail: 'donor3@test.com' },
        { amount: 50, donorEmail: 'donor1@test.com' }, // Repeat donor
      ];

      for (const donation of donations) {
        await apiTests.post('/api/v1/donations', {
          ...donation,
          donorName: 'Test Donor',
          paymentMethod: 'credit_card',
        }, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
      }

      const response = await apiTests.get('/api/v1/donations/summary', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        totalAmount: 1900.00, // 250 + 100 + 500 + 1000 + 50
        totalDonations: 5,
        uniqueDonors: 4,
        averageDonation: 380.00,
        largestDonation: 1000.00,
        monthlyTrend: expect.any(Array),
      });
    });

    test('should enforce donation limits and validation', async () => {
      // Test maximum donation amount
      const largeDonation = {
        amount: 10000.01, // Over $10,000 limit
        donorName: 'Big Donor',
        donorEmail: 'big@donor.com',
        paymentMethod: 'wire_transfer',
      };

      const response = await apiTests.post('/api/v1/donations', largeDonation, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(422);
      expect(response.data.detail).toContain('exceeds maximum');
    });
  });

  describe('Performance Tests', () => {
    test('API endpoints should respond within SLA', async () => {
      const endpoints = [
        { method: 'GET', path: '/api/v1/users/me', sla: 100 },
        { method: 'GET', path: '/api/v1/events', sla: 200 },
        { method: 'GET', path: '/api/v1/volunteers/search?skills=any', sla: 300 },
      ];

      for (const endpoint of endpoints) {
        const result = await performanceTests.measure({
          method: endpoint.method,
          url: endpoint.path,
          headers: { Authorization: `Bearer ${authToken}` },
          iterations: 10,
        });

        expect(result.averageResponseTime).toBeLessThan(endpoint.sla);
        expect(result.p95ResponseTime).toBeLessThan(endpoint.sla * 1.5);
      }
    });

    test('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 50;
      const requests = Array(concurrentRequests).fill(null).map(() =>
        apiTests.get('/api/v1/events', {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      expect(responses.every(r => r.status === 200)).toBe(true);
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Error Handling', () => {
    test('should return proper error for non-existent resources', async () => {
      const response = await apiTests.get(
        '/api/v1/events/non-existent-id',
        { headers: { Authorization: `Bearer ${authToken}` } },
      );

      expect(response.status).toBe(404);
      expect(response.data).toMatchObject({
        detail: expect.stringContaining('not found'),
        type: 'not_found_error',
      });
    });

    test('should validate request bodies', async () => {
      const invalidEvent = {
        title: '', // Empty title
        startDate: 'invalid-date',
        endDate: '2024-01-01', // End before start
        capacity: -10, // Negative capacity
      };

      const response = await apiTests.post('/api/v1/events', invalidEvent, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(422);
      expect(response.data.detail).toBeInstanceOf(Array);
      expect(response.data.detail.length).toBeGreaterThan(3);
    });

    test('should handle database errors gracefully', async () => {
      // Simulate database connection error
      await dbTests.disconnect();

      const response = await apiTests.get('/api/v1/users/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(503);
      expect(response.data.detail).toContain('service unavailable');

      // Reconnect for other tests
      await dbTests.connect();
    });
  });
});
