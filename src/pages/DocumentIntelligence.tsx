/**
 * Document Intelligence Dashboard
 *
 * Features:
 * - Document upload with drag & drop
 * - Real-time search with vector similarity
 * - Document management and processing status
 * - File type filtering and organization
 */

import type React from 'react';
import { useState, useCallback } from 'react';
import {
  Upload,
  Search,
  File,
  FileText,
  Image,
  Video,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Trash2,
  Filter,
  Tag,
} from 'lucide-react';

interface Document {
  id: string;
  title: string;
  filename: string;
  original_filename: string;
  file_size_mb: number;
  document_type: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  is_vectorized: boolean;
  vector_count: number;
  tags: string[];
  created_at: string;
  processing_error?: string;
}

interface SearchResult {
  id: string;
  document: Document;
  chunk_text: string;
  similarity_score: number;
  chunk_index: number;
}

const DocumentIntelligence: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'search' | 'manage'>('upload');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // File upload handling
  const handleFileUpload = useCallback(async (files: FileList) => {
    if (!files.length) {
      return;
    }

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', file.name.split('.')[0]);

        const response = await fetch('/api/v1/documents/upload', {
          method: 'POST',
          body: formData,
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.ok) {
          const newDocument = await response.json();
          setDocuments((prev) => [newDocument, ...prev]);
        }
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
      setSelectedFiles(null);
    }
  }, []);

  // Drag and drop handling
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const { files } = e.dataTransfer;
      if (files.length) {
        handleFileUpload(files);
      }
    },
    [handleFileUpload]
  );

  // Document search
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch('/api/v1/documents/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          query: searchQuery,
          limit: 10,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-yellow-600 animate-spin" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  // Get file type icon
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-6 h-6 text-red-600" />;
      case 'csv':
        return <File className="w-6 h-6 text-green-600" />;
      case 'docx':
        return <FileText className="w-6 h-6 text-blue-600" />;
      case 'image':
        return <Image className="w-6 h-6 text-purple-600" />;
      case 'video':
        return <Video className="w-6 h-6 text-orange-600" />;
      default:
        return <File className="w-6 h-6 text-gray-600" />;
    }
  };

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    if (statusFilter !== 'all' && doc.processing_status !== statusFilter) {
      return false;
    }
    if (typeFilter !== 'all' && doc.document_type !== typeFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Intelligence</h1>
        <p className="text-gray-600">
          Upload, process, and search documents with AI-powered insights
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg w-fit">
        {(['upload', 'search', 'manage'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          {/* Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isUploading ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Documents</h3>
            <p className="text-gray-600 mb-4">Drag and drop files here, or click to select files</p>
            <input
              type="file"
              multiple
              accept=".pdf,.csv,.docx,.txt"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
            >
              Select Files
            </label>
            <p className="text-sm text-gray-500 mt-2">
              Supported: PDF, CSV, DOCX, TXT (max 25MB each)
            </p>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-blue-600 animate-spin mr-2" />
                <span className="text-blue-800">Uploading and processing documents...</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="flex space-x-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents with AI-powered similarity..."
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              <Search className="w-4 h-4 mr-2" />
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Search Results ({searchResults.length})
              </h3>
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        {getFileIcon(result.document.document_type)}
                        <h4 className="ml-2 text-lg font-medium text-gray-900">
                          {result.document.title}
                        </h4>
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {Math.round(result.similarity_score * 100)}% match
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2 line-clamp-3">{result.chunk_text}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <span>Chunk {result.chunk_index + 1}</span>
                        <span className="mx-2">•</span>
                        <span>{result.document.original_filename}</span>
                        <span className="mx-2">•</span>
                        <span>{result.document.file_size_mb}MB</span>
                      </div>
                    </div>
                    <div className="ml-4 flex space-x-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {searchQuery && searchResults.length === 0 && !isSearching && (
            <div className="text-center py-8">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600">
                Try adjusting your search query or upload more documents
              </p>
            </div>
          )}
        </div>
      )}

      {/* Manage Tab */}
      {activeTab === 'manage' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex space-x-4 items-center">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">All Types</option>
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
              <option value="docx">DOCX</option>
              <option value="txt">TXT</option>
            </select>
          </div>

          {/* Documents List */}
          <div className="space-y-4">
            {filteredDocuments.map((document) => (
              <div key={document.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getFileIcon(document.document_type)}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{document.title}</h3>
                      <p className="text-sm text-gray-600">{document.original_filename}</p>
                      <div className="flex items-center mt-2 space-x-4">
                        <div className="flex items-center">
                          {getStatusIcon(document.processing_status)}
                          <span className="ml-1 text-sm text-gray-600 capitalize">
                            {document.processing_status}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600">{document.file_size_mb}MB</span>
                        {document.is_vectorized && (
                          <span className="text-sm text-green-600">
                            {document.vector_count} chunks
                          </span>
                        )}
                      </div>
                      {document.tags.length > 0 && (
                        <div className="flex items-center mt-2">
                          <Tag className="w-4 h-4 text-gray-400 mr-1" />
                          <div className="flex space-x-1">
                            {document.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-2 text-gray-400 hover:text-blue-600">
                      <Download className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {document.processing_error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700">{document.processing_error}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredDocuments.length === 0 && (
            <div className="text-center py-8">
              <File className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
              <p className="text-gray-600">Upload your first document to get started</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentIntelligence;
