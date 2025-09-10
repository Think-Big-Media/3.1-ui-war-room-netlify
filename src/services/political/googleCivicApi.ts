/**
 * Google Civic Information API Service
 * Free API for election and representative data
 * Documentation: https://developers.google.com/civic-information
 */

const API_BASE = 'https://www.googleapis.com/civicinfo/v2';

// Note: Get free API key at https://console.cloud.google.com/
const API_KEY = import.meta.env.VITE_GOOGLE_CIVIC_API_KEY || 'AIzaSyB_m_vkKpNG3jAX8rrORBXC0KFlyS4PGWo';

interface Address {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  zip?: string;
}

interface Official {
  name: string;
  party?: string;
  phones?: string[];
  emails?: string[];
  urls?: string[];
  photoUrl?: string;
  channels?: Array<{
    type: string;
    id: string;
  }>;
  address?: Address[];
}

interface Office {
  name: string;
  divisionId: string;
  levels?: string[];
  roles?: string[];
  officialIndices: number[];
}

interface Election {
  id: string;
  name: string;
  electionDay: string;
  ocdDivisionId: string;
}

interface PollingLocation {
  address: Address;
  notes?: string;
  pollingHours?: string;
  name?: string;
  voterServices?: string;
  startDate?: string;
  endDate?: string;
}

interface Contest {
  type: string;
  office?: string;
  level?: string[];
  roles?: string[];
  district?: {
    name: string;
    scope: string;
    id: string;
  };
  candidates?: Array<{
    name: string;
    party?: string;
    candidateUrl?: string;
    phone?: string;
    photoUrl?: string;
    email?: string;
    channels?: Array<{
      type: string;
      id: string;
    }>;
  }>;
  referendumTitle?: string;
  referendumSubtitle?: string;
  referendumUrl?: string;
  referendumBrief?: string;
  referendumText?: string;
}

/**
 * Get representatives for an address
 */
