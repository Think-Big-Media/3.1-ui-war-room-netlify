/**
 * TestSprite WebSocket Real-time Tests
 *
 * Tests for WebSocket functionality:
 * - Real-time notifications
 * - Live dashboard updates
 * - Event broadcasting
 * - Presence management
 * - Connection handling
 */

import { TestSprite } from '@testsprite/core';
import { type WebSocketTestSuite } from '@testsprite/websocket';
import { type APITestSuite } from '@testsprite/api';

describe('War Room WebSocket Real-time Tests', () => {
  let testSuite: TestSprite;
  let wsTests: WebSocketTestSuite;
  let apiTests: APITestSuite;
  let authToken: string;
  let wsClient: any;

  beforeAll(async () => {
    testSuite = new TestSprite({
      baseUrl: process.env.API_URL || 'http://localhost:8000',
      wsUrl: process.env.WS_URL || 'ws://localhost:8000/ws',
    });

    wsTests = testSuite.websocket();
    apiTests = testSuite.api();

    await testSuite.initialize();

    // Create test user and get auth token
    const userResponse = await apiTests.post('/api/v1/auth/register', {
      email: 'ws-test@warroom.com',
      password: 'SecurePassword123!',
      firstName: 'WebSocket',
      lastName: 'Tester',
    });

    authToken = userResponse.data.accessToken;
  });

  afterAll(async () => {
    if (wsClient) {await wsClient.close();}
    await testSuite.cleanup();
  });

  describe('WebSocket Connection', () => {
    test('should establish WebSocket connection with valid token', async () => {
      wsClient = await wsTests.connect('/ws', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(wsClient.isConnected()).toBe(true);
      expect(wsClient.readyState).toBe(WebSocket.OPEN);
    });

    test('should reject connection with invalid token', async () => {
      await expect(
        wsTests.connect('/ws', {
          headers: {
            Authorization: 'Bearer invalid-token',
          },
        }),
      ).rejects.toThrow('401');
    });

    test('should handle connection lifecycle events', async () => {
      const events: string[] = [];

      const client = await wsTests.connect('/ws', {
        headers: { Authorization: `Bearer ${authToken}` },
        onOpen: () => events.push('open'),
        onClose: () => events.push('close'),
        onError: () => events.push('error'),
      });

      expect(events).toContain('open');

      await client.close();
      expect(events).toContain('close');
    });

    test('should automatically reconnect on disconnect', async () => {
      let reconnectCount = 0;

      const client = await wsTests.connect('/ws', {
        headers: { Authorization: `Bearer ${authToken}` },
        autoReconnect: true,
        onReconnect: () => reconnectCount++,
      });

      // Simulate disconnect
      await client.disconnect();

      // Wait for reconnection
      await wsTests.waitFor(() => reconnectCount > 0, {
        timeout: 5000,
        interval: 100,
      });

      expect(reconnectCount).toBeGreaterThan(0);
      expect(client.isConnected()).toBe(true);
    });
  });

  describe('Real-time Notifications', () => {
    test('should receive notification when event is created', async () => {
      const notifications: any[] = [];

      wsClient.on('notification', (data) => {
        notifications.push(data);
      });

      // Create an event via API
      await apiTests.post('/api/v1/events', {
        title: 'New Rally',
        startDate: '2024-06-01T18:00:00Z',
        endDate: '2024-06-01T20:00:00Z',
        location: { name: 'City Park' },
      }, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      // Wait for notification
      await wsTests.waitFor(() => notifications.length > 0, {
        timeout: 3000,
      });

      expect(notifications[0]).toMatchObject({
        type: 'event_created',
        data: {
          title: 'New Rally',
          location: { name: 'City Park' },
        },
      });
    });

    test('should broadcast to organization members only', async () => {
      // Create two clients in different organizations
      const user1 = await apiTests.post('/api/v1/auth/register', {
        email: 'org1@test.com',
        password: 'Password123!',
        firstName: 'Org1',
        lastName: 'User',
        organizationName: 'Org 1',
      });

      const user2 = await apiTests.post('/api/v1/auth/register', {
        email: 'org2@test.com',
        password: 'Password123!',
        firstName: 'Org2',
        lastName: 'User',
        organizationName: 'Org 2',
      });

      const client1 = await wsTests.connect('/ws', {
        headers: { Authorization: `Bearer ${user1.data.accessToken}` },
      });

      const client2 = await wsTests.connect('/ws', {
        headers: { Authorization: `Bearer ${user2.data.accessToken}` },
      });

      const org1Messages: any[] = [];
      const org2Messages: any[] = [];

      client1.on('message', (data) => org1Messages.push(data));
      client2.on('message', (data) => org2Messages.push(data));

      // Send message from org1
      await client1.send({
        type: 'broadcast',
        message: 'Org 1 announcement',
      });

      await wsTests.wait(1000);

      expect(org1Messages.length).toBeGreaterThan(0);
      expect(org2Messages.length).toBe(0);

      await client1.close();
      await client2.close();
    });

    test('should handle notification preferences', async () => {
      // Update user preferences to disable event notifications
      await apiTests.put('/api/v1/users/me/preferences', {
        notifications: {
          events: false,
          donations: true,
          volunteers: true,
        },
      }, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const notifications: any[] = [];
      wsClient.on('notification', (data) => notifications.push(data));

      // Create event - should not receive notification
      await apiTests.post('/api/v1/events', {
        title: 'Silent Event',
        startDate: '2024-06-01T18:00:00Z',
        endDate: '2024-06-01T20:00:00Z',
        location: { name: 'Anywhere' },
      }, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      // Create donation - should receive notification
      await apiTests.post('/api/v1/donations', {
        amount: 100,
        donorName: 'Test Donor',
        donorEmail: 'donor@test.com',
        paymentMethod: 'credit_card',
      }, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      await wsTests.wait(2000);

      expect(notifications.filter(n => n.type === 'event_created')).toHaveLength(0);
      expect(notifications.filter(n => n.type === 'donation_received')).toHaveLength(1);
    });
  });

  describe('Live Dashboard Updates', () => {
    test('should stream real-time metrics', async () => {
      const metrics: any[] = [];

      // Subscribe to metrics stream
      await wsClient.send({
        type: 'subscribe',
        channel: 'dashboard_metrics',
      });

      wsClient.on('metrics_update', (data) => metrics.push(data));

      // Trigger some activities
      await Promise.all([
        apiTests.post('/api/v1/donations', {
          amount: 500,
          donorName: 'Metric Donor',
          donorEmail: 'metric@test.com',
          paymentMethod: 'credit_card',
        }, { headers: { Authorization: `Bearer ${authToken}` } }),

        apiTests.post('/api/v1/volunteers', {
          skills: ['canvassing'],
        }, { headers: { Authorization: `Bearer ${authToken}` } }),
      ]);

      await wsTests.waitFor(() => metrics.length >= 2, {
        timeout: 5000,
      });

      expect(metrics.some(m => m.metric === 'total_donations')).toBe(true);
      expect(metrics.some(m => m.metric === 'volunteer_count')).toBe(true);
    });

    test('should provide live event attendance updates', async () => {
      // Create an event
      const eventResponse = await apiTests.post('/api/v1/events', {
        title: 'Live Event',
        startDate: '2024-06-01T18:00:00Z',
        endDate: '2024-06-01T20:00:00Z',
        location: { name: 'Convention Center' },
        capacity: 100,
      }, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const eventId = eventResponse.data.id;
      const updates: any[] = [];

      // Subscribe to event updates
      await wsClient.send({
        type: 'subscribe',
        channel: `event_${eventId}`,
      });

      wsClient.on('event_update', (data) => updates.push(data));

      // Register attendees
      for (let i = 0; i < 5; i++) {
        await apiTests.post(`/api/v1/events/${eventId}/register`, {
          attendeeCount: 1,
        }, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
      }

      await wsTests.waitFor(() => updates.length >= 5, {
        timeout: 5000,
      });

      const lastUpdate = updates[updates.length - 1];
      expect(lastUpdate.eventId).toBe(eventId);
      expect(lastUpdate.registeredCount).toBe(5);
      expect(lastUpdate.availableSpots).toBe(95);
    });
  });

  describe('Presence Management', () => {
    test('should track online users', async () => {
      const presenceUpdates: any[] = [];

      // Subscribe to presence updates
      await wsClient.send({
        type: 'subscribe',
        channel: 'presence',
      });

      wsClient.on('presence_update', (data) => presenceUpdates.push(data));

      // Connect additional users
      const additionalUsers = [];
      for (let i = 0; i < 3; i++) {
        const user = await apiTests.post('/api/v1/auth/register', {
          email: `presence${i}@test.com`,
          password: 'Password123!',
          firstName: `User${i}`,
          lastName: 'Test',
        });

        const client = await wsTests.connect('/ws', {
          headers: { Authorization: `Bearer ${user.data.accessToken}` },
        });

        additionalUsers.push(client);
      }

      await wsTests.waitFor(() => presenceUpdates.length >= 3, {
        timeout: 5000,
      });

      expect(presenceUpdates.some(p => p.type === 'user_joined')).toBe(true);
      expect(presenceUpdates.some(p => p.onlineCount >= 4)).toBe(true);

      // Disconnect users
      for (const client of additionalUsers) {
        await client.close();
      }

      await wsTests.waitFor(() =>
        presenceUpdates.some(p => p.type === 'user_left'),
      { timeout: 5000 },
      );

      expect(presenceUpdates.some(p => p.type === 'user_left')).toBe(true);
    });

    test('should show user activity status', async () => {
      const activities: any[] = [];

      wsClient.on('activity_update', (data) => activities.push(data));

      // Simulate user activities
      await wsClient.send({
        type: 'activity',
        status: 'viewing_dashboard',
      });

      await wsTests.wait(500);

      await wsClient.send({
        type: 'activity',
        status: 'editing_event',
        context: { eventId: 'event-123' },
      });

      await wsTests.waitFor(() => activities.length >= 2, {
        timeout: 3000,
      });

      expect(activities[0].status).toBe('viewing_dashboard');
      expect(activities[1].status).toBe('editing_event');
      expect(activities[1].context.eventId).toBe('event-123');
    });
  });

  describe('Message Broadcasting', () => {
    test('should broadcast messages to specific roles', async () => {
      // Create users with different roles
      const adminUser = await apiTests.post('/api/v1/auth/register', {
        email: 'broadcast-admin@test.com',
        password: 'Password123!',
        firstName: 'Admin',
        lastName: 'User',
      });

      // Update to admin role
      await apiTests.put(`/api/v1/users/${adminUser.data.user.id}/role`, {
        role: 'admin',
      }, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const adminClient = await wsTests.connect('/ws', {
        headers: { Authorization: `Bearer ${adminUser.data.accessToken}` },
      });

      const adminMessages: any[] = [];
      const userMessages: any[] = [];

      adminClient.on('broadcast', (data) => adminMessages.push(data));
      wsClient.on('broadcast', (data) => userMessages.push(data));

      // Send admin-only broadcast
      await adminClient.send({
        type: 'broadcast',
        target: 'role:admin',
        message: 'Admin announcement',
      });

      // Send all-users broadcast
      await adminClient.send({
        type: 'broadcast',
        target: 'all',
        message: 'General announcement',
      });

      await wsTests.wait(2000);

      expect(adminMessages).toHaveLength(2);
      expect(userMessages).toHaveLength(1);
      expect(userMessages[0].message).toBe('General announcement');

      await adminClient.close();
    });

    test('should handle private messages between users', async () => {
      const user2 = await apiTests.post('/api/v1/auth/register', {
        email: 'pm-user2@test.com',
        password: 'Password123!',
        firstName: 'PM',
        lastName: 'User2',
      });

      const client2 = await wsTests.connect('/ws', {
        headers: { Authorization: `Bearer ${user2.data.accessToken}` },
      });

      const user1Messages: any[] = [];
      const user2Messages: any[] = [];

      wsClient.on('private_message', (data) => user1Messages.push(data));
      client2.on('private_message', (data) => user2Messages.push(data));

      // Send private message
      await wsClient.send({
        type: 'private_message',
        recipientId: user2.data.user.id,
        message: 'Hello from user 1!',
      });

      await wsTests.waitFor(() => user2Messages.length > 0, {
        timeout: 3000,
      });

      expect(user2Messages[0]).toMatchObject({
        senderId: expect.any(String),
        message: 'Hello from user 1!',
      });

      expect(user1Messages).toHaveLength(0); // Sender shouldn't receive own message

      await client2.close();
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle malformed messages gracefully', async () => {
      const errors: any[] = [];
      wsClient.on('error', (data) => errors.push(data));

      // Send malformed messages
      await wsClient.send('invalid json string');
      await wsClient.send({ /* missing type */ });
      await wsClient.send({ type: 'unknown_type' });

      await wsTests.wait(1000);

      expect(errors.length).toBeGreaterThan(0);
      expect(wsClient.isConnected()).toBe(true); // Should not disconnect
    });

    test('should implement heartbeat/ping-pong', async () => {
      const pongs: any[] = [];
      wsClient.on('pong', () => pongs.push(Date.now()));

      // Send pings
      for (let i = 0; i < 3; i++) {
        await wsClient.ping();
        await wsTests.wait(1000);
      }

      expect(pongs).toHaveLength(3);
      expect(wsClient.isConnected()).toBe(true);
    });

    test('should handle connection timeout', async () => {
      // Create client with short timeout
      const timeoutClient = await wsTests.connect('/ws', {
        headers: { Authorization: `Bearer ${authToken}` },
        timeout: 5000, // 5 second timeout
      });

      const disconnectEvents: any[] = [];
      timeoutClient.on('disconnect', (reason) => disconnectEvents.push(reason));

      // Stop sending heartbeats
      timeoutClient.stopHeartbeat();

      await wsTests.waitFor(() => disconnectEvents.length > 0, {
        timeout: 10000,
      });

      expect(disconnectEvents[0]).toContain('timeout');
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle high message throughput', async () => {
      const receivedMessages: any[] = [];
      wsClient.on('echo', (data) => receivedMessages.push(data));

      const messageCount = 1000;
      const startTime = Date.now();

      // Send many messages rapidly
      for (let i = 0; i < messageCount; i++) {
        await wsClient.send({
          type: 'echo',
          payload: { index: i, timestamp: Date.now() },
        });
      }

      await wsTests.waitFor(() => receivedMessages.length === messageCount, {
        timeout: 10000,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;
      const messagesPerSecond = (messageCount / duration) * 1000;

      expect(receivedMessages).toHaveLength(messageCount);
      expect(messagesPerSecond).toBeGreaterThan(100); // At least 100 msg/sec
    });

    test('should maintain low latency under load', async () => {
      const latencies: number[] = [];

      wsClient.on('latency_test_response', (data) => {
        const latency = Date.now() - data.sentAt;
        latencies.push(latency);
      });

      // Send latency test messages
      for (let i = 0; i < 100; i++) {
        await wsClient.send({
          type: 'latency_test',
          sentAt: Date.now(),
        });
        await wsTests.wait(10); // Small delay between messages
      }

      await wsTests.waitFor(() => latencies.length === 100, {
        timeout: 5000,
      });

      const avgLatency = latencies.reduce((a, b) => a + b) / latencies.length;
      const p95Latency = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)];

      expect(avgLatency).toBeLessThan(50); // Average < 50ms
      expect(p95Latency).toBeLessThan(100); // 95th percentile < 100ms
    });
  });
});
