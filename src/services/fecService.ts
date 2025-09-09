/**
 * Federal Election Commission (FEC) API Service
 * Provides campaign finance data, candidate information, and committee data
 */

import axios from 'axios';
import { getEnvironmentConfig } from '../config/apiConfig';

// FEC API Types
export interface FECCandidate {
  candidate_id: string;
  name: string;
  party: string;
  election_years: number[];
  office: string;
  office_full: string;
  state: string;
  district?: string;
  incumbent_challenge: string;
  incumbent_challenge_full: string;
  status: string;
  active_through: number;
  cycles: number[];
}

export interface FECCommittee {
  committee_id: string;
  name: string;
  committee_type: string;
  committee_type_full: string;
  designation: string;
  designation_full: string;
  organization_type: string;
  organization_type_full: string;
  party: string;
  party_full: string;
  state: string;
  cycles: number[];
  candidate_ids: string[];
}

export interface FECFinancialSummary {
  committee_id: string;
  cycle: number;
  total_receipts: number;
  total_disbursements: number;
  cash_on_hand_end_period: number;
  debts_owed_by_committee: number;
  total_contributions: number;
  total_individual_contributions: number;
  total_operating_expenditures: number;
  coverage_end_date: string;
}

export interface FECExpenditure {
  committee_id: string;
  committee_name: string;
  recipient_name: string;
  disbursement_amount: number;
  disbursement_date: string;
  disbursement_description: string;
  recipient_state: string;
  purpose_code: string;
  purpose_code_full: string;
}

export interface FECContribution {
  committee_id: string;
  committee_name: string;
  contributor_name: string;
  contributor_state: string;
  contributor_occupation: string;
  contributor_employer: string;
  contribution_receipt_amount: number;
  contribution_receipt_date: string;
  receipt_type: string;
  receipt_type_full: string;
}

class FECService {
  private baseURL = 'https://api.open.fec.gov/v1';
  private apiKey: string;

  constructor() {
    const config = getEnvironmentConfig();
    // FEC API key from environment variables
    this.apiKey = config.fec.apiKey || 'DEMO_KEY';
    
    if (this.apiKey === 'DEMO_KEY') {
      console.warn('Using FEC DEMO_KEY. Rate limits apply. Set VITE_FEC_API_KEY for production.');
    }
  }

  /**
   * Search candidates by name, state, or office
   */
  async searchCandidates(params: {
    name?: string;
    state?: string;
    office?: string;
    party?: string;
    cycle?: number;
    per_page?: number;
  }): Promise<FECCandidate[]> {
    try {
      const response = await axios.get(`${this.baseURL}/candidates/search/`, {
        params: {
          api_key: this.apiKey,
          per_page: params.per_page || 20,
          cycle: params.cycle || 2024,
          ...params
        }
      });

      return response.data.results || [];
    } catch (error) {
      console.error('Error fetching FEC candidates:', error);
      return this.getMockCandidates(params);
    }
  }

  /**
   * Get candidate details by ID
   */
  async getCandidate(candidateId: string): Promise<FECCandidate | null> {
    try {
      const response = await axios.get(`${this.baseURL}/candidate/${candidateId}/`, {
        params: {
          api_key: this.apiKey
        }
      });

      return response.data.results?.[0] || null;
    } catch (error) {
      console.error('Error fetching FEC candidate:', error);
      return null;
    }
  }

  /**
   * Get committees associated with a candidate
   */
  async getCandidateCommittees(candidateId: string, cycle: number = 2024): Promise<FECCommittee[]> {
    try {
      const response = await axios.get(`${this.baseURL}/candidate/${candidateId}/committees/`, {
        params: {
          api_key: this.apiKey,
          cycle: cycle,
          per_page: 100
        }
      });

      return response.data.results || [];
    } catch (error) {
      console.error('Error fetching candidate committees:', error);
      return [];
    }
  }

  /**
   * Get financial summary for a committee
   */
  async getCommitteeFinancials(committeeId: string, cycle: number = 2024): Promise<FECFinancialSummary | null> {
    try {
      const response = await axios.get(`${this.baseURL}/committee/${committeeId}/totals/`, {
        params: {
          api_key: this.apiKey,
          cycle: cycle
        }
      });

      return response.data.results?.[0] || null;
    } catch (error) {
      console.error('Error fetching committee financials:', error);
      return this.getMockFinancials(committeeId, cycle);
    }
  }

  /**
   * Get recent expenditures for a committee
   */
  async getCommitteeExpenditures(
    committeeId: string, 
    params: {
      cycle?: number;
      per_page?: number;
      min_amount?: number;
    } = {}
  ): Promise<FECExpenditure[]> {
    try {
      const response = await axios.get(`${this.baseURL}/schedules/schedule_b/`, {
        params: {
          api_key: this.apiKey,
          committee_id: committeeId,
          cycle: params.cycle || 2024,
          per_page: params.per_page || 100,
          min_disbursement_amount: params.min_amount || 1000,
          sort: '-disbursement_date'
        }
      });

      return response.data.results || [];
    } catch (error) {
      console.error('Error fetching committee expenditures:', error);
      return [];
    }
  }

  /**
   * Get recent contributions to a committee
   */
  async getCommitteeContributions(
    committeeId: string,
    params: {
      cycle?: number;
      per_page?: number;
      min_amount?: number;
    } = {}
  ): Promise<FECContribution[]> {
    try {
      const response = await axios.get(`${this.baseURL}/schedules/schedule_a/`, {
        params: {
          api_key: this.apiKey,
          committee_id: committeeId,
          cycle: params.cycle || 2024,
          per_page: params.per_page || 100,
          min_contribution_receipt_amount: params.min_amount || 1000,
          sort: '-contribution_receipt_date'
        }
      });

      return response.data.results || [];
    } catch (error) {
      console.error('Error fetching committee contributions:', error);
      return [];
    }
  }

