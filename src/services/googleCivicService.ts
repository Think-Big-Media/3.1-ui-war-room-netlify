/**
 * Google Civic Information API Service
 * Provides election data, candidate information, and voting locations
 */

import axios from 'axios';
import { getEnvironmentConfig } from '../config/apiConfig';

// Google Civic Information API Types
export interface Election {
  id: string;
  name: string;
  electionDay: string;
  ocdDivisionId: string;
}

export interface Contest {
  office: string;
  level: string[];
  roles: string[];
  district: {
    name: string;
    scope: string;
  };
  candidates: Candidate[];
}

export interface Candidate {
  name: string;
  party: string;
  candidateUrl?: string;
  phone?: string;
  email?: string;
  channels?: Array<{
    type: string;
    id: string;
  }>;
}

export interface VotingLocation {
  address: {
    line1: string;
    city: string;
    state: string;
    zip: string;
  };
  pollingHours: string;
  notes?: string;
}

export interface ElectionOfficial {
  name: string;
  title: string;
  officePhoneNumber?: string;
  emailAddress?: string;
}

export interface VoterInfo {
  election: Election;
  contests: Contest[];
  pollingLocations?: VotingLocation[];
  earlyVoteSites?: VotingLocation[];
  dropOffLocations?: VotingLocation[];
  electionElectionOfficials?: ElectionOfficial[];
  state?: Array<{
    name: string;
    electionAdministrationBody: {
      name: string;
      electionInfoUrl?: string;
      electionRegistrationUrl?: string;
      electionRegistrationConfirmationUrl?: string;
      absenteeVotingInfoUrl?: string;
      votingLocationFinderUrl?: string;
      ballotInfoUrl?: string;
    };
  }>;
}

class GoogleCivicService {
  private apiKey: string;
  private baseURL = 'https://civicinfo.googleapis.com/civicinfo/v2';
  private config: ReturnType<typeof getEnvironmentConfig>;

  constructor() {
    this.config = getEnvironmentConfig();
    // Try Google Civic API key first, fallback to Google Ads key
    this.apiKey = this.config.googleCivic.apiKey || this.config.googleAds.developerToken || '';
    
    if (!this.apiKey) {
      console.warn('Google Civic API key not found. Using mock data.');
    }
  }

  /**
   * Get list of available elections
   */
  async getElections(): Promise<Election[]> {
    if (!this.apiKey) {
      return this.getMockElections();
    }

    try {
      const response = await axios.get(`${this.baseURL}/elections`, {
        params: {
          key: this.apiKey
        }
      });

      return response.data.elections || [];
    } catch (error) {
      console.error('Error fetching elections:', error);
      return this.getMockElections();
    }
  }

