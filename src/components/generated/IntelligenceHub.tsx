import type React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import PageLayout from '../shared/PageLayout';
import PageHeader from '../shared/PageHeader';
import Card from '../shared/Card';
import CustomDropdown from '../shared/CustomDropdown';

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
  const [activeTab, setActiveTab] = useState('upload');
  const [selectedFile, setSelectedFile] = useState<IntelligenceFile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

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
        return <File className="w-5 h-5 text-gray-400" />;
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

  return (
    <PageLayout pageTitle="Intelligence" placeholder="Ask War Room about campaign intelligence...">
      {/* Purple gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 -z-10" />

      <PageHeader
        title="Intelligence"
        subtitle="The central brain of your campaign. Upload assets, organize intelligence, and power up War Room AI."
      />

      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-6">
        {[
          { id: 'upload', label: 'Upload Intelligence', icon: Upload },
          { id: 'library', label: 'Knowledge Library', icon: Search },
          { id: 'chat', label: 'Chat History', icon: MessageSquare },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all duration-200 ${
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

      {/* Upload Intelligence Tab */}
      {activeTab === 'upload' && (
        <Card
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          padding="md"
          className="mb-6"
        >
          <h3 className="text-lg font-semibold text-white/95 mb-4">Upload Intelligence</h3>

          {/* Drag & Drop Area */}
          <div className="border-2 border-dashed border-white/30 rounded-lg p-8 text-center mb-6">
            <Upload className="w-12 h-12 text-white/50 mx-auto mb-4" />
            <p className="text-white/70 mb-2">Drag & drop files here or click to browse</p>
            <p className="text-white/50 text-sm">Supports: .pdf, .docx, .txt, .csv, images, URLs</p>
            <button className="mt-4 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg transition-colors">
              Choose Files
            </button>
          </div>

          {/* File Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Category</label>
              <select className="w-full bg-black/20 border border-white/30 rounded-lg px-3 py-2 text-white">
                <option>Auto-detect</option>
                <option>Polling</option>
                <option>Field Reports</option>
                <option>Opposition Research</option>
                <option>Messaging Assets</option>
                <option>News & Media</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Tags</label>
              <input
                type="text"
                placeholder="District, issue, audience, date..."
                className="w-full bg-black/20 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-white/50"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-white/80 mb-2">Add Notes</label>
            <textarea
              placeholder="Optional context (e.g., 'Use this in next debate prep')"
              className="w-full bg-black/20 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-white/50 h-20 resize-none"
            />
          </div>

          <div className="mt-4 flex items-center space-x-2">
            <input type="checkbox" id="ai-memory" className="rounded" />
            <label htmlFor="ai-memory" className="text-white/80">
              Include in War Room AI memory
            </label>
          </div>
        </Card>
      )}

      {/* Knowledge Library Tab */}
      {activeTab === 'library' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Filter & Search */}
          <Card padding="sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center space-x-2">
                <Search className="w-5 h-5 text-white/50" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none text-white placeholder-white/50 focus:outline-none"
                />
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
                whileHover={{ scale: 1.01 }}
                padding="sm"
                className="cursor-pointer"
                onClick={() => setSelectedFile(file)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getFileIcon(file.type)}
                    <div>
                      <h4 className="font-medium text-white/95">{file.title}</h4>
                      <p className="text-sm text-white/70">{file.summary}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-white/60">
                        <span>{getTypeLabel(file.type)}</span>
                        <span>{file.uploadDate}</span>
                        <span>{file.size}</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        {file.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="bg-white/20 text-white/80 px-2 py-1 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                      <Eye className="w-4 h-4 text-white/70" />
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                      <Zap className="w-4 h-4 text-white/70" />
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                      <Download className="w-4 h-4 text-white/70" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      {/* Chat History Tab */}
      {activeTab === 'chat' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white/95">Chat History & Saved Queries</h3>
            <div className="flex items-center space-x-2">
              <button className="text-sm text-white/70 hover:text-white">My Chats</button>
              <span className="text-white/50">|</span>
              <button className="text-sm text-white/70 hover:text-white">Team Chats</button>
            </div>
          </div>

          {chatQueries.map((query) => (
            <Card key={query.id} whileHover={{ scale: 1.01 }} padding="sm">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-white/70">{query.topic}</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-white/60">
                  <Clock className="w-3 h-3" />
                  <span>{query.timestamp}</span>
                </div>
              </div>
              <h4 className="font-medium text-white/95 mb-2">{query.query}</h4>
              <p className="text-sm text-white/70 mb-3">{query.response}</p>
              <div className="flex items-center space-x-2">
                <button className="text-xs text-blue-400 hover:text-blue-300">Reopen</button>
                <button className="text-xs text-white/70 hover:text-white">Copy</button>
                <button className="text-xs text-white/70 hover:text-white">Add to Doc</button>
              </div>
            </Card>
          ))}
        </motion.div>
      )}
    </PageLayout>
  );
};

export default IntelligenceHub;
