import type React from 'react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Upload,
  Search,
  Filter,
  FileText,
  Brain,
  MessageSquare,
  Download,
  Eye,
  Plus,
  Clock,
  Tag,
  File,
  Image,
  Link,
  Zap,
  BarChart3,
  TrendingUp,
  Users,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import PageLayout from '../components/shared/PageLayout';
import Card from '../components/shared/Card';
import CustomDropdown from '../components/shared/CustomDropdown';
import DocumentViewerModal from '../components/shared/DocumentViewerModal';
import {
  useSentimentAnalysis,
  useGeographicMentions,
  useTopInfluencers,
  useMentionlyticsMode,
} from '../hooks/useMentionlytics';
import { analyzeDocument, searchKnowledgeBase } from '../api/intelligence';
import { useNotifications } from '../components/shared/NotificationSystem';

interface IntelligenceFile {
  id: string;
  title: string;
  type: 'polling' | 'field-report' | 'opposition-research' | 'messaging' | 'news-media';
  uploadDate: string;
  size: string;
  tags: string[];
  summary?: string;
}

interface ChatQuery {
  id: string;
  query: string;
  response: string;
  timestamp: string;
  topic: string;
}

const IntelligenceHub: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedFile, setSelectedFile] = useState<IntelligenceFile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [uploadCategory, setUploadCategory] = useState('auto-detect');
  const [uploadTags, setUploadTags] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');
  const [includeInAI, setIncludeInAI] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Get Mentionlytics data
  const {
    data: sentimentData,
    loading: sentimentLoading,
    dataMode: sentimentMode,
  } = useSentimentAnalysis();
  const { data: geographicData, loading: geoLoading, dataMode: geoMode } = useGeographicMentions();
  const {
    data: influencerData,
    loading: influencerLoading,
    dataMode: influencerMode,
  } = useTopInfluencers();
  const { mode: dataMode } = useMentionlyticsMode();
  const { showSuccess, showError } = useNotifications();

  const isLoadingData = sentimentLoading || geoLoading || influencerLoading;

  // Parse query parameters
  const urlFilter = searchParams.get('filter');
  const urlLocation = searchParams.get('location');
  const urlCategory = searchParams.get('category');
  const urlTopic = searchParams.get('topic');
  const urlSearch = searchParams.get('search');

  // Update search term from URL on mount
  useEffect(() => {
    if (urlSearch) {
      setSearchTerm(urlSearch);
    }
  }, [urlSearch]);

  // Debounced search functionality
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchKnowledgeBase(searchTerm);
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Dropdown options
  const filterOptions = [
    {
      value: 'all',
      label: 'All Files',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    { value: 'polling', label: 'Polling', icon: <Brain className="w-4 h-4" /> },
    {
      value: 'field-report',
      label: 'Field Reports',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      value: 'opposition-research',
      label: 'Opposition Research',
      icon: <Eye className="w-4 h-4" />,
    },
    {
      value: 'messaging',
      label: 'Messaging Assets',
      icon: <MessageSquare className="w-4 h-4" />,
    },
    {
      value: 'news-media',
      label: 'News & Media',
      icon: <Link className="w-4 h-4" />,
    },
  ];

  const intelligenceFiles: IntelligenceFile[] = [
    {
      id: '1',
      title: 'District 3 Polling Report - Q4 2024',
      type: 'polling',
      uploadDate: '2 hours ago',
      size: '2.4 MB',
      tags: ['District 3', 'Polling', 'Q4 2024'],
      summary: 'Voter sentiment analysis showing 12% improvement in favorability ratings',
    },
    {
      id: '2',
      title: 'Opposition Research - Candidate Profile',
      type: 'opposition-research',
      uploadDate: '1 day ago',
      size: '5.1 MB',
      tags: ['Opposition', 'Research', 'Campaign'],
      summary: 'Comprehensive background analysis including policy positions and voting record',
    },
    {
      id: '3',
      title: 'Messaging Framework - Healthcare Policy',
      type: 'messaging',
      uploadDate: '3 days ago',
      size: '892 KB',
      tags: ['Healthcare', 'Messaging', 'Policy'],
      summary: 'Strategic messaging guidelines for healthcare policy discussions',
    },
    {
      id: '4',
      title: 'Field Report - Suburban Canvassing',
      type: 'field-report',
      uploadDate: '1 week ago',
      size: '1.3 MB',
      tags: ['Field', 'Canvassing', 'Suburban'],
      summary: 'Door-to-door campaign results from suburban neighborhoods',
    },
  ];

  const chatQueries: ChatQuery[] = [
    {
      id: '1',
      query: "What's the current sentiment trend in swing districts?",
      response:
        'Based on recent polling data, sentiment has improved by 8% in key swing districts over the past month...',
      timestamp: '30 minutes ago',
      topic: 'Sentiment Analysis',
    },
    {
      id: '2',
      query: 'Summarize opposition research on healthcare stance',
      response:
        'Opposition candidate has taken 3 different positions on healthcare in the past year...',
      timestamp: '2 hours ago',
      topic: 'Opposition Research',
    },
    {
      id: '3',
      query: 'Generate press release for education policy announcement',
      response:
        'FOR IMMEDIATE RELEASE: [Candidate Name] Announces Comprehensive Education Reform Plan...',
      timestamp: '1 day ago',
      topic: 'Press Release',
    },
  ];

  const filteredFiles = intelligenceFiles.filter((file) => {
    const matchesSearch =
      file.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterType === 'all' || file.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'polling':
        return <Brain className="w-5 h-5 text-blue-400" />;
      case 'field-report':
        return <FileText className="w-5 h-5 text-green-400" />;
      case 'opposition-research':
        return <Eye className="w-5 h-5 text-red-400" />;
      case 'messaging':
        return <MessageSquare className="w-5 h-5 text-purple-400" />;
      case 'news-media':
        return <Link className="w-5 h-5 text-orange-400" />;
      default:
        return <File className="w-5 h-5 text-white/70" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'polling':
        return 'Polling';
      case 'field-report':
        return 'Field Report';
      case 'opposition-research':
        return 'Opposition Research';
      case 'messaging':
        return 'Messaging';
      case 'news-media':
        return 'News & Media';
      default:
        return 'Unknown';
    }
  };

  // File upload handlers
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    await handleFileUpload(file);
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const analysis = await analyzeDocument(file);
      
      // Add the new file to the intelligence files list
      const newFile: IntelligenceFile = {
        id: Date.now().toString(),
        title: file.name,
        type: uploadCategory === 'auto-detect' ? 'polling' : uploadCategory as any,
        uploadDate: 'Just now',
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        tags: uploadTags.split(',').map(t => t.trim()).filter(Boolean),
        summary: `Analysis completed. File contains ${analysis.pages || 'unknown'} pages.`
      };
      
      // In a real app, you'd update a global state or refetch the files list
      console.log('File uploaded successfully:', newFile);
      showSuccess('File uploaded successfully!', `${file.name} has been analyzed and added to your knowledge library.`);
      
      // Reset form
      setUploadCategory('auto-detect');
      setUploadTags('');
      setUploadNotes('');
      setIncludeInAI(true);
      
    } catch (error) {
      console.error('Upload failed:', error);
      showError('Upload failed', 'Please check your file and try again. Supported formats: PDF, DOCX, TXT, CSV, images.');
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  // PDF Download handler
  const handleDownloadFile = async (file: IntelligenceFile) => {
    try {
      // In a real implementation, this would fetch the file from the server
      const response = await fetch(`/api/v1/intelligence/files/${file.id}/download`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = file.title;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      showError('Download failed', 'Unable to download the file. Please try again later.');
    }
  };

  // Chat History handlers
  const handleReopenChat = (query: ChatQuery) => {
    // Navigate to main chat interface with the query pre-filled
    const chatInput = document.querySelector('[placeholder*="Ask War Room"]') as HTMLInputElement;
    if (chatInput) {
      chatInput.value = query.query;
      chatInput.focus();
    }
    console.log('Reopening chat with query:', query.query);
  };

  const handleCopyChat = async (query: ChatQuery) => {
    try {
      const textToCopy = `Query: ${query.query}\n\nResponse: ${query.response}`;
      await navigator.clipboard.writeText(textToCopy);
      showSuccess('Copied to clipboard!', 'Chat conversation has been copied to your clipboard.');
    } catch (error) {
      console.error('Copy failed:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = `Query: ${query.query}\n\nResponse: ${query.response}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showSuccess('Copied to clipboard!', 'Chat conversation has been copied to your clipboard.');
    }
  };

  return (
    <div className="page-intelligence" data-route="intelligence-hub">
      <PageLayout
        pageTitle="Intelligence"
        placeholder="Ask War Room about campaign intelligence..."
      >
        {/* Data Mode Indicator */}
        <div className="fixed top-20 right-4 z-40">
          <div
            className={`px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-sm ${
              dataMode === 'MOCK'
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                : 'bg-green-500/20 text-green-400 border border-green-500/30'
            }`}
          >
            {dataMode} DATA
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-6">
          {[
            { id: 'chat', label: 'Chat History', icon: MessageSquare },
            { id: 'upload', label: 'Upload Intelligence', icon: Upload },
            { id: 'library', label: 'Knowledge Library', icon: Search },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 text-sm rounded-lg transition-all duration-200 font-medium ${
                activeTab === tab.id
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content (Two-thirds) */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Upload Intelligence Tab */}
            {activeTab === 'upload' && (
              <Card
                className="hoverable hover:scale-[1.02] transition-all duration-200"
                variant="glass"
                padding="md"
              >
                <h3 className="section-header mb-4 tracking-wide ml-2">UPLOAD INTELLIGENCE</h3>

                {/* Drag & Drop Area */}
                <div 
                  className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 transition-all duration-200 ${
                    dragOver 
                      ? 'border-blue-400 bg-blue-400/10' 
                      : 'border-white/30 hover:border-white/50'
                  } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {uploading ? (
                    <>
                      <div className="w-12 h-12 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-white/70 mb-2">Uploading and analyzing...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-white/50 mx-auto mb-4" />
                      <p className="text-white/70 mb-2">Drag & drop files here or click to browse</p>
                      <p className="text-white/50 text-sm">
                        Supports: .pdf, .docx, .txt, .csv, images, URLs
                      </p>
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e.target.files)}
                        accept=".pdf,.docx,.txt,.csv,image/*"
                        multiple={false}
                      />
                      <button 
                        className="mt-4 btn-primary"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        disabled={uploading}
                      >
                        Choose Files
                      </button>
                    </>
                  )}
                </div>

                {/* File Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1 ml-1.5">
                      Category
                    </label>
                    <CustomDropdown
                      value={uploadCategory}
                      onChange={(value) => setUploadCategory(value)}
                      options={[
                        { value: 'auto-detect', label: 'Auto-detect' },
                        { value: 'polling', label: 'Polling' },
                        { value: 'field-reports', label: 'Field Reports' },
                        { value: 'opposition-research', label: 'Opposition Research' },
                        { value: 'messaging-assets', label: 'Messaging Assets' },
                        { value: 'news-media', label: 'News & Media' },
                      ]}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1 ml-1.5">Tags</label>
                    <input
                      type="text"
                      placeholder="District, issue, audience, date..."
                      value={uploadTags}
                      onChange={(e) => setUploadTags(e.target.value)}
                      className="w-full bg-black/20 border border-white/30 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/50"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-white/80 mb-1 ml-1.5">
                    Add Notes
                  </label>
                  <textarea
                    placeholder="Optional context (e.g., 'Use this in next debate prep')"
                    value={uploadNotes}
                    onChange={(e) => setUploadNotes(e.target.value)}
                    className="w-full bg-black/20 border border-white/30 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/50 h-20 resize-none"
                  />
                </div>

                <div className="mt-4 flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="ai-memory" 
                    checked={includeInAI}
                    onChange={(e) => setIncludeInAI(e.target.checked)}
                    className="rounded" 
                  />
                  <label htmlFor="ai-memory" className="text-white/80">
                    Include in War Room AI memory
                  </label>
                </div>
              </Card>
            )}

            {/* Knowledge Library Tab */}
            {activeTab === 'library' && (
              <div className="space-y-4">
                {/* Filter & Search */}
                <Card className="hoverable hover:scale-[1.02] transition-all duration-200" variant="glass" padding="sm">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center space-x-2">
                      {searching ? (
                        <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Search className="w-5 h-5 text-white/50" />
                      )}
                      <input
                        type="text"
                        placeholder="Search knowledge base..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent border-none text-white placeholder-white/50 focus:outline-none"
                      />
                      {searchTerm && (
                        <span className="text-xs text-white/50 font-mono">
                          {searchResults.length} results
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Filter className="w-4 h-4 text-white/50" />
                      <CustomDropdown
                        value={filterType}
                        onChange={setFilterType}
                        options={filterOptions}
                        className="min-w-[160px]"
                      />
                    </div>
                  </div>
                </Card>

                {/* Files List */}
                <div className="space-y-4">
                  {filteredFiles.map((file) => (
                    <Card
                      key={file.id}
                      className="hoverable hover:scale-[1.02] transition-all duration-200 cursor-pointer"
                      variant="glass"
                      padding="md"
                      onClick={() => setSelectedFile(file)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          <div className="flex-shrink-0 mt-1">
                            {getFileIcon(file.type)}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-white mb-2">{file.title}</h4>
                            <p className="text-sm text-white/70 mb-3">{file.summary}</p>
                            <div className="flex items-center space-x-4 mb-3 text-xs text-white/60">
                              <span className="font-mono uppercase">{getTypeLabel(file.type)}</span>
                              <span className="font-mono uppercase">{file.uploadDate}</span>
                              <span className="font-mono uppercase">{file.size}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {file.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="bg-white/20 text-white/80 px-2 py-1 rounded text-xs font-mono uppercase"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button 
                            className="btn-secondary-action"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFile(file);
                            }}
                          >
                            View
                          </button>
                          <button 
                            className="btn-secondary-neutral"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadFile(file);
                            }}
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Chat History Tab */}
            {activeTab === 'chat' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="section-header tracking-wide ml-2">CHAT HISTORY & SAVED QUERIES</h3>
                  <div className="flex items-center space-x-2">
                    <button className="text-sm text-white/70 hover:text-white font-mono uppercase">My Chats</button>
                    <span className="text-white/50">|</span>
                    <button className="text-sm text-white/70 hover:text-white font-mono uppercase">Team Chats</button>
                  </div>
                </div>

                {chatQueries.map((query) => (
                  <Card
                    key={query.id}
                    className="hoverable hover:scale-[1.02] transition-all duration-200"
                    variant="glass"
                    padding="md"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-white/70 font-mono uppercase">{query.topic}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-white/60">
                        <Clock className="w-3 h-3" />
                        <span className="font-mono uppercase">{query.timestamp}</span>
                      </div>
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-3">{query.query}</h4>
                    <p className="text-sm text-white/70 mb-4 leading-relaxed">{query.response}</p>
                    <div className="flex items-center space-x-2">
                      <button 
                        className="btn-secondary-action"
                        onClick={() => handleReopenChat(query)}
                      >
                        Reopen
                      </button>
                      <button 
                        className="btn-secondary-neutral"
                        onClick={() => handleCopyChat(query)}
                      >
                        Copy
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Analytics Sidebar (One-third) */}
          <div className="space-y-4">
            {/* Sentiment Analytics */}
            <Card variant="glass" padding="md" className="hoverable">
              <h3 className="section-header mb-4 tracking-wide ml-2">SENTIMENT ANALYTICS</h3>
              {sentimentLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-black/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white/70 font-mono uppercase">Positive</span>
                      <span className="text-xl font-bold text-emerald-400 font-barlow-condensed" style={{fontWeight: 400}}>
                        {sentimentData?.positive || 847}
                      </span>
                    </div>
                    <div className="text-xs text-white/50 font-mono uppercase">
                      {sentimentData ? Math.round((sentimentData.positive / sentimentData.total) * 100) : 52}% of total
                    </div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white/70 font-mono uppercase">Negative</span>
                      <span className="text-xl font-bold text-rose-400 font-barlow-condensed" style={{fontWeight: 400}}>
                        {sentimentData?.negative || 423}
                      </span>
                    </div>
                    <div className="text-xs text-white/50 font-mono uppercase">
                      {sentimentData ? Math.round((sentimentData.negative / sentimentData.total) * 100) : 26}% of total
                    </div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white/70 font-mono uppercase">Neutral</span>
                      <span className="text-xl font-bold text-slate-400 font-barlow-condensed" style={{fontWeight: 400}}>
                        {sentimentData?.neutral || 356}
                      </span>
                    </div>
                    <div className="text-xs text-white/50 font-mono uppercase">
                      {sentimentData ? Math.round((sentimentData.neutral / sentimentData.total) * 100) : 22}% of total
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Geographic Distribution */}
            <Card variant="glass" padding="md" className="hoverable">
              <h3 className="section-header mb-4 tracking-wide ml-2">GEOGRAPHIC DISTRIBUTION</h3>
              {geoLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {geographicData?.slice(0, 5).map((location, index) => (
                    <div key={index} className="bg-black/20 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-white font-mono uppercase">{location.state}</span>
                        <span className="text-lg font-bold text-purple-400 font-barlow-condensed" style={{fontWeight: 400}}>
                          {location.mentions}
                        </span>
                      </div>
                      <div className="text-xs text-white/50 font-mono uppercase">
                        MENTIONS
                      </div>
                    </div>
                  )) || [
                    <div key="mock-1" className="bg-black/20 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-white font-mono uppercase">PENNSYLVANIA</span>
                        <span className="text-lg font-bold text-purple-400 font-barlow-condensed" style={{fontWeight: 400}}>1,247</span>
                      </div>
                      <div className="text-xs text-white/50 font-mono uppercase">MENTIONS</div>
                    </div>,
                    <div key="mock-2" className="bg-black/20 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-white font-mono uppercase">MICHIGAN</span>
                        <span className="text-lg font-bold text-purple-400 font-barlow-condensed" style={{fontWeight: 400}}>892</span>
                      </div>
                      <div className="text-xs text-white/50 font-mono uppercase">MENTIONS</div>
                    </div>,
                    <div key="mock-3" className="bg-black/20 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-white font-mono uppercase">WISCONSIN</span>
                        <span className="text-lg font-bold text-purple-400 font-barlow-condensed" style={{fontWeight: 400}}>634</span>
                      </div>
                      <div className="text-xs text-white/50 font-mono uppercase">MENTIONS</div>
                    </div>
                  ]}
                </div>
              )}
            </Card>

            {/* Top Influencers */}
            <Card variant="glass" padding="md" className="hoverable">
              <h3 className="section-header mb-4 tracking-wide ml-2">TOP INFLUENCERS</h3>
              {influencerLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {influencerData?.slice(0, 5).map((influencer, index) => (
                    <div key={index} className="bg-black/20 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-white font-mono uppercase">@{influencer.username}</span>
                        <span className="text-lg font-bold text-cyan-400 font-barlow-condensed" style={{fontWeight: 400}}>
                          {(influencer.followers / 1000).toFixed(0)}K
                        </span>
                      </div>
                      <div className="text-xs text-white/50 font-mono uppercase">
                        FOLLOWERS
                      </div>
                    </div>
                  )) || [
                    <div key="inf-1" className="bg-black/20 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-white font-mono uppercase">@POLITICALVOICE</span>
                        <span className="text-lg font-bold text-cyan-400 font-barlow-condensed" style={{fontWeight: 400}}>127K</span>
                      </div>
                      <div className="text-xs text-white/50 font-mono uppercase">FOLLOWERS</div>
                    </div>,
                    <div key="inf-2" className="bg-black/20 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-white font-mono uppercase">@NEWSANALYST</span>
                        <span className="text-lg font-bold text-cyan-400 font-barlow-condensed" style={{fontWeight: 400}}>89K</span>
                      </div>
                      <div className="text-xs text-white/50 font-mono uppercase">FOLLOWERS</div>
                    </div>,
                    <div key="inf-3" className="bg-black/20 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-white font-mono uppercase">@LOCALREPORTER</span>
                        <span className="text-lg font-bold text-cyan-400 font-barlow-condensed" style={{fontWeight: 400}}>45K</span>
                      </div>
                      <div className="text-xs text-white/50 font-mono uppercase">FOLLOWERS</div>
                    </div>
                  ]}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Document Viewer Modal */}
        <DocumentViewerModal
          isOpen={selectedFile !== null}
          onClose={() => setSelectedFile(null)}
          file={selectedFile}
        />

      </PageLayout>
    </div>
  );
};

export default IntelligenceHub;