  /**
   * Get voter information for a specific address and election
   */
  async getVoterInfo(
    address: string, 
    electionId: string = '2000'
  ): Promise<VoterInfo | null> {
    if (!this.apiKey) {
      return this.getMockVoterInfo(address);
    }

    try {
      const response = await axios.get(`${this.baseURL}/voterinfo`, {
        params: {
          key: this.apiKey,
          address: address,
          electionId: electionId,
          returnAllAvailableData: true
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching voter info:', error);
      return this.getMockVoterInfo(address);
    }
  }

  /**
   * Get representatives for a specific address
   */
  async getRepresentatives(address: string): Promise<any> {
    if (!this.apiKey) {
      return this.getMockRepresentatives(address);
    }

    try {
      const response = await axios.get(`${this.baseURL}/representatives`, {
        params: {
          key: this.apiKey,
          address: address,
          levels: ['country', 'administrativeArea1', 'administrativeArea2', 'locality']
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching representatives:', error);
      return this.getMockRepresentatives(address);
    }
  }

  /**
   * Get political divisions and boundaries
   */
  async getDivisions(query?: string): Promise<any> {
    if (!this.apiKey) {
      return this.getMockDivisions();
    }

    try {
      const params: any = {
        key: this.apiKey
      };

      if (query) {
        params.query = query;
      }

      const response = await axios.get(`${this.baseURL}/divisions`, {
        params
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching divisions:', error);
      return this.getMockDivisions();
    }
  }

  // Mock data for development/fallback
  private getMockElections(): Election[] {
    return [
      {
        id: '8000',
        name: '2024 U.S. General Election',
        electionDay: '2024-11-05',
        ocdDivisionId: 'ocd-division/country:us'
      },
      {
        id: '8001',
        name: '2024 Primary Elections',
        electionDay: '2024-06-04',
        ocdDivisionId: 'ocd-division/country:us'
      }
    ];
  }

  private getMockVoterInfo(address: string): VoterInfo {
    return {
      election: {
        id: '8000',
        name: '2024 U.S. General Election',
        electionDay: '2024-11-05',
        ocdDivisionId: 'ocd-division/country:us'
      },
      contests: [
        {
          office: 'President of the United States',
          level: ['country'],
          roles: ['headOfGovernment'],
          district: {
            name: 'United States',
            scope: 'national'
          },
          candidates: [
            {
              name: 'Candidate A',
              party: 'Democratic Party'
            },
            {
              name: 'Candidate B', 
              party: 'Republican Party'
            }
          ]
        },
        {
          office: 'U.S. House of Representatives',
          level: ['administrativeArea1'],
          roles: ['legislatorLowerBody'],
          district: {
            name: 'Congressional District 1',
            scope: 'congressional'
          },
          candidates: [
            {
              name: 'House Candidate A',
              party: 'Democratic Party'
            },
            {
              name: 'House Candidate B',
              party: 'Republican Party'
            }
          ]
        }
      ],
      pollingLocations: [
        {
          address: {
            line1: '123 Main St',
            city: 'City Name',
            state: 'State',
            zip: '12345'
          },
          pollingHours: '7:00 AM - 8:00 PM'
        }
      ]
    };
  }

  private getMockRepresentatives(address: string) {
    return {
      offices: [
        {
          name: 'President of the United States',
          level: 'country',
          roles: ['headOfGovernment'],
          officialIndices: [0]
        },
        {
          name: 'U.S. Senate',
          level: 'country', 
          roles: ['legislatorUpperBody'],
          officialIndices: [1, 2]
        }
      ],
      officials: [
        {
          name: 'Current President',
          party: 'Democratic Party',
          phones: ['(202) 456-1111']
        },
        {
          name: 'Senator A',
          party: 'Democratic Party'
        },
        {
          name: 'Senator B',
          party: 'Republican Party'
        }
      ]
    };
  }

  private getMockDivisions() {
    return {
      results: [
        {
          name: 'United States',
          id: 'ocd-division/country:us'
        },
        {
          name: 'Pennsylvania',
          id: 'ocd-division/country:us/state:pa'
        },
        {
          name: 'Michigan',
          id: 'ocd-division/country:us/state:mi'
        }
      ]
    };
  }

  /**
   * Get swing state data with election context
   */
  async getSwingStateData(): Promise<Array<{
    state: string;
    stateId: string;
    lean: string;
    electoralVotes: number;
    keyRaces: string[];
    voterTurnout?: number;
  }>> {
    return [
      {
        state: 'Pennsylvania',
        stateId: 'PA', 
        lean: '+2.3% D',
        electoralVotes: 20,
        keyRaces: ['President', 'U.S. Senate', 'Governor'],
        voterTurnout: 76.8
      },
      {
        state: 'Michigan',
        stateId: 'MI',
        lean: '-1.2% R', 
        electoralVotes: 16,
        keyRaces: ['President', 'U.S. Senate'],
        voterTurnout: 74.2
      },
      {
        state: 'Wisconsin',
        stateId: 'WI',
        lean: 'TOSS UP',
        electoralVotes: 10,
        keyRaces: ['President', 'U.S. Senate'],
        voterTurnout: 75.1
      },
      {
        state: 'Arizona',
        stateId: 'AZ',
        lean: '+0.8% R',
        electoralVotes: 11,
        keyRaces: ['President', 'U.S. Senate', 'Governor'],
        voterTurnout: 71.9
      },
      {
        state: 'Georgia', 
        stateId: 'GA',
        lean: '+1.5% D',
        electoralVotes: 16,
        keyRaces: ['President', 'U.S. Senate', 'Governor'],
        voterTurnout: 73.7
      },
      {
        state: 'Nevada',
        stateId: 'NV', 
        lean: 'TOSS UP',
        electoralVotes: 6,
        keyRaces: ['President', 'U.S. Senate'],
        voterTurnout: 68.5
      },
      {
        state: 'Florida',
        stateId: 'FL',
        lean: '+3.2% R',
        electoralVotes: 30,
        keyRaces: ['President', 'U.S. Senate', 'Governor'],
        voterTurnout: 72.3
      }
    ];
  }
}

// Export singleton instance
export const googleCivicService = new GoogleCivicService();

// Export for testing
export { GoogleCivicService };