import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../shared/Card';
import { TrendingUp, TrendingDown, Users, MessageSquare } from 'lucide-react';
import { useShareOfVoice } from '../../hooks/useMentionlytics';

export const CompetitorAnalysis: React.FC = () => {
  const navigate = useNavigate();
  const { data: shareOfVoiceData, loading, dataMode } = useShareOfVoice();
  const competitors = shareOfVoiceData || [];
  
  // Handle competitor click - navigate to intelligence hub with competitor filter
  const handleCompetitorClick = (competitorName: string) => {
    navigate(`/intelligence-hub?competitor=${encodeURIComponent(competitorName)}&filter=competitor`);
  };

  return (
    <Card
      variant="glass"
      padding="sm"
      className="competitor-analysis hoverable hover:scale-[1.02] transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-condensed font-semibold text-white text-sm flex items-center gap-2 uppercase tracking-wider">
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
          COMPETITOR ANALYSIS
        </h3>
        <div className="text-xs font-jetbrains text-cyan-400">{dataMode}</div>
      </div>

      <div className="space-y-2">
        {competitors.map((competitor, index) => {
          const isLeading = index === 0;
          const growth = Math.floor(Math.random() * 30) - 10; // Random growth for demo

          return (
            <div
              key={competitor.brand}
              onClick={() => handleCompetitorClick(competitor.brand)}
              className={`relative p-2 rounded border cursor-pointer ${
                isLeading ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10'
              } hover:bg-white/10 hover:scale-[1.02] transition-all duration-200`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${isLeading ? 'bg-green-400' : 'bg-gray-400'}`}
                  ></div>
                  <span className="text-sm font-bold text-white">{competitor.brand}</span>
                  {isLeading && (
                    <span className="text-[8px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded uppercase font-jetbrains">
                      LEADING
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs font-bold text-white font-jetbrains">
                      {competitor.percentage.toFixed(2)}%
                    </div>
                    <div className="text-[9px] text-white/60">share</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-cyan-400 font-jetbrains">
                      {(competitor.reach / 1000).toFixed(0)}K
                    </div>
                    <div className="text-[9px] text-white/60">reach</div>
                  </div>
                  <div
                    className={`flex items-center gap-1 ${
                      growth > 0 ? 'text-green-400' : growth < 0 ? 'text-red-400' : 'text-gray-400'
                    }`}
                  >
                    {growth > 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : growth < 0 ? (
                      <TrendingDown className="w-3 h-3" />
                    ) : (
                      <div className="w-3 h-3"></div>
                    )}
                    <span className="text-[9px] font-semibold font-jetbrains">
                      {growth > 0 ? '+' : ''}
                      {growth}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Mini metrics row */}
              <div className="flex items-center justify-end gap-4 mt-1">
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-2.5 h-2.5 text-blue-400" />
                  <span className="text-[9px] text-white/60 font-jetbrains">
                    {competitor.mentions.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-2.5 h-2.5 text-purple-400" />
                  <span className="text-[9px] text-white/60 font-jetbrains">
                    {(competitor.engagement / 1000).toFixed(1)}K
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary footer */}
      <div className="mt-3 pt-2 border-t border-white/10">
        <div className="flex justify-between text-center">
          <div>
            <div className="text-sm font-bold text-white font-jetbrains">4</div>
            <div className="text-[9px] text-white/60 uppercase font-jetbrains">TRACKED</div>
          </div>
          <div>
            <div className="text-sm font-bold text-green-400 font-jetbrains">
              {competitors[0]?.percentage?.toFixed(2) || '35.00'}%
            </div>
            <div className="text-[9px] text-white/60 uppercase font-jetbrains">LEADING</div>
          </div>
          <div>
            <div className="text-sm font-bold text-cyan-400 font-jetbrains">
              {competitors.reduce((sum, c) => sum + c.mentions, 0).toLocaleString()}
            </div>
            <div className="text-[9px] text-white/60 uppercase font-jetbrains">TOTAL</div>
          </div>
        </div>
      </div>
    </Card>
  );
};
