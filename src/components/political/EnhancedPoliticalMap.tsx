import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../shared/Card';
import { googleCivicService } from '../../services/googleCivicService';
import { fecService } from '../../services/fecService';

interface SwingStateData {
  state: string;
  stateId: string;
  lean: string;
  electoralVotes: number;
  voterTurnout?: number;
  totalRaised?: number;
  totalSpent?: number;
  keyRaces: string[];
  recentActivity?: Array<{
    type: 'contribution' | 'expenditure';
    amount: number;
    description: string;
    date: string;
  }>;
}

export const EnhancedPoliticalMap: React.FC = () => {
  const navigate = useNavigate();
  const [swingStates, setSwingStates] = useState<SwingStateData[]>([]);
  const [selectedState, setSelectedState] = useState<SwingStateData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPoliticalData = async () => {
      try {
        // Load Google Civic swing state data
        const civicData = await googleCivicService.getSwingStateData();
        
        // Load FEC finance data
        const fecData = await fecService.getSwingStateFinanceData();
        
        // Merge the data
        const mergedData = civicData.map(civic => {
          const fec = fecData.find(f => f.stateId === civic.stateId);
          return {
            ...civic,
            totalRaised: fec?.totalRaised,
            totalSpent: fec?.totalSpent,
            recentActivity: fec?.recentActivity?.slice(0, 2) // Top 2 recent activities
          };
        });

        setSwingStates(mergedData);
      } catch (error) {
        console.error('Error loading political data:', error);
        // Fallback to basic data
        setSwingStates([
          { 
            state: 'Pennsylvania', 
            stateId: 'PA', 
            lean: '+2.3% D', 
            electoralVotes: 20,
            keyRaces: ['President', 'U.S. Senate'] 
          },
          { 
            state: 'Michigan', 
            stateId: 'MI', 
            lean: '-1.2% R', 
            electoralVotes: 16,
            keyRaces: ['President', 'U.S. Senate'] 
          },
          { 
            state: 'Wisconsin', 
            stateId: 'WI', 
            lean: 'TOSS UP', 
            electoralVotes: 10,
            keyRaces: ['President'] 
          },
          { 
            state: 'Arizona', 
            stateId: 'AZ', 
            lean: '+0.8% R', 
            electoralVotes: 11,
            keyRaces: ['President', 'Governor'] 
          },
          { 
            state: 'Georgia', 
            stateId: 'GA', 
            lean: '+1.5% D', 
            electoralVotes: 16,
            keyRaces: ['President', 'Governor'] 
          },
          { 
            state: 'Nevada', 
            stateId: 'NV',
            lean: 'TOSS UP', 
            electoralVotes: 6,
            keyRaces: ['President'] 
          },
          { 
            state: 'Florida', 
            stateId: 'FL', 
            lean: '+3.2% R', 
            electoralVotes: 30,
            keyRaces: ['President', 'Governor'] 
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadPoliticalData();
  }, []);

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return 'N/A';
    return `$${(amount / 1000000).toFixed(1)}M`;
  };

  const getLeanColor = (lean: string) => {
    if (lean.includes('TOSS UP')) return 'text-amber-400';
    if (lean.includes('D')) return 'text-blue-400';
    return 'text-red-400';
  };

  const handleStateClick = (state: SwingStateData) => {
    navigate(`/intelligence-hub?location=${state.state}&filter=political`);
  };

  return (
    <Card className="political-map-enhanced hoverable" padding="md" variant="glass">
      <div className="grid grid-cols-1 lg:grid-cols-[460px_1fr] gap-4">
        {/* Map Image with Interactive Overlay */}
        <div className="bg-black/20 rounded-lg p-4 flex items-center justify-center overflow-hidden relative">
          <img
            src="https://p129.p0.n0.cdn.zight.com/items/BluAK9rN/cb190d20-eec7-4e05-8969-259b1dbd9d69.png?source=client&v=6826eb6cb151acf76bf79d55b23b9628"
            alt="Political Electoral Map"
            className="w-full h-auto max-h-[280px] object-contain"
          />
          
          {/* Google Civic & FEC Data Indicator */}
          <div className="absolute top-2 right-2 flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" title="Google Civic API"></div>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="FEC Data"></div>
          </div>
        </div>

        {/* Enhanced Swing States List */}
        <div className="text-sm space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="section-header mb-3">SWING STATES</h3>
            <div className="text-xs text-white/60">
              Live: Civic API • FEC Data
            </div>
          </div>
          
          {loading ? (
            <div className="text-center text-white/60 py-4">
              Loading political data...
            </div>
          ) : (
            <div className="space-y-2 max-h-[240px] overflow-y-auto">
              {swingStates.map((state, index) => (
                <div
                  key={state.stateId}
                  className="bg-black/30 rounded-lg p-3 cursor-pointer hover:bg-black/50 transition-all duration-200"
                  onClick={() => handleStateClick(state)}
                  onMouseEnter={() => setSelectedState(state)}
                  onMouseLeave={() => setSelectedState(null)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">• {state.state}</span>
                      <span className="text-xs text-white/40">({state.stateId})</span>
                    </div>
                    <span className={`font-mono text-xs ${getLeanColor(state.lean)}`}>
                      {state.lean}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-orange-400 font-bold">{state.electoralVotes}</span>
                      <span className="text-white/60 ml-1">EVs</span>
                    </div>
                    
                    {state.totalRaised && (
                      <div>
                        <span className="text-green-400 font-bold">{formatCurrency(state.totalRaised)}</span>
                        <span className="text-white/60 ml-1">raised</span>
                      </div>
                    )}

                    {state.voterTurnout && (
                      <div>
                        <span className="text-cyan-400 font-bold">{state.voterTurnout}%</span>
                        <span className="text-white/60 ml-1">turnout</span>
                      </div>
                    )}
                  </div>

                  {state.keyRaces && state.keyRaces.length > 0 && (
                    <div className="mt-1 text-xs text-white/50">
                      Races: {state.keyRaces.join(', ')}
                    </div>
                  )}

                  {state.recentActivity && state.recentActivity.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {state.recentActivity.slice(0, 1).map((activity, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className={activity.type === 'contribution' ? 'text-green-300' : 'text-red-300'}>
                            {activity.type === 'contribution' ? '↗' : '↙'} {activity.description}
                          </span>
                          <span className="text-white/60">
                            {formatCurrency(activity.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Summary Stats */}
          <div className="mt-4 p-3 bg-black/30 rounded-lg border border-white/10">
            <div className="text-xs text-white/60 mb-2">ELECTORAL SUMMARY</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-blue-400 font-bold">
                  {swingStates.filter(s => s.lean.includes('D')).reduce((sum, s) => sum + s.electoralVotes, 0)}
                </span>
                <span className="text-white/60 ml-1">Lean D</span>
              </div>
              <div>
                <span className="text-red-400 font-bold">
                  {swingStates.filter(s => s.lean.includes('R')).reduce((sum, s) => sum + s.electoralVotes, 0)}
                </span>
                <span className="text-white/60 ml-1">Lean R</span>
              </div>
              <div>
                <span className="text-amber-400 font-bold">
                  {swingStates.filter(s => s.lean.includes('TOSS UP')).reduce((sum, s) => sum + s.electoralVotes, 0)}
                </span>
                <span className="text-white/60 ml-1">Toss Up</span>
              </div>
              <div>
                <span className="text-green-400 font-bold">
                  {formatCurrency(swingStates.reduce((sum, s) => sum + (s.totalRaised || 0), 0))}
                </span>
                <span className="text-white/60 ml-1">Total</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed State Tooltip */}
      {selectedState && (
        <div className="absolute bottom-4 right-4 bg-black/90 border border-white/20 rounded-lg p-3 max-w-xs">
          <div className="font-semibold text-white mb-2">{selectedState.state} Details</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-white/60">Electoral Votes:</span>
              <span className="text-orange-400 font-bold">{selectedState.electoralVotes}</span>
            </div>
            {selectedState.totalRaised && (
              <div className="flex justify-between">
                <span className="text-white/60">Total Raised:</span>
                <span className="text-green-400">{formatCurrency(selectedState.totalRaised)}</span>
              </div>
            )}
            {selectedState.totalSpent && (
              <div className="flex justify-between">
                <span className="text-white/60">Total Spent:</span>
                <span className="text-red-400">{formatCurrency(selectedState.totalSpent)}</span>
              </div>
            )}
            {selectedState.voterTurnout && (
              <div className="flex justify-between">
                <span className="text-white/60">Voter Turnout:</span>
                <span className="text-cyan-400">{selectedState.voterTurnout}%</span>
              </div>
            )}
          </div>
          <div className="mt-2 text-xs text-blue-300">
            Click to view intelligence hub →
          </div>
        </div>
      )}
    </Card>
  );
};

export default EnhancedPoliticalMap;