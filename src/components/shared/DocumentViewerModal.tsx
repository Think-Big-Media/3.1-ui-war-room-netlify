import React, { useState, useEffect } from 'react';
import { X, Edit3, Save, Download, FileText, AlertCircle, Loader } from 'lucide-react';

interface IntelligenceFile {
  id: string;
  title: string;
  type: 'polling' | 'field-report' | 'opposition-research' | 'messaging' | 'news-media';
  uploadDate: string;
  size: string;
  tags: string[];
  summary?: string;
}

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: IntelligenceFile | null;
}

const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({ isOpen, onClose, file }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load document content when modal opens
  useEffect(() => {
    if (isOpen && file) {
      loadDocumentContent();
    } else {
      // Reset state when modal closes
      setContent('');
      setOriginalContent('');
      setIsEditing(false);
      setHasUnsavedChanges(false);
      setError(null);
    }
  }, [isOpen, file]);

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(content !== originalContent && content.length > 0);
  }, [content, originalContent]);

  const loadDocumentContent = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      // Mock document content - in real app, fetch from API
      const mockContent = generateMockContent(file);
      setContent(mockContent);
      setOriginalContent(mockContent);
    } catch (err) {
      setError('Failed to load document content');
      console.error('Document load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockContent = (file: IntelligenceFile): string => {
    switch (file.type) {
      case 'polling':
        return `# ${file.title}

## Executive Summary
This polling report analyzes voter sentiment and preferences in the target district. The data shows significant shifts in key demographic groups over the past quarter.

## Key Findings
- Overall approval rating: 52% (+3% from previous quarter)
- Strong performance among suburban voters (64% approval)
- Healthcare remains the top issue for 78% of respondents
- Economic concerns showing steady decline (down to 45%)

## Demographic Breakdown
### Age Groups
- 18-34: 48% approval (improving trend)
- 35-54: 55% approval (stable)
- 55+: 57% approval (slight decline)

### Geographic Distribution
- Urban areas: 49% approval
- Suburban areas: 64% approval  
- Rural areas: 51% approval

## Recommendations
1. Continue focus on healthcare messaging
2. Increase suburban engagement efforts
3. Address concerns of younger voters through digital outreach

## Methodology
Survey of 1,247 likely voters conducted via phone and online panel. Margin of error: ±3.1%. Survey dates: ${new Date().toLocaleDateString()} - ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}.`;

      case 'opposition-research':
        return `# ${file.title}

## Subject Overview
Comprehensive background analysis of primary opponent including policy positions, voting record, and public statements.

## Policy Positions
### Healthcare
- Supports Medicare expansion
- Previously voted against pharmaceutical pricing reform
- Changed position on pre-existing conditions coverage (2022)

### Economy
- Pro-business stance with focus on small business tax relief
- Opposes minimum wage increases
- Mixed record on infrastructure spending

### Education
- Supports school choice initiatives
- Questions regarding public education funding cuts
- Strong charter school advocacy

## Voting Record Analysis
### Key Votes (2020-2024)
- Healthcare Reform Act: NO
- Infrastructure Investment Bill: YES
- Climate Action Framework: NO
- Economic Recovery Package: YES (with amendments)

## Public Statements & Contradictions
Recent statements show evolution on climate policy, moving from "climate skeptic" to "pragmatic environmental steward."

## Vulnerabilities
1. Inconsistent messaging on healthcare
2. Perceived as too pro-corporate by working-class voters
3. Limited appeal to younger demographics

## Strategic Recommendations
Focus on policy consistency and grassroots appeal in contrast messaging.`;

      case 'messaging':
        return `# ${file.title}

## Core Message Framework
Our healthcare policy represents real solutions for working families who have been left behind by the current system.

## Key Messages

### Primary Message
"While others talk, we deliver real healthcare solutions that put families first."

### Supporting Messages
1. **Accessibility**: "Healthcare is a right, not a privilege"
2. **Affordability**: "No family should choose between medication and groceries"
3. **Quality**: "World-class care shouldn't be reserved for the wealthy"

## Audience-Specific Messaging

### Working Families
- Focus on prescription drug costs
- Emphasize preventive care accessibility  
- Highlight employer healthcare mandates

### Seniors
- Medicare protection and expansion
- Prescription drug pricing reform
- Long-term care options

### Young Adults
- Mental health coverage
- Reproductive health access
- Affordable insurance options

## Do's and Don'ts

### DO:
- Use personal stories from district residents
- Reference specific policy solutions
- Connect to local healthcare providers

### DON'T:
- Get into wonky policy details
- Attack other candidates personally
- Make promises we can't keep

## Sample Talking Points
"In our district, one in four families has delayed medical care because of cost. That's not just a statistic - that's our neighbors, our friends, our family members."`;

      case 'field-report':
        return `# ${file.title}

## Activity Summary
Field team conducted door-to-door canvassing in targeted suburban neighborhoods over the weekend of ${new Date().toLocaleDateString()}.

## Areas Covered
### Neighborhoods Visited
- Maple Grove subdivision (127 doors)
- Heritage Hills development (89 doors)  
- Riverside Commons (156 doors)
- Oak Valley estates (73 doors)

## Voter Contact Results
- **Total doors approached**: 445
- **Successful contacts**: 267 (60% contact rate)
- **Positive responses**: 162 (61% of contacts)
- **Volunteer recruitment**: 23 new sign-ups
- **Voter registration**: 14 new registrations

## Key Issues Raised by Voters
1. **Healthcare costs** - mentioned by 78% of contacts
2. **Local school funding** - 45% of contacts
3. **Road infrastructure** - 33% of contacts
4. **Property taxes** - 29% of contacts

## Notable Feedback
### Positive Comments
- "Finally, someone who listens to our concerns"
- "Love the focus on practical solutions"
- "Impressed by the detailed policy knowledge"

### Areas of Concern
- Questions about campaign funding sources
- Requests for more specific education policy details
- Some skepticism about timeline for healthcare reform

## Volunteer Performance
Team of 8 volunteers showed excellent enthusiasm and knowledge. Sarah Johnson led team with 67 successful contacts. All volunteers request return assignments.

## Follow-up Actions
1. Schedule follow-up calls with interested undecided voters
2. Send policy details to voters who requested more information
3. Coordinate with local school board candidates
4. Plan return visit to missed contacts

## Next Steps
Expand canvassing to adjacent neighborhoods based on positive response rates.`;

      case 'news-media':
        return `# ${file.title}

## Media Monitoring Report
Comprehensive analysis of news coverage and media mentions for the week of ${new Date().toLocaleDateString()}.

## Coverage Summary
- **Total mentions**: 47 across all platforms
- **Positive coverage**: 62%
- **Neutral coverage**: 28%
- **Negative coverage**: 10%

## Key Story Highlights

### Positive Coverage
**"Healthcare Champion Gains Momentum" - City Tribune**
- 850-word feature on our healthcare policy proposal
- Includes interview quotes and policy expert validation
- Prominent placement on page 3

**"Local Candidate Addresses Infrastructure Needs" - Regional News**
- Coverage of town hall on road improvement funding
- Positive voter testimonials included

### Neutral Coverage
**"Candidate Forum Highlights Policy Differences" - Public Radio**
- Fair coverage of multi-candidate event
- Equal time given to all positions
- Factual reporting without editorial slant

### Areas of Concern
**"Questions Remain on Campaign Funding" - Opposition Blog**
- Raises questions about donor transparency
- Limited circulation but active social media sharing
- Recommend proactive response on funding sources

## Social Media Metrics
- **Facebook engagement**: 2,347 interactions (+15% from previous week)
- **Twitter mentions**: 156 (+8%)
- **Instagram reach**: 4,892 people (+22%)

## Trending Topics
1. Healthcare policy (#healthcare, #familiesfirst)
2. Infrastructure investment (#fixourroads)
3. Education funding (#schoolsdeservebetter)

## Earned Media Opportunities
- Local business roundtable (next Thursday)
- Chamber of Commerce endorsement interview
- High school graduation speech invitation

## Recommendations
1. Proactive statement on campaign transparency
2. Increase social media content frequency
3. Pitch infrastructure story to state-level outlets
4. Schedule more town halls in covered districts`;

      default:
        return `# ${file.title}

This is a sample document showing how content would appear in the document viewer.

The viewer supports editing capabilities for text-based documents and provides a clean, readable interface for reviewing campaign intelligence files.

You can edit this content directly and save changes back to the knowledge library.`;
    }
  };

  const handleSave = async () => {
    if (!file) return;

    try {
      // Mock save operation - in real app, save to API
      console.log('Saving document:', file.id, content);
      setOriginalContent(content);
      setHasUnsavedChanges(false);
      
      // Show success feedback (you could add a toast notification here)
      const saveIndicator = document.createElement('div');
      saveIndicator.textContent = 'Document saved!';
      saveIndicator.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg z-50';
      document.body.appendChild(saveIndicator);
      setTimeout(() => document.body.removeChild(saveIndicator), 2000);
      
    } catch (err) {
      setError('Failed to save document');
      console.error('Save error:', err);
    }
  };

  const handleDownload = () => {
    if (!file) return;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `${file.title}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        handleClose();
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && isEditing) {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isEditing, hasUnsavedChanges]);

  if (!isOpen || !file) return null;

  const getFileTypeIcon = (type: string) => {
    return <FileText className="w-5 h-5" />;
  };

  const getFileTypeLabel = (type: string) => {
    switch (type) {
      case 'polling': return 'Polling Data';
      case 'field-report': return 'Field Report';
      case 'opposition-research': return 'Opposition Research';
      case 'messaging': return 'Messaging Asset';
      case 'news-media': return 'News & Media';
      default: return 'Document';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl h-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              {getFileTypeIcon(file.type)}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 font-condensed uppercase tracking-wider">
                  {file.title}
                </h2>
                <p className="text-sm text-gray-600 font-jetbrains uppercase">
                  {getFileTypeLabel(file.type)} • {file.size} • {file.uploadDate}
                </p>
              </div>
              {hasUnsavedChanges && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-jetbrains uppercase bg-amber-100 text-amber-800">
                  Unsaved Changes
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isEditing
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Edit3 className="w-4 h-4 mr-1" />
                {isEditing ? 'Reading' : 'Edit'}
              </button>
              
              {isEditing && hasUnsavedChanges && (
                <button
                  onClick={handleSave}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                >
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </button>
              )}
              
              <button
                onClick={handleDownload}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                <Download className="w-4 h-4 mr-1" />
                Download
              </button>
              
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-hidden">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
                  <p className="text-gray-600 font-jetbrains uppercase">Loading document...</p>
                </div>
              </div>
            ) : (
              <div className="h-full">
                {isEditing ? (
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full h-full p-4 text-gray-900 bg-gray-50 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm leading-relaxed"
                    placeholder="Start typing your document content..."
                  />
                ) : (
                  <div className="h-full overflow-auto">
                    <pre className="whitespace-pre-wrap text-gray-900 font-mono text-sm leading-relaxed p-4">
                      {content}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-4 text-xs text-gray-600 font-jetbrains uppercase">
              <span>Tags: {file.tags.join(', ')}</span>
            </div>
            <div className="text-xs text-gray-500 font-jetbrains uppercase">
              Press Esc to close • Ctrl+S to save
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewerModal;