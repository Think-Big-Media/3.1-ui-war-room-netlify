import type React from 'react';
import Card from '../shared/Card';

interface PoliticalMapProps {
  className?: string;
}

const PoliticalMap: React.FC<PoliticalMapProps> = ({ className = '' }) => {
  const swingStates = [
    { state: 'Pennsylvania', lean: '+2.3% D' },
    { state: 'Michigan', lean: '-1.2% R' },
    { state: 'Wisconsin', lean: 'TOSS UP' },
    { state: 'Arizona', lean: '+0.8% R' },
    { state: 'Georgia', lean: '+1.5% D' },
    { state: 'Nevada', lean: 'TOSS UP' },
    { state: 'Florida', lean: '+3.2% R' },
  ];

  return (
    <Card className={`hoverable ${className}`} padding="md" variant="glass">
      <div className="grid grid-cols-1 lg:grid-cols-[460px_1fr] gap-4">
        <div className="bg-black/20 rounded-lg p-4 flex items-center justify-center overflow-hidden">
          <img
            src="https://p129.p0.n0.cdn.zight.com/items/BluAK9rN/cb190d20-eec7-4e05-8969-259b1dbd9d69.png?source=client&v=6826eb6cb151acf76bf79d55b23b9628"
            alt="Political Electoral Map"
            className="w-full h-auto max-h-[280px] object-contain"
          />
        </div>
        <div className="text-sm space-y-2">
          <h3 className="section-header mb-3">SWING STATES</h3>
          <div className="space-y-2">
            {swingStates.map((state, index) => (
              <div key={index} className="flex justify-between items-center text-white/80">
                <span>• {state.state}:</span>
                <span
                  className={`font-mono ${
                    state.lean.includes('TOSS UP')
                      ? 'text-amber-400'
                      : state.lean.includes('D')
                        ? 'text-blue-400'
                        : 'text-red-400'
                  }`}
                >
                  {state.lean}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PoliticalMap;
