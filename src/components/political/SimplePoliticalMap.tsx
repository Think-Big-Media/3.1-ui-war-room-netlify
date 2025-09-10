import React, { useState } from 'react';
import Card from '../shared/Card';

const SimplePoliticalMap: React.FC = () => {
  console.log('🔴 SIMPLE POLITICAL MAP IS RENDERING!!!');
  const [activeTab, setActiveTab] = useState<'FEC' | 'SENTIMENT' | 'FINANCE' | 'ELECTIONS'>('FEC');

  const mockData = {
    FEC: [
      { state: 'California', value: '$389.5M' },
      { state: 'Texas', value: '$238.5M' },  
      { state: 'New York', value: '$189.9M' },
      { state: 'Florida', value: '$120.2M' },
      { state: 'Pennsylvania', value: '$79.5M' },
      { state: 'Virginia', value: '$68.3M' },
      { state: 'Michigan', value: '$59.6M' }
    ]
  };

  return (
    <Card variant="glass" padding="md" className="political-map hoverable">
      <div className="relative w-full h-full bg-purple-500 border-4 border-yellow-400">
        <div className="text-white text-4xl font-bold text-center p-4 bg-red-600">
          🟢 SIMPLE POLITICAL MAP WORKING 🟢
        </div>
        {/* Data Type Tabs */}
        <div className="flex justify-center items-center gap-1.5 mb-4 relative z-50">
          <button
            onClick={() => setActiveTab('FEC')}
            className={`font-jetbrains text-sm px-3 py-2 cursor-pointer transition-colors ${
              activeTab === 'FEC' ? 'text-white font-bold bg-white/10' : 'text-white/60 hover:text-white/80'
            }`}
          >
            FEC
          </button>
          <div className="w-px h-4 bg-white/30"></div>
          <button
            onClick={() => setActiveTab('SENTIMENT')}
            className={`font-jetbrains text-sm px-3 py-2 cursor-pointer transition-colors ${
              activeTab === 'SENTIMENT' ? 'text-white font-bold bg-white/10' : 'text-white/60 hover:text-white/80'
            }`}
          >
            SENTIMENT
          </button>
          <div className="w-px h-4 bg-white/30"></div>
          <button
            onClick={() => setActiveTab('FINANCE')}
            className={`font-jetbrains text-sm px-3 py-2 cursor-pointer transition-colors ${
              activeTab === 'FINANCE' ? 'text-white font-bold bg-white/10' : 'text-white/60 hover:text-white/80'
            }`}
          >
            FINANCE
          </button>
          <div className="w-px h-4 bg-white/30"></div>
          <button
            onClick={() => setActiveTab('ELECTIONS')}
            className={`font-jetbrains text-sm px-3 py-2 cursor-pointer transition-colors ${
              activeTab === 'ELECTIONS' ? 'text-white font-bold bg-white/10' : 'text-white/60 hover:text-white/80'
            }`}
          >
            ELECTIONS
          </button>
        </div>
        
        <div className="flex w-full h-full">
          {/* Left side - Basic US Map */}
          <div className="flex-1 relative">
            <div className="bg-black/20 rounded-lg p-4 flex items-center justify-center" style={{minHeight: '300px'}}>
              <img
                src="https://p129.p0.n0.cdn.zight.com/items/BluAK9rN/cb190d20-eec7-4e05-8969-259b1dbd9d69.png?source=client&v=6826eb6cb151acf76bf79d55b23b9628"
                alt="Political Electoral Map"
                className="w-full h-auto max-h-[300px] object-contain"
              />
            </div>
          </div>

          {/* Right side - Data Panel */}
          <div className="w-56 pl-6 flex-col justify-start pt-4">
            <div className="text-sm text-white/60 mb-3 uppercase font-semibold tracking-wider text-right">
              {activeTab} DATA
            </div>
            <div className="space-y-1 text-right">
              {mockData.FEC.map((item, i) => (
                <div key={i} className="text-white/90 text-sm">
                  {item.state}: <span className="text-blue-400 font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SimplePoliticalMap;