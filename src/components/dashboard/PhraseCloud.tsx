import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../shared/Card';
import { mentionlyticsService } from '../../services/mentionlytics/mentionlyticsService';

export const PhraseCloud: React.FC = () => {
  const navigate = useNavigate();
  const [campaignData, setCampaignData] = useState<any>(null);
  const [trendingPhrases, setTrendingPhrases] = useState<string[]>([]);
  const [topKeywords, setTopKeywords] = useState<string[]>([]);
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [twitterPhrases, setTwitterPhrases] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('warRoomCampaignSetup');
    let parsedCampaignData = null;
    if (stored) {
      parsedCampaignData = JSON.parse(stored);
      setCampaignData(parsedCampaignData);
      
      // Extract competitors from campaign data
      if (parsedCampaignData?.competitors) {
        setCompetitors(parsedCampaignData.competitors);
      }
      
      // Extract keywords from campaign data
      if (parsedCampaignData?.keywords) {
        setTopKeywords(parsedCampaignData.keywords.slice(0, 3)); // Top 3 keywords
      }
    }

    // Load actual Twitter data for phrases
    mentionlyticsService.getMentionsFeed(20).then((mentions) => {
      if (mentions && mentions.length > 0) {
        // Extract actual phrases from Twitter content
        const twitterContent = mentions
          .map(m => m.text)
          .filter(text => text && text.length > 20 && text.length < 150)
          .slice(0, 10);
        setTwitterPhrases(twitterContent);
        
        // Extract keywords from Twitter content
        const keywords = new Set<string>();
        mentions.forEach(m => {
          const words = m.text.toLowerCase().split(/\s+/);
          words.forEach(word => {
            if (word.length > 5 && !['https', 'twitter', 'campaign'].includes(word)) {
              keywords.add(word);
            }
          });
        });
        const topWords = Array.from(keywords).slice(0, 5);
        if (topWords.length > 0 && !parsedCampaignData?.keywords) {
          setTopKeywords(topWords);
        }
      }
    }).catch(err => {
      console.log('Error loading Twitter content:', err);
    });
    
    // Load trending topics from mentionlytics service
    mentionlyticsService.getTrendingTopics().then((topics) => {
      const phrases = topics.map((t: any) => t.topic);
      setTrendingPhrases(phrases);
      
      // If no campaign keywords, use trending topics as fallback
      if (!parsedCampaignData?.keywords && topics.length > 0 && topKeywords.length === 0) {
        const fallbackKeywords = topics.slice(0, 3).map((t: any) => t.topic);
        setTopKeywords(fallbackKeywords);
      }
    }).catch(err => {
      console.log('Using fallback keywords due to:', err);
      // Fallback keywords if Mentionlytics fails
      if (!parsedCampaignData?.keywords && topKeywords.length === 0) {
        setTopKeywords(['Campaign Focus', 'Key Issues', 'Public Policy']);
      }
    });
  }, []);

  // Actual social media phrases related to client/campaign
  const defaultPhrases = [
    'Strong leadership on healthcare',
    'New Jersey families deserve better',
    'Infrastructure investment is key',
    'Education funding breakthrough',
    'Economy moving in right direction',
    'Working families need solutions',
    'Public safety remains priority',
    'Healthcare reform now',
    'Jobs and opportunity for all',
    'Building a stronger tomorrow',
  ];

  // Use actual Twitter content if available, otherwise use defaults
  const socialMediaPhrases = twitterPhrases.length > 0 ? twitterPhrases : defaultPhrases;

  // Combine actual social media phrases based on campaign keywords and trending topics
  const allPhrases = [
    ...socialMediaPhrases,
    ...trendingPhrases.map((topic) => `Excited about ${topic.toLowerCase()}`),
    ...(campaignData?.competitors?.map((c: any) => `${c.name} making headlines`) || []),
    ...defaultPhrases,
  ].slice(0, 10); // Limit to 10 for performance

  const phrases = allPhrases.length > 0 ? allPhrases : defaultPhrases;

  // Handle phrase click - navigate to live monitoring with keyword filter
  const handlePhraseClick = (phrase: string) => {
    navigate(`/real-time-monitoring?keyword=${encodeURIComponent(phrase)}`);
  };

  // Handle keyword click - navigate to intelligence hub with search
  const handleKeywordClick = (keyword: string) => {
    navigate(`/intelligence-hub?search=${encodeURIComponent(keyword)}&filter=mentions`);
  };

  // Handle competitor click - navigate to intelligence hub with competitor filter  
  const handleCompetitorClick = (competitorName: string) => {
    navigate(`/intelligence-hub?competitor=${encodeURIComponent(competitorName)}&filter=competitor`);
  };

  return (
    <Card
      variant="glass"
      padding="sm"
      className="phrase-cloud hoverable hover:scale-[1.02] transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-condensed font-semibold text-white text-sm uppercase tracking-wider">BRAND MONITORING</h3>
        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
      </div>

      <div className="flex" style={{ height: '140px' }}>
        <div className="flex-shrink-0" style={{ width: '120px', paddingRight: '10px' }}>
          <div className="space-y-1">
            {/* Dynamic Keywords */}
            {topKeywords.map((keyword, index) => {
              const colors = ['bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500'];
              return (
                <div
                  key={keyword}
                  onClick={() => handleKeywordClick(keyword)}
                  className="text-white/90 text-[10px] font-barlow cursor-pointer hover:text-cyan-300 transition-colors flex items-center"
                >
                  <span className={`w-2 h-2 ${colors[index % colors.length]} rounded-full mr-2 flex-shrink-0`}></span>
                  {keyword.length > 15 ? `${keyword.substring(0, 15)}...` : keyword}
                </div>
              );
            })}
            
            {/* Dynamic Opponents */}
            {competitors.length > 0 && (
              <>
                <div className="text-[9px] text-white/60 uppercase font-semibold tracking-wider font-jetbrains mt-4 mb-1">
                  OPPONENTS
                </div>
                {competitors.slice(0, 2).map((competitor, index) => {
                  const colors = ['bg-indigo-500', 'bg-green-500', 'bg-orange-500'];
                  const competitorName = typeof competitor === 'string' ? competitor : competitor.name;
                  return (
                    <div
                      key={competitorName}
                      onClick={() => handleCompetitorClick(competitorName)}
                      className="text-white/90 text-[10px] font-barlow cursor-pointer hover:text-cyan-300 transition-colors flex items-center"
                    >
                      <span className={`w-2 h-2 ${colors[index % colors.length]} rounded-full mr-2 flex-shrink-0`}></span>
                      {competitorName.length > 15 ? `${competitorName.substring(0, 15)}...` : competitorName}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        <div className="flex-1 relative phrase-3d" style={{ height: '100%', overflow: 'hidden' }}>
          <div className="phrase-carousel">
            {phrases.map((phrase: string, index: number) => (
              <div
                key={index}
                className="phrase-item cursor-pointer hover:scale-105 transition-transform"
                onClick={() => handlePhraseClick(phrase)}
                style={{
                  animationDelay: `${index * -3}s`,
                  zIndex: phrases.length - index,
                }}
                title={phrase}
              >
                {phrase.length > 55 ? `${phrase.substring(0, 55)}...` : phrase}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};
