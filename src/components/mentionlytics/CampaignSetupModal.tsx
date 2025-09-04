/**
 * Campaign Setup Modal - Political Context Configuration
 * Allows users to set up their campaign tracking with competitors
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Users, Target, TrendingUp, Hash, ChevronRight } from 'lucide-react';
import { Card } from '../ui/card';
import toast from 'react-hot-toast';
// Button component removed - using plain HTML buttons for consistent styling
import { mentionlyticsService } from '../../services/mentionlytics/mentionlyticsService';

interface CampaignSetupData {
  campaignName: string;
  candidateName: string;
  candidateParty: 'Democrat' | 'Republican' | 'Independent' | 'Other';
  competitors: Array<{
    name: string;
    party: string;
    isMainCompetitor: boolean;
    keywords: string[];
  }>;
  keywords: string[];
  trackingGoals: string[];
}

interface CampaignSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: CampaignSetupData) => void;
  existingData?: CampaignSetupData;
}

export const CampaignSetupModal: React.FC<CampaignSetupModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  existingData,
}) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<CampaignSetupData>(
    existingData || {
      campaignName: '',
      candidateName: '',
      candidateParty: 'Republican',
      competitors: [],
      keywords: [],
      trackingGoals: [],
    }
  );

  const [newCompetitor, setNewCompetitor] = useState({ name: '', party: 'Democrat' });
  const [availableKeywords, setAvailableKeywords] = useState<string[]>([]);
  const [loadingKeywords, setLoadingKeywords] = useState(false);

  const partyColors = {
    Democrat: 'bg-blue-500',
    Republican: 'bg-red-500',
    Independent: 'bg-purple-500',
    Other: 'bg-gray-500',
  };

  // Load available keywords when step 3 is reached
  useEffect(() => {
    console.log('🔍 Step changed to:', step);
    console.log('🔍 Current availableKeywords length:', availableKeywords.length);
    console.log('🔍 Current availableKeywords:', availableKeywords);

    if ((step === 3 || step === 4) && availableKeywords.length === 0) {
      console.log('🔍 Loading keywords for step', step);
      loadAvailableKeywords();
    }
  }, [step]);

  const loadAvailableKeywords = async () => {
    console.log('🔍 loadAvailableKeywords called');
    setLoadingKeywords(true);
    try {
      const keywords = await mentionlyticsService.getAvailableKeywords();
      console.log('🔍 Keywords loaded from service:', keywords);
      setAvailableKeywords(keywords);
    } catch (error) {
      console.error('🔍 Error loading keywords:', error);
      // Fallback keywords if API fails
      const fallbackKeywords = [
        'Healthcare Reform',
        'Economic Policy',
        'Infrastructure',
        'Education',
        'Climate Change',
        'Immigration',
        'Tax Policy',
        'Gun Control',
        'Foreign Policy',
        'Job Creation',
      ];
      console.log('🔍 Using fallback keywords:', fallbackKeywords);
      setAvailableKeywords(fallbackKeywords);
    } finally {
      setLoadingKeywords(false);
      // Note: This logs the old state due to closure, not the newly set state
    }
  };

  const handleAddCompetitor = () => {
    console.log('🔍 Adding competitor:', newCompetitor);
    if (newCompetitor.name) {
      const updatedData = {
        ...data,
        competitors: [
          ...data.competitors,
          {
            ...newCompetitor,
            isMainCompetitor: data.competitors.length === 0,
            keywords: [],
          },
        ],
      };
      console.log('🔍 Updated data with new competitor:', updatedData);
      setData(updatedData);
      setNewCompetitor({ name: '', party: 'Democrat' });
    }
  };

  // Keyword handling is now done directly in the onChange event of the select

  const handleComplete = () => {
    console.log('🎯 Campaign Setup Complete:', data);
    console.log('🎯 Calling onComplete with:', data);
    console.log('🎯 Calling onClose...');

    // Save to localStorage for persistence
    localStorage.setItem('warRoomCampaignSetup', JSON.stringify(data));

    // Also save to a format the dashboard can easily read
    localStorage.setItem(
      'warRoomActiveCampaign',
      JSON.stringify({
        name: data.campaignName,
        candidate: data.candidateName,
        party: data.candidateParty,
        keywords: data.keywords,
        competitors: data.competitors.map((c) => ({
          name: c.name,
          party: c.party,
          keywords: c.keywords || [],
        })),
        setupDate: new Date().toISOString(),
        isActive: true,
      })
    );

    // Close modal and pass data to parent
    try {
      onComplete(data);
      console.log('🎯 onComplete called successfully');
    } catch (error) {
      console.error('🚫 Error calling onComplete:', error);
    }

    try {
      onClose();
      console.log('🎯 onClose called successfully');
    } catch (error) {
      console.error('🚫 Error calling onClose:', error);
    }

    // Show success feedback with modern toast
    toast.success('🎯 Campaign setup completed successfully!', {
      duration: 4000,
      style: {
        background: '#22c55e',
        color: '#fff',
        fontWeight: '600',
        zIndex: 9999,
      },
      position: 'top-center',
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="bg-gray-100 border-gray-300 p-8">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {data.campaignName ? `${data.campaignName} - Setup` : 'Client Campaign Setup'}
                  </h2>
                  <p className="text-gray-700 mt-1">
                    Configure client's political tracking campaign
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center mb-8">
                {[1, 2, 3, 4].map((s) => (
                  <React.Fragment key={s}>
                    <div
                      className={`flex-1 h-2 rounded-full transition-all ${
                        s <= step ? 'bg-red-500' : 'bg-gray-300'
                      }`}
                    />
                    {s < 4 && <div className="w-2" />}
                  </React.Fragment>
                ))}
              </div>

              {/* Step 1: Your Campaign */}
              {step === 1 && (
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <User className="w-12 h-12 text-gray-700 mx-auto mb-2" />
                    <h3 className="text-xl font-semibold text-gray-900">Client's Campaign</h3>
                  </div>

                  <div>
                    <label className="block text-gray-800 mb-2 font-mono uppercase text-xs">
                      Campaign Name
                    </label>
                    <input
                      type="text"
                      value={data.campaignName}
                      onChange={(e) => setData({ ...data, campaignName: e.target.value })}
                      placeholder="e.g., Ciattarelli 2025 Campaign"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:border-red-400 focus:outline-none mb-4"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-800 mb-2 font-mono uppercase text-xs">
                      Candidate Name
                    </label>
                    <input
                      type="text"
                      value={data.candidateName}
                      onChange={(e) => setData({ ...data, candidateName: e.target.value })}
                      placeholder="e.g., Jack Ciattarelli"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:border-blue-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-800 mb-2 font-mono uppercase text-xs">
                      Party Affiliation
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['Democrat', 'Republican', 'Independent', 'Other'] as const).map(
                        (party) => (
                          <button
                            key={party}
                            onClick={() => setData({ ...data, candidateParty: party })}
                            className={`p-3 rounded-lg border transition-all ${
                              data.candidateParty === party
                                ? `${partyColors[party]} border-transparent text-white`
                                : 'bg-white border-gray-300 text-gray-700 hover:border-gray-500'
                            }`}
                          >
                            {party}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    disabled={!data.campaignName || !data.candidateName}
                    className="w-full btn-primary-success flex items-center justify-center"
                  >
                    Next: Add Competitors
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </button>
                </motion.div>
              )}

              {/* Step 2: Competitors */}
              {step === 2 && (
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <Users className="w-12 h-12 text-gray-700 mx-auto mb-2" />
                    <h3 className="text-xl font-semibold text-gray-900">Track Competitors</h3>
                    <p className="text-gray-700 text-sm mt-1">
                      Add up to 2 main competitors (Mentionlytics structure)
                    </p>
                  </div>

                  {/* Existing Competitors */}
                  {data.competitors.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {data.competitors.map((comp, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-300"
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-3 h-3 rounded-full ${partyColors[comp.party as keyof typeof partyColors]}`}
                            />
                            <span className="text-gray-900">{comp.name}</span>
                            {comp.isMainCompetitor && (
                              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                                Main Rival
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() =>
                              setData({
                                ...data,
                                competitors: data.competitors.filter((_, i) => i !== idx),
                              })
                            }
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add New Competitor */}
                  {data.competitors.length === 0 && (
                    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-4">
                      <p className="text-yellow-800 font-semibold text-center">
                        ⚠️ You must add at least one competitor to continue
                      </p>
                      <p className="text-yellow-700 text-sm text-center mt-1">
                        Enter competitor name below and click "Add"
                      </p>
                    </div>
                  )}

                  {data.competitors.length < 2 && (
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        value={newCompetitor.name}
                        onChange={(e) =>
                          setNewCompetitor({ ...newCompetitor, name: e.target.value })
                        }
                        placeholder="e.g., Mikie Sherrill"
                        className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:border-red-400 focus:outline-none"
                      />
                      <select
                        value={newCompetitor.party}
                        onChange={(e) =>
                          setNewCompetitor({ ...newCompetitor, party: e.target.value })
                        }
                        className="war-room-select px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-red-400 focus:outline-none"
                      >
                        <option value="Democrat">Democrat</option>
                        <option value="Republican">Republican</option>
                        <option value="Independent">Independent</option>
                        <option value="Other">Other</option>
                      </select>
                      <button onClick={handleAddCompetitor} className="btn-primary-alert">
                        Add
                      </button>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <button onClick={() => setStep(1)} className="flex-1 btn-primary-neutral">
                      Back
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      disabled={data.competitors.length === 0}
                      className="flex-1 btn-primary-success disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      Next: Keywords
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Keywords */}
              {step === 3 && (
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <Hash className="w-12 h-12 text-gray-700 mx-auto mb-2" />
                    <h3 className="text-xl font-semibold text-gray-900">Tracking Keywords</h3>
                    <p className="text-gray-700 text-sm mt-1">Add up to 3 keywords to track</p>
                  </div>

                  {/* Existing Keywords */}
                  {data.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {data.keywords.map((keyword, idx) => (
                        <span
                          key={idx}
                          className="px-4 py-2 bg-gray-200 border border-gray-400 rounded-full text-gray-800 flex items-center space-x-2"
                        >
                          <Hash className="w-4 h-4" />
                          <span>{keyword}</span>
                          <button
                            onClick={() =>
                              setData({
                                ...data,
                                keywords: data.keywords.filter((_, i) => i !== idx),
                              })
                            }
                            className="ml-2 hover:text-red-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Add New Keyword */}
                  {data.keywords.length < 3 && (
                    <div className="space-y-3">
                      {loadingKeywords ? (
                        <div className="flex items-center justify-center py-6">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                          <span className="ml-3 text-gray-700">Loading keywords...</span>
                        </div>
                      ) : (
                        <div className="flex space-x-3">
                          <select
                            className="war-room-select flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-red-400 focus:outline-none"
                            onChange={(e) => {
                              if (e.target.value && !data.keywords.includes(e.target.value)) {
                                setData({
                                  ...data,
                                  keywords: [...data.keywords, e.target.value],
                                });
                                e.target.value = '';
                              }
                            }}
                          >
                            <option value="">Select a keyword to track...</option>
                            {availableKeywords
                              .filter((keyword) => !data.keywords.includes(keyword))
                              .map((keyword) => (
                                <option key={keyword} value={keyword}>
                                  {keyword}
                                </option>
                              ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="bg-gray-200 border border-gray-300 rounded-lg p-4">
                    <p className="text-gray-900 text-sm">
                      💡 <strong>Keywords from Mentionlytics Account</strong>
                      <br />
                      These trending keywords are pulled directly from your Mentionlytics dashboard.
                      They will be tracked across all social media platforms and news sources.
                    </p>
                  </div>

                  <div className="flex space-x-3">
                    <button onClick={() => setStep(2)} className="flex-1 btn-primary-neutral">
                      Back
                    </button>
                    <button
                      onClick={() => setStep(4)}
                      disabled={data.keywords.length === 0}
                      className="flex-1 btn-primary-success disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      Next: Competitor Keywords
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Competitor Keywords */}
              {step === 4 && (
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <Target className="w-12 h-12 text-gray-700 mx-auto mb-2" />
                    <h3 className="text-xl font-semibold text-gray-900">Competitor Keywords</h3>
                    <p className="text-gray-700 text-sm mt-1">
                      Track competitor-specific keywords (up to 2)
                    </p>
                  </div>

                  {/* Competitor Keywords Section */}
                  {console.log('🔍 STEP 4 DEBUG:')}
                  {console.log('  - Competitors array:', data.competitors)}
                  {console.log('  - Competitors length:', data.competitors.length)}
                  {console.log('  - Available keywords:', availableKeywords)}
                  {data.competitors.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                      <p className="text-gray-900 text-sm mb-3">
                        ⚠️ <strong>No competitors added yet</strong>
                      </p>
                      <p className="text-gray-600 text-sm">
                        Please go back and add at least one competitor to track their keywords.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Competitors keyword selection */}
                      {data.competitors.map((competitor, idx) => (
                        <div key={idx} className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <div
                              className={`w-3 h-3 rounded-full ${partyColors[competitor.party as keyof typeof partyColors].split(' ')[0]}`}
                            />
                            <h4 className="text-gray-900 font-medium">{competitor.name}</h4>
                            {competitor.isMainCompetitor && (
                              <span className="text-xs bg-red-500 text-white px-2 py-1 rounded">
                                Main Rival
                              </span>
                            )}
                          </div>
                          <div className="flex space-x-3">
                            <select
                              className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-red-500 focus:outline-none"
                              onChange={(e) => {
                                if (
                                  e.target.value &&
                                  !competitor.keywords?.includes(e.target.value)
                                ) {
                                  const updatedCompetitors = [...data.competitors];
                                  updatedCompetitors[idx] = {
                                    ...competitor,
                                    keywords: [...(competitor.keywords || []), e.target.value],
                                  };
                                  setData({ ...data, competitors: updatedCompetitors });
                                  e.target.value = '';
                                }
                              }}
                            >
                              <option value="">Select keyword for {competitor.name}...</option>
                              {availableKeywords
                                .filter(
                                  (keyword) =>
                                    !competitor.keywords?.includes(keyword) &&
                                    !data.keywords.includes(keyword)
                                )
                                .map((keyword) => (
                                  <option key={keyword} value={keyword}>
                                    {keyword}
                                  </option>
                                ))}
                            </select>
                            <button
                              className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded-lg font-semibold"
                              onClick={() => {
                                const updatedCompetitors = [...data.competitors];
                                updatedCompetitors[idx] = { ...competitor, keywords: [] };
                                setData({ ...data, competitors: updatedCompetitors });
                              }}
                            >
                              Clear
                            </button>
                          </div>

                          {/* Show selected competitor keywords */}
                          {competitor.keywords && competitor.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {competitor.keywords.map((keyword, keyIdx) => (
                                <span
                                  key={keyIdx}
                                  className="px-3 py-1 bg-red-100 border border-red-300 rounded-full text-red-700 flex items-center space-x-2 text-sm"
                                >
                                  <span>{keyword}</span>
                                  <button
                                    onClick={() => {
                                      const updatedCompetitors = [...data.competitors];
                                      updatedCompetitors[idx] = {
                                        ...competitor,
                                        keywords:
                                          competitor.keywords?.filter((_, i) => i !== keyIdx) || [],
                                      };
                                      setData({ ...data, competitors: updatedCompetitors });
                                    }}
                                    className="hover:text-red-900"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  )}

                  {data.competitors.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-gray-700 text-sm">
                        🎯 <strong>Keywords from Mentionlytics Account</strong>
                        <br />
                        Select competitor-specific keywords to monitor their messaging and campaign
                        focus. These are pulled from your Mentionlytics dashboard.
                      </p>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <button onClick={() => setStep(3)} className="flex-1 btn-primary-neutral">
                      Back
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('🔄 Complete Setup button clicked!', { event: e, data });
                        handleComplete();
                      }}
                      onMouseDown={() => console.log('🔄 Complete Setup button mouse down!')}
                      onMouseUp={() => console.log('🔄 Complete Setup button mouse up!')}
                      className="flex-1 btn-primary-success flex items-center justify-center"
                    >
                      Complete Setup
                      <TrendingUp className="w-5 h-5 ml-2" />
                    </button>
                  </div>
                </motion.div>
              )}
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CampaignSetupModal;