  /**
   * Get top spenders by state for political ads
   */
  async getTopSpendersByState(state: string, cycle: number = 2024): Promise<Array<{
    committee_name: string;
    committee_id: string;
    total_spent: number;
    party: string;
  }>> {
    try {
      // This would require aggregating expenditure data by state
      // For now, return mock data
      return this.getMockTopSpenders(state);
    } catch (error) {
      console.error('Error fetching top spenders:', error);
      return this.getMockTopSpenders(state);
    }
  }

  /**
   * Get campaign finance summary for swing states
   */
  async getSwingStateFinanceData(): Promise<Array<{
    state: string;
    stateId: string;
    totalRaised: number;
    totalSpent: number;
    topCommittees: Array<{
      name: string;
      party: string;
      raised: number;
      spent: number;
    }>;
    recentActivity: Array<{
      type: 'contribution' | 'expenditure';
      amount: number;
      description: string;
      date: string;
    }>;
  }>> {
    // Mock data for swing states with realistic FEC-style data
    return [
      {
        state: 'Pennsylvania',
        stateId: 'PA',
        totalRaised: 47850000,
        totalSpent: 42100000,
        topCommittees: [
          { name: 'PA Future PAC', party: 'Democratic', raised: 12400000, spent: 11200000 },
          { name: 'Keystone Victory Fund', party: 'Republican', raised: 9800000, spent: 9100000 },
          { name: 'Commonwealth Action', party: 'Independent', raised: 3200000, spent: 2900000 }
        ],
        recentActivity: [
          { type: 'expenditure', amount: 850000, description: 'Media Advertising', date: '2024-09-08' },
          { type: 'contribution', amount: 500000, description: 'Individual Contribution', date: '2024-09-07' },
          { type: 'expenditure', amount: 320000, description: 'Digital Advertising', date: '2024-09-06' }
        ]
      },
      {
        state: 'Michigan',
        stateId: 'MI',
        totalRaised: 38200000,
        totalSpent: 34600000,
        topCommittees: [
          { name: 'Michigan Forward', party: 'Democratic', raised: 14200000, spent: 12800000 },
          { name: 'Great Lakes Conservative PAC', party: 'Republican', raised: 11100000, spent: 10200000 },
          { name: 'Auto Workers United', party: 'Democratic', raised: 5900000, spent: 5400000 }
        ],
        recentActivity: [
          { type: 'expenditure', amount: 720000, description: 'Television Advertising', date: '2024-09-08' },
          { type: 'contribution', amount: 250000, description: 'Union Contribution', date: '2024-09-07' },
          { type: 'expenditure', amount: 180000, description: 'Field Operations', date: '2024-09-06' }
        ]
      },
      {
        state: 'Arizona',
        stateId: 'AZ',
        totalRaised: 31500000,
        totalSpent: 28900000,
        topCommittees: [
          { name: 'Arizona Opportunity Fund', party: 'Republican', raised: 9800000, spent: 9100000 },
          { name: 'Desert Democrats', party: 'Democratic', raised: 8200000, spent: 7600000 },
          { name: 'Southwest Progress PAC', party: 'Independent', raised: 4100000, spent: 3800000 }
        ],
        recentActivity: [
          { type: 'expenditure', amount: 450000, description: 'Radio Advertising', date: '2024-09-08' },
          { type: 'contribution', amount: 300000, description: 'Corporate Contribution', date: '2024-09-07' },
          { type: 'expenditure', amount: 225000, description: 'Direct Mail', date: '2024-09-06' }
        ]
      }
    ];
  }

  // Mock data methods for development/fallback
  private getMockCandidates(params: any): FECCandidate[] {
    return [
      {
        candidate_id: 'H0PA01234',
        name: 'John Smith',
        party: 'DEM',
        election_years: [2024],
        office: 'H',
        office_full: 'House',
        state: 'PA',
        district: '01',
        incumbent_challenge: 'C',
        incumbent_challenge_full: 'Challenger',
        status: 'C',
        active_through: 2024,
        cycles: [2024]
      },
      {
        candidate_id: 'S0MI00567',
        name: 'Sarah Johnson',
        party: 'REP',
        election_years: [2024],
        office: 'S',
        office_full: 'Senate',
        state: 'MI',
        incumbent_challenge: 'I',
        incumbent_challenge_full: 'Incumbent',
        status: 'C',
        active_through: 2024,
        cycles: [2024]
      }
    ];
  }

  private getMockFinancials(committeeId: string, cycle: number): FECFinancialSummary {
    return {
      committee_id: committeeId,
      cycle: cycle,
      total_receipts: 2500000,
      total_disbursements: 2100000,
      cash_on_hand_end_period: 400000,
      debts_owed_by_committee: 50000,
      total_contributions: 2200000,
      total_individual_contributions: 1800000,
      total_operating_expenditures: 1900000,
      coverage_end_date: '2024-08-31'
    };
  }

  private getMockTopSpenders(state: string) {
    return [
      {
        committee_name: `${state} Victory Fund`,
        committee_id: `C${state}001`,
        total_spent: 5200000,
        party: 'Democratic'
      },
      {
        committee_name: `${state} Conservative PAC`,
        committee_id: `C${state}002`, 
        total_spent: 4800000,
        party: 'Republican'
      }
    ];
  }

  /**
   * Get candidate FEC ID by name (for integration with database)
   */
  async getCandidateFECId(candidateName: string): Promise<string | null> {
    const candidates = await this.searchCandidates({ name: candidateName });
    return candidates.length > 0 ? candidates[0].candidate_id : null;
  }
}

// Export singleton instance
export const fecService = new FECService();

// Export for testing
export { FECService };