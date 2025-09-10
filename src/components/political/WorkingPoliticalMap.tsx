import React, { useState } from 'react';

const WorkingPoliticalMap: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'FEC' | 'SENTIMENT' | 'FINANCE' | 'ELECTIONS'>('FEC');


  // Mock data that matches your reference screenshot
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
    <div className="relative w-full h-full">
      {/* Data Type Tabs - Clean text buttons like your reference */}
      <div className="flex justify-center items-center gap-1.5 mb-2 relative z-50" style={{ marginTop: '-12px' }}>
        <button
          onClick={() => setActiveTab('FEC')}
          className={`font-jetbrains text-xs px-2 py-1 cursor-pointer ${
            activeTab === 'FEC' ? 'text-white font-bold' : 'text-white/60 hover:text-white/80'
          }`}
        >
          FEC
        </button>
        <div className="w-px h-2 bg-white/30"></div>
        <button
          onClick={() => setActiveTab('SENTIMENT')}
          className={`font-jetbrains text-xs px-2 py-1 cursor-pointer ${
            activeTab === 'SENTIMENT' ? 'text-white font-bold' : 'text-white/60 hover:text-white/80'
          }`}
        >
          SENTIMENT
        </button>
        <div className="w-px h-2 bg-white/30"></div>
        <button
          onClick={() => setActiveTab('FINANCE')}
          className={`font-jetbrains text-xs px-2 py-1 cursor-pointer ${
            activeTab === 'FINANCE' ? 'text-white font-bold' : 'text-white/60 hover:text-white/80'
          }`}
        >
          FINANCE
        </button>
        <div className="w-px h-2 bg-white/30"></div>
        <button
          onClick={() => setActiveTab('ELECTIONS')}
          className={`font-jetbrains text-xs px-2 py-1 cursor-pointer ${
            activeTab === 'ELECTIONS' ? 'text-white font-bold' : 'text-white/60 hover:text-white/80'
          }`}
        >
          ELECTIONS
        </button>
      </div>
      
      <div className="flex w-full h-full">
        {/* Left side - Map */}
        <div className="flex-1 relative flex items-center justify-center">
          <div className="bg-black/20 rounded-lg p-4 flex items-center justify-center w-full" style={{ minHeight: '280px' }}>
            <img
              src="https://p129.p0.n0.cdn.zight.com/items/BluAK9rN/cb190d20-eec7-4e05-8969-259b1dbd9d69.png?source=client&v=6826eb6cb151acf76bf79d55b23b9628"
              alt="Political Electoral Map"
              className="w-full h-auto max-h-[280px] object-contain"
            />
          </div>
        </div>

        {/* Right side - Data Panel */}
        <div className="flex w-56 pl-6 flex-col justify-start pt-4">
          <div className="text-xs text-white/60 mb-2 uppercase font-semibold tracking-wider font-barlow text-right">
            {activeTab} DATA
          </div>
          <div className="space-y-0.5 text-right">
            {mockData.FEC.map((state) => (
              <div key={state.state} className="w-full text-right hover:bg-white/5 px-1 py-0.5 rounded transition-colors duration-200">
                <div className="text-white/90 text-sm font-barlow leading-tight">
                  {state.state}:{' '}
                  <span className="font-jetbrains font-bold text-blue-400">
                    {state.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkingPoliticalMap;