/**
 * Mock Data for War Room Platform
 * Use this for frontend development without backend dependency
 * 
 * Senior Pattern: Always develop with realistic data structures
 * This ensures smooth transition when connecting to real APIs
 */

import { User, Volunteer, Event, Donation } from '../DataService';

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@warroom.com',
    role: 'platform_admin',
    organizationId: 'org-1'
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'michael.chen@campaign.org',
    role: 'admin',
    organizationId: 'org-2'
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    email: 'emily.r@volunteer.com',
    role: 'user',
    organizationId: 'org-2'
  },
  {
    id: '4',
    name: 'James Wilson',
    email: 'james.w@supporter.org',
    role: 'user',
    organizationId: 'org-3'
  }
];

// Mock Volunteers
export const mockVolunteers: Volunteer[] = [
  {
    id: 'vol-1',
    name: 'Alex Thompson',
    email: 'alex.t@email.com',
    phone: '555-0101',
    skills: ['Canvassing', 'Phone Banking', 'Event Planning'],
    availability: ['Weekends', 'Evenings']
  },
  {
    id: 'vol-2',
    name: 'Maria Garcia',
    email: 'maria.g@email.com',
    phone: '555-0102',
    skills: ['Social Media', 'Graphic Design', 'Writing'],
    availability: ['Weekdays', 'Remote']
  },
  {
    id: 'vol-3',
    name: 'David Kim',
    email: 'david.k@email.com',
    phone: '555-0103',
    skills: ['Data Entry', 'Phone Banking', 'Transportation'],
    availability: ['Weekends']
  },
  {
    id: 'vol-4',
    name: 'Lisa Brown',
    email: 'lisa.b@email.com',
    phone: '555-0104',
    skills: ['Event Planning', 'Fundraising', 'Public Speaking'],
    availability: ['Flexible']
  },
  {
    id: 'vol-5',
    name: 'Robert Taylor',
    email: 'robert.t@email.com',
    phone: '555-0105',
    skills: ['Technology', 'Data Analysis', 'Training'],
    availability: ['Evenings', 'Remote']
  }
];

// Mock Events
export const mockEvents: Event[] = [
  {
    id: 'evt-1',
    title: 'Community Town Hall',
    description: 'Monthly town hall meeting to discuss campaign progress and upcoming initiatives',
    date: '2024-02-15T18:00:00Z',
    location: 'Community Center, 123 Main St',
    volunteerCount: 25
  },
  {
    id: 'evt-2',
    title: 'Fundraising Gala',
    description: 'Annual fundraising gala with dinner, entertainment, and silent auction',
    date: '2024-02-20T19:00:00Z',
    location: 'Grand Hotel Ballroom',
    volunteerCount: 15
  },
  {
    id: 'evt-3',
    title: 'Door-to-Door Canvassing',
    description: 'Weekend canvassing event in the downtown district',
    date: '2024-02-24T09:00:00Z',
    location: 'Campaign HQ - Meeting Point',
    volunteerCount: 40
  },
  {
    id: 'evt-4',
    title: 'Phone Banking Session',
    description: 'Evening phone banking to reach out to supporters',
    date: '2024-02-25T17:00:00Z',
    location: 'Remote / Campaign Office',
    volunteerCount: 20
  },
  {
    id: 'evt-5',
    title: 'Volunteer Training Workshop',
    description: 'Training session for new volunteers on campaign messaging and tools',
    date: '2024-02-28T14:00:00Z',
    location: 'Campaign HQ - Training Room',
    volunteerCount: 30
  }
];

// Mock Donations
export const mockDonations: Donation[] = [
  {
    id: 'don-1',
    donorName: 'Anonymous',
    amount: 5000,
    date: '2024-02-01T10:00:00Z',
    campaignId: 'camp-1'
  },
  {
    id: 'don-2',
    donorName: 'Tech Workers PAC',
    amount: 25000,
    date: '2024-02-03T14:30:00Z',
    campaignId: 'camp-1'
  },
  {
    id: 'don-3',
    donorName: 'Jennifer Smith',
    amount: 100,
    date: '2024-02-05T09:15:00Z',
    campaignId: 'camp-2'
  },
  {
    id: 'don-4',
    donorName: 'Local Business Alliance',
    amount: 10000,
    date: '2024-02-07T16:45:00Z',
    campaignId: 'camp-1'
  },
  {
    id: 'don-5',
    donorName: 'Community Foundation',
    amount: 50000,
    date: '2024-02-10T11:00:00Z',
    campaignId: 'camp-3'
  },
  {
    id: 'don-6',
    donorName: 'Mark Johnson',
    amount: 250,
    date: '2024-02-12T13:20:00Z',
    campaignId: 'camp-2'
  }
];

// Mock Campaign Metrics (for dashboard)
export const mockMetrics = {
  totalVolunteers: 1247,
  activeEvents: 12,
  totalDonations: 485000,
  recentDonors: 89,
  phoneCallsMade: 3456,
  doorsKnocked: 2890,
  emailsSent: 15670,
  socialReach: 45000
};

