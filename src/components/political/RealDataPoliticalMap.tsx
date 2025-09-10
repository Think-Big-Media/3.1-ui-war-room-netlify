import React, { useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { Tooltip } from 'react-tooltip';

const geoUrl = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

// FEC API Configuration
const FEC_API_KEY = import.meta.env.VITE_FEC_API_KEY || '3kSPSUh0S5UnrM3XCLYLQcS1H31ILf04n5nqr9He';
const FEC_API_BASE = 'https://api.open.fec.gov/v1';

// Google Civic API Configuration  
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_CIVIC_API_KEY || 'AIzaSyB_m_vkKpNG3jAX8rrORBXC0KFlyS4PGWo';
const GOOGLE_API_BASE = 'https://www.googleapis.com/civicinfo/v2';

interface StateInfo {
  name: string;
  abbreviation: string;
  // Financial data from FEC
  totalContributions: number;
  topContributors: number;
  contributionTrend: string;
  // Political data
  representatives: string[];
  senators: string[];
  // Calculated sentiment (based on contribution levels)
  sentiment: number;
  activity: 'High' | 'Medium' | 'Low';
}

const RealDataPoliticalMap: React.FC = () => {
  const [stateData, setStateData] = useState<Record<string, StateInfo>>({});
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<'contributions' | 'activity' | 'sentiment'>('contributions');

  // State abbreviations mapping
  const stateNames: Record<string, string> = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
    'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
    'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
    'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
    'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
    'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
    'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
    'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
    'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
    'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
  };

  useEffect(() => {
    fetchAllStateData();
  }, []);

  const fetchAllStateData = async () => {
    setLoading(true);
    
    // Priority states to load first for immediate visual feedback
    const priorityStates = ['TX', 'FL', 'CA', 'NY', 'PA', 'GA', 'NC', 'MI', 'AZ', 'WI', 'OH', 'VA'];
    
    // Initialize with default data for all states
    const initialData: Record<string, StateInfo> = {};
    Object.entries(stateNames).forEach(([abbr, name]) => {
      initialData[abbr] = {
        name,
        abbreviation: abbr,
        totalContributions: 0,
        topContributors: 0,
        contributionTrend: 'stable',
        representatives: [],
        senators: [],
        sentiment: 0,
        activity: 'Low'
      };
    });
    setStateData(initialData);

    // Fetch real data for priority states
    for (const state of priorityStates) {
      try {
        const data = await fetchStateData(state);
        setStateData(prev => ({
          ...prev,
          [state]: { ...prev[state], ...data }
        }));
      } catch (error) {
        console.error(`Error fetching data for ${state}:`, error);
      }
    }

    setLoading(false);
  };

  const fetchStateData = async (stateAbbr: string): Promise<Partial<StateInfo>> => {
    const data: Partial<StateInfo> = {};

    // Fetch FEC contribution data
    try {
      const fecResponse = await fetch(
        `${FEC_API_BASE}/schedules/schedule_a/by_state/?api_key=${FEC_API_KEY}&state=${stateAbbr}&cycle=2024&per_page=1`
      );
      
      if (fecResponse.ok) {
        const fecData = await fecResponse.json();
        const total = fecData.results?.[0]?.total || 0;
        const count = fecData.results?.[0]?.count || 0;
        
        data.totalContributions = total;
        data.topContributors = count;
        
        // Calculate sentiment based on contribution levels
        if (total > 50000000) {
          data.sentiment = 75; // Very high activity
          data.activity = 'High';
        } else if (total > 10000000) {
          data.sentiment = 50; // High activity
          data.activity = 'High';
        } else if (total > 5000000) {
          data.sentiment = 25; // Medium activity
          data.activity = 'Medium';
        } else {
          data.sentiment = 0; // Low activity
          data.activity = 'Low';
        }
        
        // Determine trend (simplified)
        data.contributionTrend = total > 10000000 ? 'up' : total > 5000000 ? 'stable' : 'down';
      }
    } catch (error) {
      console.error(`FEC API error for ${stateAbbr}:`, error);
    }

    // Try to fetch representative data (may have CORS issues)
    try {
      // For now, use placeholder names since Google Civic needs proper address
      // In production, you'd use a backend proxy to avoid CORS
      const mockReps = {
        'TX': { senators: ['Ted Cruz', 'John Cornyn'], reps: 38 },
        'FL': { senators: ['Marco Rubio', 'Rick Scott'], reps: 28 },
        'CA': { senators: ['Alex Padilla', 'Laphonza Butler'], reps: 52 },
        'NY': { senators: ['Chuck Schumer', 'Kirsten Gillibrand'], reps: 26 },
        'PA': { senators: ['Bob Casey Jr.', 'John Fetterman'], reps: 17 },
        'GA': { senators: ['Jon Ossoff', 'Raphael Warnock'], reps: 14 },
        'NC': { senators: ['Thom Tillis', 'Ted Budd'], reps: 14 },
        'MI': { senators: ['Debbie Stabenow', 'Gary Peters'], reps: 13 },
        'AZ': { senators: ['Kyrsten Sinema', 'Mark Kelly'], reps: 9 },
        'WI': { senators: ['Tammy Baldwin', 'Ron Johnson'], reps: 8 },
        'OH': { senators: ['Sherrod Brown', 'J.D. Vance'], reps: 15 },
        'VA': { senators: ['Mark Warner', 'Tim Kaine'], reps: 11 }
      };

      if (mockReps[stateAbbr]) {
        data.senators = mockReps[stateAbbr].senators;
        data.representatives = [`${mockReps[stateAbbr].reps} House Representatives`];
      }
    } catch (error) {
      console.error(`Google Civic API error for ${stateAbbr}:`, error);
    }

    return data;
  };

  const getStateColor = (stateAbbr: string) => {
    const state = stateData[stateAbbr];
    if (!state) return '#374151'; // Default gray

    switch (selectedMetric) {
      case 'contributions': {
        const amount = state.totalContributions;
        if (amount > 50000000) return '#1e3a8a'; // Dark blue - Very high
        if (amount > 20000000) return '#2563eb'; // Blue - High
        if (amount > 10000000) return '#3b82f6'; // Medium blue
        if (amount > 5000000) return '#60a5fa'; // Light blue
        if (amount > 1000000) return '#93c5fd'; // Very light blue
        if (amount > 0) return '#dbeafe'; // Pale blue
        return '#374151'; // Gray - No data
      }
      
      case 'activity': {
        switch (state.activity) {
          case 'High': return '#dc2626'; // Red - High activity
          case 'Medium': return '#f59e0b'; // Orange - Medium
          case 'Low': return '#10b981'; // Green - Low
          default: return '#374151';
        }
      }
      
      case 'sentiment': {
        const sentiment = state.sentiment;
        if (sentiment > 50) return '#10b981'; // Green - Positive
        if (sentiment > 0) return '#60a5fa'; // Blue - Neutral positive
        if (sentiment < -50) return '#ef4444'; // Red - Negative
        if (sentiment < 0) return '#f87171'; // Light red
        return '#6b7280'; // Gray - Neutral
      }
      
      default:
        return '#374151';
    }
  };

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toFixed(0)}`;
  };

  const getTooltipContent = (stateAbbr: string): string => {
    const state = stateData[stateAbbr];
    if (!state) return stateAbbr;

    const lines = [
      `<strong>${state.name}</strong>`,
      `<div style="margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 8px;">`,
      `<strong>💰 Campaign Finance (FEC)</strong>`,
      `Total Contributions: ${formatCurrency(state.totalContributions)}`,
      `Contributors: ${state.topContributors.toLocaleString()}`,
      `Trend: ${state.contributionTrend === 'up' ? '📈' : state.contributionTrend === 'down' ? '📉' : '➡️'} ${state.contributionTrend}`,
      `</div>`
    ];

    if (state.senators.length > 0) {
      lines.push(
        `<div style="margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 8px;">`,
        `<strong>🏛️ Representatives</strong>`,
        `Senators: ${state.senators.join(', ')}`,
        state.representatives[0] || '',
        `</div>`
      );
    }

    lines.push(
      `<div style="margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 8px;">`,
      `Political Activity: <strong>${state.activity}</strong>`,
      `</div>`
    );

    return lines.join('<br/>');
  };

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      {/* Header Controls */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
        <div className="bg-gray-800 rounded-lg px-3 py-2">
          <h3 className="text-white font-semibold text-sm">Real Political Data Map</h3>
          <p className="text-xs text-gray-400">
            {loading ? 'Loading FEC data...' : 'Live data from FEC API'}
          </p>
        </div>

        {/* Metric Selector */}
        <div className="bg-gray-800 rounded-lg p-2 flex space-x-2">
          <button
            onClick={() => setSelectedMetric('contributions')}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              selectedMetric === 'contributions' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            💰 Contributions
          </button>
          <button
            onClick={() => setSelectedMetric('activity')}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              selectedMetric === 'activity' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            📊 Activity
          </button>
          <button
            onClick={() => setSelectedMetric('sentiment')}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              selectedMetric === 'sentiment' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            😊 Sentiment
          </button>
        </div>
      </div>

      {/* Map */}
      <ComposableMap 
        projection="geoAlbersUsa"
        className="w-full h-full"
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map(geo => {
              const stateAbbr = geo.properties.STUSPS || geo.id;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={getStateColor(stateAbbr)}
                  stroke="#1f2937"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: 'none' },
                    hover: { 
                      fill: '#fbbf24',
                      outline: 'none',
                      cursor: 'pointer'
                    },
                    pressed: { outline: 'none' }
                  }}
                  onMouseEnter={() => setHoveredState(stateAbbr)}
                  onMouseLeave={() => setHoveredState(null)}
                  data-tooltip-id="state-tooltip"
                  data-tooltip-html={getTooltipContent(stateAbbr)}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {/* Tooltip */}
      <Tooltip 
        id="state-tooltip"
        className="!bg-gray-800 !text-white !opacity-95 !px-4 !py-3 !text-sm !max-w-xs"
        place="top"
        offset={10}
      />

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-gray-800 rounded-lg p-3 text-white">
        <h4 className="text-xs font-semibold mb-2">
          {selectedMetric === 'contributions' && '💰 Contribution Levels'}
          {selectedMetric === 'activity' && '📊 Political Activity'}
          {selectedMetric === 'sentiment' && '😊 Sentiment Score'}
        </h4>
        <div className="space-y-1 text-xs">
          {selectedMetric === 'contributions' && (
            <>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-900 rounded"></div>
                <span>&gt;$50M</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-600 rounded"></div>
                <span>$20-50M</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-400 rounded"></div>
                <span>$5-20M</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-200 rounded"></div>
                <span>&lt;$5M</span>
              </div>
            </>
          )}
          {selectedMetric === 'activity' && (
            <>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-600 rounded"></div>
                <span>High</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span>Medium</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Low</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Top States Info */}
      {!loading && hoveredState && stateData[hoveredState] && (
        <div className="absolute bottom-4 left-4 bg-gray-800 rounded-lg p-3 text-white max-w-sm">
          <h4 className="font-semibold">{stateData[hoveredState].name}</h4>
          <p className="text-sm text-gray-300 mt-1">
            Total Contributions: {formatCurrency(stateData[hoveredState].totalContributions)}
          </p>
        </div>
      )}
    </div>
  );
};

export default RealDataPoliticalMap;