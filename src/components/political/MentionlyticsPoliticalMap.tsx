import React, { useState, useMemo, memo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { scaleQuantize } from 'd3-scale';
import { useGeographicMentions } from '../../hooks/useMentionlytics';

// FEC API Configuration
const FEC_API_KEY = import.meta.env.VITE_FEC_API_KEY || '3kSPSUh0S5UnrM3XCLYLQcS1H31ILf04n5nqr9He';
const FEC_API_BASE = 'https://api.open.fec.gov/v1';

// Try different CDN URL format
const geoUrl = 'https://unpkg.com/us-atlas@3/states-10m.json';
// Alternative: const geoUrl = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

interface StateData {
  id: string;
  name: string;
  mentions: number;
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
  sentimentScore: number;
  topKeywords: string[];
  // FEC Real Data
  totalContributions: number;
  contributors: number;
  realDataAvailable: boolean;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  data: StateData | null;
}

const MentionlyticsPoliticalMap: React.FC = memo(() => {
  const navigate = useNavigate();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { data: mentionlyticsData, loading, dataMode } = useGeographicMentions();
  
  // State for real FEC data
  const [realFECData, setRealFECData] = useState<Record<string, {contributions: number, contributors: number}>>({});
  const [fecLoading, setFecLoading] = useState(false);

  // Removed debug logging - map is working now!

  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    data: null,
  });

  // Fetch real FEC data for major states
  useEffect(() => {
    const fetchRealData = async () => {
      setFecLoading(true);
      const majorStates = ['TX', 'FL', 'CA', 'NY', 'PA', 'GA', 'NC', 'MI', 'AZ', 'WI', 'OH', 'VA'];
      const fecData: Record<string, {contributions: number, contributors: number}> = {};

      for (const state of majorStates) {
        try {
          const response = await fetch(
            `${FEC_API_BASE}/schedules/schedule_a/by_state/?api_key=${FEC_API_KEY}&state=${state}&cycle=2024&per_page=1`
          );
          
          if (response.ok) {
            const data = await response.json();
            const total = data.results?.[0]?.total || 0;
            const count = data.results?.[0]?.count || 0;
            fecData[state] = { contributions: total, contributors: count };
            console.log(`Real FEC Data - ${state}: $${total.toLocaleString()}`);
          }
        } catch (error) {
          console.error(`FEC API error for ${state}:`, error);
        }
      }
      
      setRealFECData(fecData);
      setFecLoading(false);
    };

    // Only fetch if we have an API key
    if (FEC_API_KEY) {
      fetchRealData();
    }
  }, []);

  // Helper function to get state abbreviation from name
  const getStateAbbr = (stateName: string): string => {
    const stateMap: Record<string, string> = {
      'Texas': 'TX', 'Florida': 'FL', 'California': 'CA', 'New York': 'NY',
      'Pennsylvania': 'PA', 'Georgia': 'GA', 'North Carolina': 'NC', 
      'Michigan': 'MI', 'Arizona': 'AZ', 'Wisconsin': 'WI', 'Ohio': 'OH', 'Virginia': 'VA'
    };
    return stateMap[stateName] || '';
  };

  // Convert Mentionlytics data to state lookup with real FEC data
  const stateDataMap = useMemo(() => {
    const map = new Map<string, StateData>();

    if (mentionlyticsData) {
      mentionlyticsData.forEach((locationData) => {
        const totalMentions =
          locationData.sentiment.positive +
          locationData.sentiment.negative +
          locationData.sentiment.neutral;
        const sentimentScore =
          totalMentions > 0
            ? ((locationData.sentiment.positive - locationData.sentiment.negative) /
                totalMentions) *
              100
            : 0;

        const stateAbbr = getStateAbbr(locationData.state);
        const fecData = realFECData[stateAbbr] || { contributions: 0, contributors: 0 };
        
        map.set(locationData.state, {
          id: locationData.state,
          name: locationData.state,
          mentions: locationData.mentions,
          sentiment: locationData.sentiment,
          sentimentScore,
          topKeywords: locationData.topKeywords,
          totalContributions: fecData.contributions,
          contributors: fecData.contributors,
          realDataAvailable: fecData.contributions > 0,
        });
      });
    }

    return map;
  }, [mentionlyticsData, realFECData]);

  // Get top states by activity
  const topStates = useMemo(() => {
    const states = Array.from(stateDataMap.values());
    return states
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, 7)
      .map((state) => ({
        name: state.name,
        mentions: state.mentions,
        sentimentScore: state.sentimentScore,
        sentiment: state.sentiment,
        totalContributions: state.totalContributions,
        realDataAvailable: state.realDataAvailable,
      }));
  }, [stateDataMap]);

  // Create color scale based on sentiment scores
  const colorScale = useMemo(() => {
    const sentimentScores = Array.from(stateDataMap.values()).map((state) => state.sentimentScore);

    if (sentimentScores.length === 0) {
      return scaleQuantize()
        .domain([-50, 50])
        .range(['#fb718580', '#fda4af80', '#94a3b880', '#86efac80', '#34d39980']);
    }

    const minScore = Math.min(...sentimentScores);
    const maxScore = Math.max(...sentimentScores);

    return scaleQuantize()
      .domain([Math.min(minScore, -20), Math.max(maxScore, 20)])
      .range(['#fb718580', '#fda4af80', '#94a3b880', '#86efac80', '#34d39980']);
  }, [stateDataMap]);

  const handleStateClick = (geo: any) => {
    const stateName = geo.properties.name;
    navigate(`/intelligence-hub?location=${stateName}`);
  };

  const handleStateHover = (geo: any, event: React.MouseEvent) => {
    const stateName = geo.properties.name;
    const stateData = stateDataMap.get(stateName);
    
    // Get the container bounds for better positioning
    const containerRect = containerRef.current?.getBoundingClientRect();
    const relativeX = containerRect ? event.clientX - containerRect.left : event.clientX;
    const relativeY = containerRect ? event.clientY - containerRect.top : event.clientY;

    // Show tooltip for all states, with default data for states without activity
    const tooltipData = stateData || {
      id: stateName,
      name: stateName,
      mentions: 0,
      sentiment: { positive: 0, negative: 0, neutral: 0 },
      sentimentScore: 0,
      topKeywords: ['No activity'],
      totalContributions: 0,
      contributors: 0,
      realDataAvailable: false,
    };

    setTooltip({
      visible: true,
      x: relativeX,
      y: relativeY,
      data: tooltipData,
    });
  };

  const handleStateLeave = () => {
    setTooltip({ visible: false, x: 0, y: 0, data: null });
  };

  const getStateFill = (geo: any): string => {
    const stateName = geo.properties.name;
    const stateData = stateDataMap.get(stateName);

    if (stateData) {
      const score = stateData.sentimentScore;
      // Using dashboard color palette
      if (score > 20) return '#34d399'; // emerald-400
      if (score > 0) return '#10b981'; // emerald-500
      if (score > -20) return '#0ea5e9'; // sky-500
      if (score > -40) return '#f97316'; // orange-500
      return '#f87171'; // rose-400
    }

    return '#475569'; // slate-600 for states without data
  };

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <div className="flex w-full h-full">
        {/* Left side - Map centered and scaled */}
        <div
          className="flex-1 relative flex items-center justify-start"
          style={{ minHeight: '275px' }}
        >
          <div
            className="relative w-full max-w-lg lg:max-w-none flex justify-start"
            style={{ height: '275px', marginTop: '-80px' }}
          >
            <ComposableMap
              projection="geoAlbersUsa"
              width={388}
              height={245}
              style={{ width: 'auto', height: 'auto', maxHeight: '275px', maxWidth: '100%' }}
              projectionConfig={{
                scale: 428,
              }}
              className="political-map-svg"
            >
                <Geographies geography={geoUrl}>
                  {({ geographies }) => {
                    if (!geographies || geographies.length === 0) {
                      return (
                        <text
                          x="160"
                          y="100"
                          fill="red"
                          fontSize="20"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          MAP DATA FAILED TO LOAD!
                        </text>
                      );
                    }

                    return geographies.map((geo) => {
                      const fill = getStateFill(geo);
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={fill}
                          stroke="#ffffff"
                          strokeWidth={0.5}
                          style={{
                            default: { outline: 'none' },
                            hover: {
                              fill: '#ffffff40',
                              outline: 'none',
                              cursor: 'pointer',
                            },
                            pressed: { outline: 'none' },
                          }}
                          onClick={() => handleStateClick(geo)}
                          onMouseEnter={(event) => handleStateHover(geo, event)}
                          onMouseLeave={handleStateLeave}
                        />
                      );
                    });
                  }}
                </Geographies>
            </ComposableMap>
          </div>
        </div>

        {/* Right side - TOP ACTIVITY list */}
        <div className="hidden md:flex w-48 pl-4 flex-col justify-start pt-4">
          <div className="text-xs text-white/60 mb-2 uppercase font-semibold tracking-wider font-barlow text-right">
            TOP ACTIVITY
            {fecLoading && <div className="text-yellow-400 text-xs">Loading FEC data...</div>}
            {Object.keys(realFECData).length > 0 && !fecLoading && (
              <div className="text-green-400 text-xs">🚀 Real FEC Data</div>
            )}
          </div>
          <div className="space-y-0.5 text-right">
            {topStates.map((state) => {
              const sentimentColor =
                state.sentimentScore > 20
                  ? 'text-emerald-400'
                  : state.sentimentScore > -20
                    ? 'text-sky-400'
                    : 'text-rose-400';

              // Helper function to format money
              const formatMoney = (amount: number): string => {
                if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
                if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
                if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
                return `$${amount.toFixed(0)}`;
              };

              const displayValue = state.realDataAvailable
                ? formatMoney(state.totalContributions)
                : state.sentimentScore !== 0
                  ? `${state.sentimentScore > 0 ? '+' : ''}${state.sentimentScore.toFixed(0)}%`
                  : `${state.mentions} mentions`;

              return (
                <button
                  key={state.name}
                  onClick={() => navigate(`/intelligence-hub?location=${state.name}`)}
                  className="w-full text-right hover:bg-white/5 px-1 py-0.5 rounded transition-colors duration-200"
                >
                  <div className="text-white/80 text-xs font-barlow leading-tight">
                    {state.name}:{' '}
                    <span className={`font-jetbrains ${sentimentColor}`}>{displayValue}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sentiment Legend - positioned below bottom edge */}
      <div className="absolute left-2 right-2 z-20" style={{ bottom: '-7px' }}>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-white/40 uppercase font-barlow font-medium tracking-wide">
            Sentiment:
          </span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-2 h-1.5 bg-rose-400 rounded-sm"></div>
              <span className="text-white/50">Neg</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-1.5 bg-sky-400 rounded-sm"></div>
              <span className="text-white/50">Neu</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-1.5 bg-emerald-400 rounded-sm"></div>
              <span className="text-white/50">Pos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      <div
        className={`absolute political-map-tooltip ${tooltip.visible && tooltip.data ? 'visible' : ''}`}
        style={{
          left: `${tooltip.x + 10}px`,
          top: `${tooltip.y - 10}px`,
        }}
      >
        {tooltip.data && (
          <div className="bg-black/90 backdrop-blur-md border border-white/20 rounded-lg p-3 shadow-lg max-w-xs">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-white font-barlow">{tooltip.data.name}</h4>
              <div
                className={`px-2 py-1 rounded text-xs font-bold ${
                  tooltip.data.sentimentScore > 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {tooltip.data.sentimentScore > 0 ? '+' : ''}
                {tooltip.data.sentimentScore.toFixed(1)}%
              </div>
            </div>

            <div className="space-y-1 text-xs text-white/80">
              <div className="font-jetbrains">
                Mentions:{' '}
                <span className="text-sky-400 font-bold">
                  {tooltip.data.mentions.toLocaleString()}
                </span>
              </div>

              {/* Real FEC Data Section */}
              {tooltip.data.realDataAvailable && (
                <>
                  <div className="font-jetbrains border-t border-white/20 pt-2 mt-2">
                    <div className="text-yellow-400 font-bold mb-1">💰 REAL FEC DATA</div>
                    <div>Total Contributions: <span className="text-green-400 font-bold">
                      {(() => {
                        const amount = tooltip.data.totalContributions;
                        if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
                        if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
                        if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
                        return `$${amount.toFixed(0)}`;
                      })()}
                    </span></div>
                    <div>Contributors: <span className="text-blue-400 font-bold">
                      {tooltip.data.contributors.toLocaleString()}
                    </span></div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-3 gap-1 text-xs mb-2">
                <div className="text-emerald-400">+{tooltip.data.sentiment.positive}</div>
                <div className="text-rose-400">-{tooltip.data.sentiment.negative}</div>
                <div className="text-gray-400">={tooltip.data.sentiment.neutral}</div>
              </div>

              <div className="text-xs">
                <span className="text-cyan-300">Trending:</span>{' '}
                {tooltip.data.topKeywords.join(', ')}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

MentionlyticsPoliticalMap.displayName = 'MentionlyticsPoliticalMap';

export default MentionlyticsPoliticalMap;