// Mock Organizations
export const mockOrganizations = [
  {
    id: 'org-1',
    name: 'War Room Platform',
    type: 'platform',
    memberCount: 1
  },
  {
    id: 'org-2',
    name: 'Progressive Campaign 2024',
    type: 'campaign',
    memberCount: 156
  },
  {
    id: 'org-3',
    name: 'Community Action Network',
    type: 'nonprofit',
    memberCount: 89
  }
];

// Mock Activity Feed
export const mockActivities = [
  {
    id: 'act-1',
    type: 'volunteer_joined',
    message: 'New volunteer Alex Thompson signed up',
    timestamp: '2024-02-14T10:30:00Z',
    icon: 'user-plus'
  },
  {
    id: 'act-2',
    type: 'donation_received',
    message: '$5,000 donation received from Anonymous',
    timestamp: '2024-02-14T09:15:00Z',
    icon: 'dollar-sign'
  },
  {
    id: 'act-3',
    type: 'event_created',
    message: 'New event: Community Town Hall scheduled',
    timestamp: '2024-02-14T08:00:00Z',
    icon: 'calendar'
  },
  {
    id: 'act-4',
    type: 'milestone_reached',
    message: 'Reached 1,000 volunteer signups!',
    timestamp: '2024-02-13T16:45:00Z',
    icon: 'trophy'
  },
  {
    id: 'act-5',
    type: 'message_sent',
    message: 'Broadcast message sent to 500 supporters',
    timestamp: '2024-02-13T14:20:00Z',
    icon: 'mail'
  }
];

// Mock Automation Workflows
export const mockWorkflows = [
  {
    id: 'wf-1',
    name: 'Welcome New Volunteers',
    trigger: 'volunteer_signup',
    actions: ['send_welcome_email', 'add_to_crm', 'schedule_followup'],
    isActive: true,
    executionCount: 234
  },
  {
    id: 'wf-2',
    name: 'Thank Donors',
    trigger: 'donation_received',
    actions: ['send_thank_you', 'update_donor_tier', 'create_tax_receipt'],
    isActive: true,
    executionCount: 189
  },
  {
    id: 'wf-3',
    name: 'Event Reminder',
    trigger: 'event_24h_before',
    actions: ['send_reminder_email', 'send_sms', 'update_attendance'],
    isActive: true,
    executionCount: 567
  }
];

// Mock Analytics Data
export const mockAnalytics = {
  volunteerGrowth: [
    { date: '2024-01-01', count: 450 },
    { date: '2024-01-15', count: 620 },
    { date: '2024-02-01', count: 890 },
    { date: '2024-02-14', count: 1247 }
  ],
  donationTrends: [
    { date: '2024-01-01', amount: 125000 },
    { date: '2024-01-15', amount: 230000 },
    { date: '2024-02-01', amount: 380000 },
    { date: '2024-02-14', amount: 485000 }
  ],
  eventAttendance: [
    { event: 'Town Hall #1', attended: 156, registered: 200 },
    { event: 'Fundraiser', attended: 89, registered: 100 },
    { event: 'Canvassing', attended: 234, registered: 250 },
    { event: 'Phone Bank', attended: 67, registered: 80 }
  ],
  engagementMetrics: {
    emailOpenRate: 0.34,
    clickThroughRate: 0.12,
    socialEngagement: 0.08,
    volunteerRetention: 0.76
  }
};

// Helper function to generate more mock data
export function generateMockData(type: string, count: number): any[] {
  const data = [];
  for (let i = 0; i < count; i++) {
    switch (type) {
      case 'volunteer':
        data.push({
          id: `vol-gen-${i}`,
          name: `Volunteer ${i}`,
          email: `volunteer${i}@email.com`,
          phone: `555-${String(i).padStart(4, '0')}`,
          skills: ['Skill A', 'Skill B'],
          availability: ['Flexible']
        });
        break;
      case 'event':
        data.push({
          id: `evt-gen-${i}`,
          title: `Event ${i}`,
          description: `Description for event ${i}`,
          date: new Date(Date.now() + i * 86400000).toISOString(),
          location: `Location ${i}`,
          volunteerCount: Math.floor(Math.random() * 50)
        });
        break;
      case 'donation':
        data.push({
          id: `don-gen-${i}`,
          donorName: `Donor ${i}`,
          amount: Math.floor(Math.random() * 10000),
          date: new Date(Date.now() - i * 86400000).toISOString(),
          campaignId: 'camp-1'
        });
        break;
    }
  }
  return data;
}

// Export all mock data
export default {
  mockUsers,
  mockVolunteers,
  mockEvents,
  mockDonations,
  mockMetrics,
  mockOrganizations,
  mockActivities,
  mockWorkflows,
  mockAnalytics,
  generateMockData
};