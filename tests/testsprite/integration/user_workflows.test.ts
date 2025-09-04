/**
 * TestSprite Integration Tests - User Workflows
 *
 * End-to-end tests for complete user workflows:
 * - Campaign organizer workflow
 * - Volunteer onboarding and participation
 * - Donor journey
 * - Event management lifecycle
 * - Platform admin operations
 */

import { TestSprite } from '@testsprite/core';
import { type APITestSuite } from '@testsprite/api';
import { type DatabaseTestSuite } from '@testsprite/database';
import { type BrowserTestSuite } from '@testsprite/browser';
import { type EmailTestSuite } from '@testsprite/email';

describe('War Room Integration Tests - User Workflows', () => {
  let testSuite: TestSprite;
  let apiTests: APITestSuite;
  let dbTests: DatabaseTestSuite;
  let browserTests: BrowserTestSuite;
  let emailTests: EmailTestSuite;

  beforeAll(async () => {
    testSuite = new TestSprite({
      baseUrl: process.env.API_URL || 'http://localhost:8000',
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
      database: {
        url: process.env.DATABASE_URL,
        resetBetweenTests: true,
      },
      email: {
        provider: 'test', // Uses test email provider
        captureEmails: true,
      },
    });

    apiTests = testSuite.api();
    dbTests = testSuite.database();
    browserTests = testSuite.browser();
    emailTests = testSuite.email();

    await testSuite.initialize();
  });

  afterAll(async () => {
    await testSuite.cleanup();
  });

  describe('Campaign Organizer Complete Workflow', () => {
    let organizerToken: string;
    let organizationId: string;
    const campaignData: any = {};

    test('Step 1: Register as campaign organizer', async () => {
      const organizerData = {
        email: 'organizer@campaign2024.com',
        password: 'CampaignSecure123!',
        firstName: 'Sarah',
        lastName: 'Johnson',
        organizationName: 'Johnson for Mayor 2024',
        organizationType: 'political_campaign',
        website: 'https://johnsonformayor.com',
      };

      const response = await apiTests.post('/api/v1/auth/register', organizerData);

      expect(response.status).toBe(201);
      organizerToken = response.data.accessToken;
      organizationId = response.data.user.organizationId;

      // Verify welcome email sent
      const emails = await emailTests.getEmails({ to: organizerData.email });
      expect(emails).toHaveLength(1);
      expect(emails[0].subject).toContain('Welcome to War Room');
    });

    test('Step 2: Complete organization profile', async () => {
      const profileData = {
        description: 'Sarah Johnson for Mayor - Building a Better Tomorrow',
        logo: 'https://example.com/logo.png',
        primaryColor: '#2563eb',
        socialMedia: {
          twitter: '@johnson2024',
          facebook: 'johnsonformayor',
          instagram: 'sarah_for_mayor',
        },
        contactInfo: {
          phone: '+1-555-0123',
          email: 'info@johnsonformayor.com',
          address: {
            street: '123 Campaign HQ',
            city: 'Springfield',
            state: 'IL',
            zipCode: '62701',
          },
        },
      };

      const response = await apiTests.put(
        `/api/v1/organizations/${organizationId}`,
        profileData,
        { headers: { Authorization: `Bearer ${organizerToken}` } },
      );

      expect(response.status).toBe(200);
      campaignData.organization = response.data;
    });

    test('Step 3: Create campaign events', async () => {
      const events = [
        {
          title: 'Campaign Kickoff Rally',
          description: 'Join us for the official campaign launch!',
          startDate: '2024-06-15T18:00:00Z',
          endDate: '2024-06-15T20:00:00Z',
          location: {
            name: 'City Park Amphitheater',
            address: '456 Park Ave',
            city: 'Springfield',
            state: 'IL',
            zipCode: '62701',
          },
          capacity: 500,
          requiresRegistration: true,
          isPublic: true,
        },
        {
          title: 'Volunteer Training Session',
          description: 'Learn how to canvass and phone bank effectively',
          startDate: '2024-06-20T19:00:00Z',
          endDate: '2024-06-20T21:00:00Z',
          location: {
            name: 'Campaign Headquarters',
            address: '123 Campaign HQ',
            city: 'Springfield',
            state: 'IL',
            zipCode: '62701',
          },
          capacity: 50,
          requiresRegistration: true,
          isPublic: false,
        },
      ];

      campaignData.events = [];
      for (const event of events) {
        const response = await apiTests.post('/api/v1/events', event, {
          headers: { Authorization: `Bearer ${organizerToken}` },
        });

        expect(response.status).toBe(201);
        campaignData.events.push(response.data);
      }

      expect(campaignData.events).toHaveLength(2);
    });

    test('Step 4: Set up volunteer roles and tasks', async () => {
      const volunteerRoles = [
        {
          name: 'Canvasser',
          description: 'Door-to-door outreach',
          requirements: ['Walking ability', 'Smartphone'],
          trainingRequired: true,
        },
        {
          name: 'Phone Bank Volunteer',
          description: 'Call voters from campaign HQ',
          requirements: ['Clear speaking voice', 'Basic computer skills'],
          trainingRequired: true,
        },
        {
          name: 'Event Staff',
          description: 'Help with campaign events',
          requirements: ['Availability on weekends'],
          trainingRequired: false,
        },
      ];

      campaignData.volunteerRoles = [];
      for (const role of volunteerRoles) {
        const response = await apiTests.post('/api/v1/volunteer-roles', role, {
          headers: { Authorization: `Bearer ${organizerToken}` },
        });

        expect(response.status).toBe(201);
        campaignData.volunteerRoles.push(response.data);
      }
    });

    test('Step 5: Create donation campaigns', async () => {
      const donationCampaign = {
        name: 'Road to City Hall',
        goal: 50000,
        startDate: '2024-06-01',
        endDate: '2024-11-01',
        description: 'Help us reach our goal of $50,000 to fund our grassroots campaign',
        tiers: [
          { amount: 25, name: 'Supporter', perks: 'Campaign button and sticker' },
          { amount: 100, name: 'Advocate', perks: 'Campaign t-shirt and yard sign' },
          { amount: 500, name: 'Champion', perks: 'VIP event invitation' },
          { amount: 1000, name: 'Leader', perks: 'Private dinner with candidate' },
        ],
      };

      const response = await apiTests.post('/api/v1/donation-campaigns', donationCampaign, {
        headers: { Authorization: `Bearer ${organizerToken}` },
      });

      expect(response.status).toBe(201);
      campaignData.donationCampaign = response.data;
    });

    test('Step 6: Invite team members', async () => {
      const teamMembers = [
        {
          email: 'campaign.manager@example.com',
          role: 'admin',
          firstName: 'John',
          lastName: 'Smith',
          title: 'Campaign Manager',
        },
        {
          email: 'volunteer.coord@example.com',
          role: 'coordinator',
          firstName: 'Emma',
          lastName: 'Davis',
          title: 'Volunteer Coordinator',
        },
      ];

      for (const member of teamMembers) {
        const response = await apiTests.post(
          `/api/v1/organizations/${organizationId}/invite`,
          member,
          { headers: { Authorization: `Bearer ${organizerToken}` } },
        );

        expect(response.status).toBe(201);

        // Verify invitation email sent
        const emails = await emailTests.getEmails({ to: member.email });
        expect(emails.length).toBeGreaterThan(0);
        expect(emails[emails.length - 1].subject).toContain('invited you');
      }
    });

    test('Step 7: View campaign dashboard analytics', async () => {
      // Simulate some activity first
      await Promise.all([
        // Add some volunteers
        apiTests.post('/api/v1/volunteers', {
          skills: ['canvassing', 'phone_banking'],
        }, { headers: { Authorization: `Bearer ${organizerToken}` } }),

        // Add donations
        apiTests.post('/api/v1/donations', {
          amount: 250,
          donorName: 'Test Donor',
          donorEmail: 'donor@test.com',
          campaignId: campaignData.donationCampaign.id,
          paymentMethod: 'credit_card',
        }, { headers: { Authorization: `Bearer ${organizerToken}` } }),
      ]);

      const response = await apiTests.get('/api/v1/analytics/dashboard', {
        headers: { Authorization: `Bearer ${organizerToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        overview: {
          totalDonations: expect.any(Number),
          totalVolunteers: expect.any(Number),
          upcomingEvents: expect.any(Number),
          totalDonors: expect.any(Number),
        },
        trends: {
          donations: expect.any(Array),
          volunteers: expect.any(Array),
          engagement: expect.any(Array),
        },
        recentActivity: expect.any(Array),
      });
    });
  });

  describe('Volunteer Journey - From Sign-up to Active Participation', () => {
    let volunteerToken: string;
    let volunteerId: string;
    const volunteerEmail = 'eager.volunteer@gmail.com';

    test('Step 1: Discover campaign through public event page', async () => {
      // Simulate browsing public events (no auth required)
      const response = await apiTests.get('/api/v1/public/events?city=Springfield');

      expect(response.status).toBe(200);
      expect(response.data.items.length).toBeGreaterThan(0);

      const kickoffEvent = response.data.items.find(e =>
        e.title.includes('Campaign Kickoff'),
      );
      expect(kickoffEvent).toBeDefined();
    });

    test('Step 2: Register as volunteer', async () => {
      const volunteerData = {
        email: volunteerEmail,
        password: 'Volunteer123!',
        firstName: 'Alex',
        lastName: 'Thompson',
        phone: '+1-555-9876',
        source: 'event_page',
        interests: ['canvassing', 'phone_banking', 'event_support'],
      };

      const response = await apiTests.post('/api/v1/auth/register-volunteer', volunteerData);

      expect(response.status).toBe(201);
      volunteerToken = response.data.accessToken;
      volunteerId = response.data.user.id;

      // Check welcome email
      const emails = await emailTests.getEmails({ to: volunteerEmail });
      expect(emails.length).toBeGreaterThan(0);
      expect(emails[emails.length - 1].subject).toContain('Welcome');
    });

    test('Step 3: Complete volunteer profile', async () => {
      const profileData = {
        skills: ['public_speaking', 'social_media', 'data_entry'],
        availability: {
          weekdays: ['evening'],
          weekends: ['morning', 'afternoon'],
        },
        languages: ['English', 'Spanish'],
        hasVehicle: true,
        emergencyContact: {
          name: 'Pat Thompson',
          phone: '+1-555-1111',
          relationship: 'Sibling',
        },
        experience: 'Volunteered for local council campaign in 2022',
        whyVolunteer: 'I believe in Sarah\'s vision for our city',
      };

      const response = await apiTests.put(
        `/api/v1/volunteers/${volunteerId}`,
        profileData,
        { headers: { Authorization: `Bearer ${volunteerToken}` } },
      );

      expect(response.status).toBe(200);
    });

    test('Step 4: Sign up for training event', async () => {
      // Get training events
      const eventsResponse = await apiTests.get('/api/v1/events?type=training', {
        headers: { Authorization: `Bearer ${volunteerToken}` },
      });

      const trainingEvent = eventsResponse.data.items[0];
      expect(trainingEvent).toBeDefined();

      // Register for training
      const response = await apiTests.post(
        `/api/v1/events/${trainingEvent.id}/register`,
        { attendeeCount: 1, notes: 'Excited to learn!' },
        { headers: { Authorization: `Bearer ${volunteerToken}` } },
      );

      expect(response.status).toBe(201);

      // Check confirmation email
      const emails = await emailTests.getEmails({ to: volunteerEmail });
      const confirmationEmail = emails.find(e =>
        e.subject.includes('Registration Confirmed'),
      );
      expect(confirmationEmail).toBeDefined();
    });

    test('Step 5: Complete training and get assigned tasks', async () => {
      // Mark training as completed (admin action)
      await apiTests.post(
        `/api/v1/volunteers/${volunteerId}/training/complete`,
        { trainingType: 'general_orientation', score: 95 },
        { headers: { Authorization: `Bearer ${volunteerToken}` } },
      );

      // Get available shifts
      const shiftsResponse = await apiTests.get(
        '/api/v1/volunteer-shifts?available=true',
        { headers: { Authorization: `Bearer ${volunteerToken}` } },
      );

      expect(shiftsResponse.data.items.length).toBeGreaterThan(0);

      // Sign up for shifts
      const shift = shiftsResponse.data.items[0];
      const signupResponse = await apiTests.post(
        `/api/v1/volunteer-shifts/${shift.id}/signup`,
        { notes: 'I can bring my own phone for calls' },
        { headers: { Authorization: `Bearer ${volunteerToken}` } },
      );

      expect(signupResponse.status).toBe(201);
    });

    test('Step 6: Log volunteer hours', async () => {
      const hoursData = {
        date: '2024-06-21',
        startTime: '18:00',
        endTime: '21:00',
        activity: 'Phone Banking',
        accomplishments: {
          callsMade: 45,
          votersContacted: 28,
          commitments: 5,
        },
        notes: 'Great response from voters in district 3',
      };

      const response = await apiTests.post(
        `/api/v1/volunteers/${volunteerId}/hours`,
        hoursData,
        { headers: { Authorization: `Bearer ${volunteerToken}` } },
      );

      expect(response.status).toBe(201);
      expect(response.data.hours).toBe(3);
      expect(response.data.status).toBe('pending_approval');
    });

    test('Step 7: Receive recognition and view impact', async () => {
      // View volunteer dashboard
      const dashboardResponse = await apiTests.get('/api/v1/volunteers/dashboard', {
        headers: { Authorization: `Bearer ${volunteerToken}` },
      });

      expect(dashboardResponse.status).toBe(200);
      expect(dashboardResponse.data).toMatchObject({
        stats: {
          totalHours: expect.any(Number),
          eventsAttended: expect.any(Number),
          impactScore: expect.any(Number),
        },
        achievements: expect.any(Array),
        upcomingShifts: expect.any(Array),
        leaderboard: expect.any(Array),
      });

      // Check for recognition email
      const emails = await emailTests.getEmails({ to: volunteerEmail });
      const recognitionEmail = emails.find(e =>
        e.subject.includes('Thank you') || e.subject.includes('Great job'),
      );
      expect(recognitionEmail).toBeDefined();
    });
  });

  describe('Donor Experience - From First Donation to Major Donor', () => {
    const donorEmail = 'generous.donor@example.com';
    let donorToken: string;
    let donorId: string;

    test('Step 1: Make first donation as guest', async () => {
      const donationData = {
        amount: 50,
        donorName: 'Patricia Williams',
        donorEmail,
        donorPhone: '+1-555-2468',
        campaignId: campaignData.donationCampaign.id,
        paymentMethod: 'credit_card',
        paymentDetails: {
          last4: '4242',
          brand: 'Visa',
        },
        isRecurring: false,
        dedicationName: 'In honor of my grandmother',
      };

      const response = await apiTests.post('/api/v1/public/donate', donationData);

      expect(response.status).toBe(201);
      expect(response.data).toMatchObject({
        receiptNumber: expect.any(String),
        amount: 50,
        status: 'completed',
      });

      // Check receipt email
      const emails = await emailTests.getEmails({ to: donorEmail });
      const receiptEmail = emails.find(e => e.subject.includes('Receipt'));
      expect(receiptEmail).toBeDefined();
      expect(receiptEmail.attachments).toHaveLength(1); // PDF receipt
    });

    test('Step 2: Create donor account from email link', async () => {
      // Simulate clicking account creation link from email
      const emails = await emailTests.getEmails({ to: donorEmail });
      const welcomeEmail = emails.find(e => e.body.includes('create an account'));

      // Extract token from email (simplified for test)
      const createAccountToken = 'test-token-12345';

      const response = await apiTests.post('/api/v1/auth/create-donor-account', {
        token: createAccountToken,
        password: 'DonorSecure123!',
        subscribeToUpdates: true,
      });

      expect(response.status).toBe(201);
      donorToken = response.data.accessToken;
      donorId = response.data.user.id;
    });

    test('Step 3: View donation history and impact', async () => {
      const response = await apiTests.get('/api/v1/donors/dashboard', {
        headers: { Authorization: `Bearer ${donorToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        totalDonated: 50,
        donationCount: 1,
        firstDonationDate: expect.any(String),
        impact: {
          votersReached: expect.any(Number),
          eventsSupported: expect.any(Number),
          volunteersEnabled: expect.any(Number),
        },
        donationHistory: expect.arrayContaining([
          expect.objectContaining({
            amount: 50,
            date: expect.any(String),
            receiptNumber: expect.any(String),
          }),
        ]),
      });
    });

    test('Step 4: Set up recurring donation', async () => {
      const recurringData = {
        amount: 25,
        frequency: 'monthly',
        startDate: '2024-07-01',
        paymentMethodId: 'pm_test_12345',
        campaignId: campaignData.donationCampaign.id,
      };

      const response = await apiTests.post(
        '/api/v1/donations/recurring',
        recurringData,
        { headers: { Authorization: `Bearer ${donorToken}` } },
      );

      expect(response.status).toBe(201);
      expect(response.data).toMatchObject({
        amount: 25,
        frequency: 'monthly',
        status: 'active',
        nextChargeDate: '2024-07-01',
      });
    });

    test('Step 5: Attend donor appreciation event', async () => {
      // Create VIP event (as admin)
      const vipEvent = await apiTests.post('/api/v1/events', {
        title: 'Donor Appreciation Dinner',
        type: 'donor_event',
        startDate: '2024-07-15T18:00:00Z',
        endDate: '2024-07-15T21:00:00Z',
        location: { name: 'Grand Hotel Ballroom' },
        capacity: 50,
        minimumDonation: 100,
        isPublic: false,
      }, {
        headers: { Authorization: `Bearer ${organizerToken}` },
      });

      // Donor receives invitation (check email)
      const emails = await emailTests.getEmails({ to: donorEmail });
      const inviteEmail = emails.find(e =>
        e.subject.includes('You\'re Invited'),
      );
      expect(inviteEmail).toBeDefined();

      // RSVP to event
      const rsvpResponse = await apiTests.post(
        `/api/v1/events/${vipEvent.data.id}/rsvp`,
        {
          attending: true,
          guestCount: 2,
          dietaryRestrictions: 'Vegetarian',
        },
        { headers: { Authorization: `Bearer ${donorToken}` } },
      );

      expect(rsvpResponse.status).toBe(201);
    });

    test('Step 6: Upgrade to major donor status', async () => {
      // Make a major donation
      const majorDonation = {
        amount: 1000,
        campaignId: campaignData.donationCampaign.id,
        paymentMethod: 'check',
        checkNumber: '5678',
        notes: 'Happy to support Sarah\'s campaign',
      };

      const response = await apiTests.post(
        '/api/v1/donations',
        majorDonation,
        { headers: { Authorization: `Bearer ${donorToken}` } },
      );

      expect(response.status).toBe(201);

      // Check donor status update
      const statusResponse = await apiTests.get('/api/v1/donors/status', {
        headers: { Authorization: `Bearer ${donorToken}` },
      });

      expect(statusResponse.data).toMatchObject({
        level: 'major_donor',
        totalLifetimeDonations: 1075, // 50 + 25 + 1000
        perks: expect.arrayContaining([
          'vip_event_access',
          'quarterly_updates',
          'campaign_advisory_input',
        ]),
      });

      // Check for personal thank you
      const thankYouEmails = await emailTests.getEmails({
        to: donorEmail,
        subject: 'Personal Thank You',
      });
      expect(thankYouEmails.length).toBeGreaterThan(0);
    });
  });

  describe('Event Management Full Lifecycle', () => {
    let eventId: string;
    let eventCoordinatorToken: string;

    beforeAll(async () => {
      // Create event coordinator account
      const coordinator = await apiTests.post('/api/v1/auth/register', {
        email: 'event.coordinator@campaign.com',
        password: 'EventPro123!',
        firstName: 'Maria',
        lastName: 'Garcia',
        role: 'coordinator',
      });

      eventCoordinatorToken = coordinator.data.accessToken;
    });

    test('Step 1: Plan and create event', async () => {
      const eventData = {
        title: 'Town Hall Meeting',
        type: 'town_hall',
        description: 'Join Sarah Johnson for an open discussion about our city\'s future',
        startDate: '2024-08-01T18:30:00Z',
        endDate: '2024-08-01T20:30:00Z',
        location: {
          name: 'Community Center',
          address: '789 Center St',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62701',
          coordinates: {
            lat: 39.7817,
            lng: -89.6501,
          },
        },
        capacity: 200,
        requiresRegistration: true,
        isPublic: true,
        streamingEnabled: true,
        streamingUrl: 'https://youtube.com/live/abc123',
        categories: ['community', 'policy', 'q&a'],
      };

      const response = await apiTests.post('/api/v1/events', eventData, {
        headers: { Authorization: `Bearer ${eventCoordinatorToken}` },
      });

      expect(response.status).toBe(201);
      eventId = response.data.id;
    });

    test('Step 2: Set up event team and assignments', async () => {
      const assignments = [
        {
          role: 'setup_crew',
          volunteersNeeded: 5,
          timeSlot: '2024-08-01T16:00:00Z',
          duration: 2,
          responsibilities: ['Set up chairs', 'Test AV equipment', 'Prepare registration table'],
        },
        {
          role: 'registration_desk',
          volunteersNeeded: 3,
          timeSlot: '2024-08-01T17:30:00Z',
          duration: 3,
          responsibilities: ['Check in attendees', 'Distribute materials', 'Answer questions'],
        },
        {
          role: 'livestream_moderator',
          volunteersNeeded: 1,
          timeSlot: '2024-08-01T18:00:00Z',
          duration: 3,
          responsibilities: ['Monitor chat', 'Relay online questions', 'Technical support'],
        },
      ];

      for (const assignment of assignments) {
        const response = await apiTests.post(
          `/api/v1/events/${eventId}/assignments`,
          assignment,
          { headers: { Authorization: `Bearer ${eventCoordinatorToken}` } },
        );

        expect(response.status).toBe(201);
      }
    });

    test('Step 3: Promote event and track registrations', async () => {
      // Create promotional materials
      const promoResponse = await apiTests.post(
        `/api/v1/events/${eventId}/promote`,
        {
          channels: ['email', 'social_media', 'website'],
          customMessage: 'Don\'t miss this opportunity to share your voice!',
          targetAudience: ['supporters', 'undecided_voters', 'press'],
        },
        { headers: { Authorization: `Bearer ${eventCoordinatorToken}` } },
      );

      expect(promoResponse.status).toBe(201);
      expect(promoResponse.data).toMatchObject({
        emailsSent: expect.any(Number),
        socialMediaPosts: expect.any(Array),
        trackingLinks: expect.any(Object),
      });

      // Simulate registrations
      const registrations = 75;
      for (let i = 0; i < registrations; i++) {
        await apiTests.post(`/api/v1/public/events/${eventId}/register`, {
          name: `Attendee ${i}`,
          email: `attendee${i}@test.com`,
          phone: `+1555000${i.toString().padStart(4, '0')}`,
        });
      }

      // Check registration analytics
      const analyticsResponse = await apiTests.get(
        `/api/v1/events/${eventId}/analytics`,
        { headers: { Authorization: `Bearer ${eventCoordinatorToken}` } },
      );

      expect(analyticsResponse.data).toMatchObject({
        totalRegistrations: 75,
        capacity: 200,
        percentFull: 37.5,
        registrationTrend: expect.any(Array),
        demographicBreakdown: expect.any(Object),
        sourceBreakdown: expect.any(Object),
      });
    });

    test('Step 4: Day-of event management', async () => {
      // Start check-in process
      const checkinResponse = await apiTests.post(
        `/api/v1/events/${eventId}/checkin/start`,
        {},
        { headers: { Authorization: `Bearer ${eventCoordinatorToken}` } },
      );

      expect(checkinResponse.status).toBe(200);
      expect(checkinResponse.data.checkInCode).toBeDefined();

      // Simulate attendee check-ins
      const attendees = await apiTests.get(
        `/api/v1/events/${eventId}/attendees`,
        { headers: { Authorization: `Bearer ${eventCoordinatorToken}` } },
      );

      for (let i = 0; i < 60; i++) {
        const attendee = attendees.data.items[i];
        await apiTests.post(
          `/api/v1/events/${eventId}/checkin`,
          { attendeeId: attendee.id, checkInTime: new Date().toISOString() },
          { headers: { Authorization: `Bearer ${eventCoordinatorToken}` } },
        );
      }

      // Real-time event updates
      const updateResponse = await apiTests.post(
        `/api/v1/events/${eventId}/updates`,
        {
          type: 'announcement',
          message: 'Q&A session starting in 5 minutes',
          priority: 'high',
        },
        { headers: { Authorization: `Bearer ${eventCoordinatorToken}` } },
      );

      expect(updateResponse.status).toBe(201);
    });

    test('Step 5: Post-event follow-up and analysis', async () => {
      // Mark event as completed
      await apiTests.put(
        `/api/v1/events/${eventId}`,
        { status: 'completed' },
        { headers: { Authorization: `Bearer ${eventCoordinatorToken}` } },
      );

      // Send follow-up survey
      const surveyResponse = await apiTests.post(
        `/api/v1/events/${eventId}/survey`,
        {
          questions: [
            { type: 'rating', question: 'How would you rate the event?', scale: 5 },
            { type: 'text', question: 'What topics would you like to see covered in future events?' },
            { type: 'boolean', question: 'Would you recommend this event to others?' },
          ],
          sendTo: 'attendees',
          deadline: '2024-08-08',
        },
        { headers: { Authorization: `Bearer ${eventCoordinatorToken}` } },
      );

      expect(surveyResponse.status).toBe(201);

      // Generate event report
      const reportResponse = await apiTests.get(
        `/api/v1/events/${eventId}/report`,
        { headers: { Authorization: `Bearer ${eventCoordinatorToken}` } },
      );

      expect(reportResponse.data).toMatchObject({
        summary: {
          plannedAttendance: 75,
          actualAttendance: 60,
          attendanceRate: 80,
          onlineViewers: expect.any(Number),
        },
        feedback: {
          averageRating: expect.any(Number),
          recommendationRate: expect.any(Number),
          topComments: expect.any(Array),
        },
        volunteerHours: expect.any(Number),
        totalCost: expect.any(Number),
        mediaCoverage: expect.any(Array),
        followUpActions: expect.any(Array),
      });

      // Check that thank you emails were sent
      const thankYouEmails = await emailTests.getEmails({
        subject: 'Thank you for attending',
      });
      expect(thankYouEmails.length).toBeGreaterThan(50);
    });
  });

  describe('Platform Admin Operations', () => {
    let platformAdminToken: string;

    beforeAll(async () => {
      // Create platform admin (normally would be pre-seeded)
      const admin = await apiTests.post('/api/v1/auth/platform-admin-init', {
        email: 'platform@warroom.com',
        password: 'PlatformAdmin123!',
        secretKey: process.env.PLATFORM_ADMIN_SECRET,
      });

      platformAdminToken = admin.data.accessToken;
    });

    test('Monitor platform health and metrics', async () => {
      const response = await apiTests.get('/api/v1/platform-admin/health', {
        headers: { Authorization: `Bearer ${platformAdminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        status: 'healthy',
        uptime: expect.any(Number),
        services: {
          database: 'connected',
          redis: 'connected',
          email: 'operational',
          websocket: 'active',
        },
        metrics: {
          activeUsers: expect.any(Number),
          requestsPerMinute: expect.any(Number),
          averageResponseTime: expect.any(Number),
          errorRate: expect.any(Number),
        },
      });
    });

    test('Manage organizations and feature flags', async () => {
      // Get all organizations
      const orgsResponse = await apiTests.get('/api/v1/platform-admin/organizations', {
        headers: { Authorization: `Bearer ${platformAdminToken}` },
      });

      expect(orgsResponse.data.items.length).toBeGreaterThan(0);

      // Update feature flags for an organization
      const orgId = orgsResponse.data.items[0].id;
      const flagsResponse = await apiTests.put(
        `/api/v1/platform-admin/organizations/${orgId}/features`,
        {
          documentIntelligence: true,
          advancedAnalytics: true,
          customBranding: true,
          apiAccess: false,
        },
        { headers: { Authorization: `Bearer ${platformAdminToken}` } },
      );

      expect(flagsResponse.status).toBe(200);
    });

    test('Handle support tickets and user issues', async () => {
      // View support tickets
      const ticketsResponse = await apiTests.get('/api/v1/platform-admin/support-tickets', {
        headers: { Authorization: `Bearer ${platformAdminToken}` },
      });

      if (ticketsResponse.data.items.length > 0) {
        const ticket = ticketsResponse.data.items[0];

        // Respond to ticket
        const responseResult = await apiTests.post(
          `/api/v1/platform-admin/support-tickets/${ticket.id}/respond`,
          {
            message: 'Thank you for reaching out. We\'ve identified the issue and are working on a fix.',
            status: 'in_progress',
            internalNotes: 'User experiencing login issues due to expired session tokens',
          },
          { headers: { Authorization: `Bearer ${platformAdminToken}` } },
        );

        expect(responseResult.status).toBe(201);
      }
    });

    test('Generate platform usage reports', async () => {
      const response = await apiTests.post(
        '/api/v1/platform-admin/reports/generate',
        {
          type: 'monthly_summary',
          month: '2024-06',
          includeMetrics: [
            'user_growth',
            'organization_activity',
            'feature_usage',
            'revenue_metrics',
            'support_metrics',
          ],
        },
        { headers: { Authorization: `Bearer ${platformAdminToken}` } },
      );

      expect(response.status).toBe(201);
      expect(response.data).toMatchObject({
        reportId: expect.any(String),
        status: 'generating',
        estimatedCompletionTime: expect.any(String),
      });

      // Wait for report generation
      await testSuite.wait(3000);

      // Download report
      const downloadResponse = await apiTests.get(
        `/api/v1/platform-admin/reports/${response.data.reportId}/download`,
        { headers: { Authorization: `Bearer ${platformAdminToken}` } },
      );

      expect(downloadResponse.status).toBe(200);
      expect(downloadResponse.headers['content-type']).toContain('application/pdf');
    });
  });
});