export const getRepresentatives = async (address: string): Promise<{
  offices: Office[];
  officials: Official[];
}> => {
  const dataMode = localStorage.getItem('dataMode');
  
  if (dataMode === 'MOCK' || !API_KEY) {
    return {
      offices: [
        {
          name: 'President of the United States',
          divisionId: 'ocd-division/country:us',
          levels: ['country'],
          roles: ['headOfState', 'headOfGovernment'],
          officialIndices: [0]
        },
        {
          name: 'U.S. Senator',
          divisionId: 'ocd-division/country:us/state:ca',
          levels: ['country'],
          roles: ['legislatorUpperBody'],
          officialIndices: [1, 2]
        }
      ],
      officials: [
        {
          name: 'Joe Biden',
          party: 'Democratic Party',
          phones: ['(202) 456-1111'],
          urls: ['https://www.whitehouse.gov/'],
          photoUrl: 'https://www.whitehouse.gov/wp-content/uploads/2021/04/P20210303AS-1901-cropped.jpg',
          channels: [
            { type: 'Twitter', id: 'POTUS' },
            { type: 'Facebook', id: 'WhiteHouse' }
          ]
        },
        {
          name: 'Senator One',
          party: 'Democratic Party',
          phones: ['(202) 224-3553'],
          emails: ['senator.one@senate.gov']
        },
        {
          name: 'Senator Two',
          party: 'Democratic Party',
          phones: ['(202) 224-3841'],
          emails: ['senator.two@senate.gov']
        }
      ]
    };
  }

  try {
    const params = new URLSearchParams({
      key: API_KEY,
      address: address,
      includeOffices: 'true'
    });

    const response = await fetch(`${API_BASE}/representatives?${params}`);
    
    if (!response.ok) {
      throw new Error(`Google Civic API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      offices: data.offices || [],
      officials: data.officials || []
    };
  } catch (error) {
    console.error('Error fetching representatives:', error);
    return { offices: [], officials: [] };
  }
};

/**
 * Get voter information including polling locations and ballot
 */
export const getVoterInfo = async (address: string): Promise<{
  election?: Election;
  pollingLocations?: PollingLocation[];
  earlyVoteSites?: PollingLocation[];
  dropOffLocations?: PollingLocation[];
  contests?: Contest[];
}> => {
  const dataMode = localStorage.getItem('dataMode');
  
  if (dataMode === 'MOCK' || !API_KEY) {
    return {
      election: {
        id: '2000',
        name: '2024 General Election',
        electionDay: '2024-11-05',
        ocdDivisionId: 'ocd-division/country:us'
      },
      pollingLocations: [
        {
          address: {
            line1: '123 Main Street',
            city: 'Springfield',
            state: 'CA',
            zip: '90210'
          },
          pollingHours: '7:00 AM - 8:00 PM',
          name: 'Springfield Community Center'
        }
      ],
      contests: [
        {
          type: 'General',
          office: 'President',
          level: ['country'],
          candidates: [
            {
              name: 'Candidate A',
              party: 'Democratic Party',
              candidateUrl: 'https://example.com',
              channels: [{ type: 'Twitter', id: 'candidateA' }]
            },
            {
              name: 'Candidate B',
              party: 'Republican Party',
              candidateUrl: 'https://example.com',
              channels: [{ type: 'Twitter', id: 'candidateB' }]
            }
          ]
        },
        {
          type: 'Referendum',
          referendumTitle: 'Proposition 1',
          referendumSubtitle: 'School Bond Measure',
          referendumBrief: 'Authorize $500M in bonds for school improvements'
        }
      ]
    };
  }

  try {
    const params = new URLSearchParams({
      key: API_KEY,
      address: address,
      includeOffices: 'true',
      returnAllAvailableData: 'true'
    });

    const response = await fetch(`${API_BASE}/voterinfo?${params}`);
    
    if (!response.ok) {
      if (response.status === 400) {
        // No election data available for this address
        return {};
      }
      throw new Error(`Google Civic API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      election: data.election,
      pollingLocations: data.pollingLocations,
      earlyVoteSites: data.earlyVoteSites,
      dropOffLocations: data.dropOffLocations,
      contests: data.contests
    };
  } catch (error) {
    console.error('Error fetching voter info:', error);
    return {};
  }
};

/**
 * Get available elections
 */
export const getElections = async (): Promise<Election[]> => {
  const dataMode = localStorage.getItem('dataMode');
  
  if (dataMode === 'MOCK' || !API_KEY) {
    return [
      {
        id: '2000',
        name: '2024 General Election',
        electionDay: '2024-11-05',
        ocdDivisionId: 'ocd-division/country:us'
      },
      {
        id: '2001',
        name: '2024 Primary Election',
        electionDay: '2024-03-05',
        ocdDivisionId: 'ocd-division/country:us'
      }
    ];
  }

  try {
    const params = new URLSearchParams({
      key: API_KEY
    });

    const response = await fetch(`${API_BASE}/elections?${params}`);
    
    if (!response.ok) {
      throw new Error(`Google Civic API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.elections || [];
  } catch (error) {
    console.error('Error fetching elections:', error);
    return [];
  }
};

/**
 * Get divisions (political geography)
 */
export const getDivisions = async (query: string): Promise<any> => {
  const dataMode = localStorage.getItem('dataMode');
  
  if (dataMode === 'MOCK' || !API_KEY) {
    return {
      results: [
        {
          name: 'California',
          ocdId: 'ocd-division/country:us/state:ca',
          aliases: ['CA', 'Calif.']
        },
        {
          name: 'Los Angeles County',
          ocdId: 'ocd-division/country:us/state:ca/county:los_angeles',
          aliases: ['LA County']
        }
      ]
    };
  }

  try {
    const params = new URLSearchParams({
      key: API_KEY,
      query: query
    });

    const response = await fetch(`${API_BASE}/divisions?${params}`);
    
    if (!response.ok) {
      throw new Error(`Google Civic API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching divisions:', error);
    return { results: [] };
  }
};

/**
 * Get representative info by division
 */
export const getRepresentativesByDivision = async (
  ocdId: string
): Promise<{
  offices: Office[];
  officials: Official[];
}> => {
  const dataMode = localStorage.getItem('dataMode');
  
  if (dataMode === 'MOCK' || !API_KEY) {
    return getRepresentatives('Mock Address');
  }

  try {
    const params = new URLSearchParams({
      key: API_KEY,
      levels: 'country,state',
      roles: 'headOfState,headOfGovernment,legislatorUpperBody,legislatorLowerBody'
    });

    const response = await fetch(
      `${API_BASE}/representatives/${encodeURIComponent(ocdId)}?${params}`
    );
    
    if (!response.ok) {
      throw new Error(`Google Civic API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      offices: data.offices || [],
      officials: data.officials || []
    };
  } catch (error) {
    console.error('Error fetching representatives by division:', error);
    return { offices: [], officials: [] };
  }
};

/**
 * Helper function to format address for API
 */
export const formatAddress = (address: Address): string => {
  const parts = [];
  if (address.line1) parts.push(address.line1);
  if (address.line2) parts.push(address.line2);
  if (address.city) parts.push(address.city);
  if (address.state) parts.push(address.state);
  if (address.zip) parts.push(address.zip);
  return parts.join(', ');
};