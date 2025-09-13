"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GridBackground, ContentBox } from '@/components/ui/grid-background';
import { Languages, Clock, FileText, Eye, Copy, Download, Search } from 'lucide-react';

interface TranscriptSegment {
  timestamp: string;
  text: string;
}

interface TranscriptDisplayProps {
  transcript?: TranscriptSegment[];
  translatedText?: string;
  targetLanguage?: string;
  onShowOriginal: () => void;
}

export const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({
  transcript,
  translatedText,
  targetLanguage,
  onShowOriginal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  const isTranslated = !!translatedText;
  const linesToDisplay = isTranslated
    ? (translatedText ? translatedText.split('\n').map((line) => {
        const [timestamp, ...textParts] = line.split(': ');
        return { timestamp, text: textParts.join(': ') };
      }) : [])
    : transcript || [];

  if (!linesToDisplay || linesToDisplay.length === 0) {
    return (
      <GridBackground pattern="diagonal" className="relative">
        <ContentBox
          variant="premium"
          className="py-20 bg-gradient-to-br from-gray-100/30 to-gray-50/30 dark:from-slate-900/30 dark:to-slate-800/30 backdrop-blur-sm rounded-2xl border border-gray-200/30 dark:border-slate-700/30"
        >
          <div className="text-center space-y-6">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl animate-pulse" />
              <div className="relative w-full h-full glass-effect rounded-2xl flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold gradient-text">Generating Transcript</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Our AI is processing your content and creating a detailed transcript. This usually takes a few moments.
              </p>
            </div>
            <div className="flex justify-center">
              <div className="flex space-x-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </ContentBox>
      </GridBackground>
    );
  }

  const handleCopy = async () => {
    const textToCopy = linesToDisplay.map((line) => `${line.timestamp}: ${line.text}`).join('\n');
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const textToDownload = linesToDisplay.map((line) => `${line.timestamp}: ${line.text}`).join('\n');
    const blob = new Blob([textToDownload], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript${isTranslated ? `_${targetLanguage}` : ''}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredLines = linesToDisplay.filter((line) =>
    searchTerm === '' || line.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <GridBackground pattern="lines" className="relative">
      <div className="space-y-6">
        {/* Translation Header */}
        {isTranslated && (
          <ContentBox
            variant="floating"
            className="bg-gradient-to-r from-primary/10 to-purple-500/10 dark:from-primary/20 dark:to-purple-500/20 border-primary/20 dark:border-primary/30 backdrop-blur-sm rounded-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-primary to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Languages className="w-6 h-6 text-white" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold gradient-text">Translated to {targetLanguage}</h3>
                  <p className="text-sm text-muted-foreground">AI-powered translation with context awareness</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={onShowOriginal}
                className="glass-effect border-primary/20 dark:border-primary/30 hover:bg-primary/10 dark:hover:bg-primary/20"
                data-testid="button-show-original"
              >
                <Eye className="w-4 h-4 mr-2" />
                Show Original
              </Button>
            </div>
          </ContentBox>
        )}

        {/* Control Panel */}
        <ContentBox
          variant="premium"
          className="glass-effect strategic-border bg-gradient-to-r from-gray-100/50 to-gray-50/50 dark:from-slate-900/50 dark:to-slate-800/50 backdrop-blur-sm rounded-2xl border border-gray-200/30 dark:border-slate-700/30"
        >
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-500 rounded-lg flex items-center justify-center shadow-md">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold gradient-text">Transcript</h3>
                  <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{linesToDisplay.length} segments</span>
                    </div>
                    {searchTerm && (
                      <>
                        <span className="w-1 h-1 bg-muted-foreground rounded-full" />
                        <span>{filteredLines.length} matches</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="glass-effect border-gray-300 dark:border-slate-600 hover:bg-purple-600/50 dark:hover:bg-purple-600/70 hover:border-purple-500 transition-all duration-300"
                  data-testid="button-copy"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="glass-effect border-gray-300 dark:border-slate-600 hover:bg-blue-600/50 dark:hover:bg-blue-600/70 hover:border-blue-500 transition-all duration-300"
                  data-testid="button-download"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search transcript..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 glass-effect border-gray-300/60 dark:border-slate-600/80 focus:border-primary rounded-xl"
                data-testid="input-search"
              />
            </div>
          </div>
        </ContentBox>

        {/* Transcript Content */}
        <ContentBox
          variant="premium"
          className="bg-gradient-to-br from-gray-100/30 to-gray-50/30 dark:from-slate-900/50 dark:to-slate-800/50 backdrop-blur-sm rounded-2xl border border-gray-200/30 dark:border-slate-700/30 overflow-hidden"
        >
          {searchTerm && filteredLines.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-16 h-16 mx-auto glass-effect rounded-2xl flex items-center justify-center">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-semibold gradient-text">No matches found</h4>
                <p className="text-muted-foreground">Try a different search term or clear the search to see all segments</p>
              </div>
              <Button
                variant="outline"
                onClick={() => setSearchTerm('')}
                className="glass-effect border-gray-300 dark:border-slate-600 hover:bg-gray-200 dark:hover:bg-slate-700"
                data-testid="button-clear-search"
              >
                Clear Search
              </Button>
            </div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
              {searchTerm && (
                <div className="sticky top-0 bg-gray-100/90 dark:bg-slate-900/90 backdrop-blur-sm border-b border-gray-200/30 dark:border-slate-700/30 p-3 z-10">
                  <p className="text-sm text-gray-600 dark:text-slate-200">
                    Found {filteredLines.length} of {linesToDisplay.length} segments
                    {searchTerm && (
                      <span className="ml-2">
                        matching "<span className="text-purple-400 font-medium">{searchTerm}</span>"
                      </span>
                    )}
                  </p>
                </div>
              )}
              <table className="w-full">
                <tbody>
                  {filteredLines.map((line, index) => {
                    const isHighlighted = searchTerm && line.text.toLowerCase().includes(searchTerm.toLowerCase());
                    const highlightedText = isHighlighted && searchTerm
                      ? line.text.replace(
                          new RegExp(`(${searchTerm})`, 'gi'),
                          '<mark class="bg-purple-500/30 dark:bg-purple-500/50 text-purple-200 rounded px-1">$1</mark>'
                        )
                      : line.text;

                    return (
                      <tr
                        key={index}
                        className={`
                          group hover:bg-gray-200/30 dark:hover:bg-slate-800/30 transition-colors duration-200
                          ${isHighlighted ? 'bg-purple-500/10 dark:bg-purple-500/20 border-l-4 border-purple-500' : ''}
                        `}
                        data-testid={`transcript-line-${index}`}
                      >
                        <td className="p-4 text-right pr-6 w-24 select-none">
                          <span
                            className={`
                              text-sm font-mono rounded-lg px-2 py-1 transition-colors duration-200
                              ${isHighlighted
                                ? 'text-purple-300 bg-purple-500/20 dark:bg-purple-500/30'
                                : 'text-gray-500 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-200 group-hover:bg-gray-300/30 dark:group-hover:bg-slate-700/30'
                              }
                            `}
                          >
                            {line.timestamp}
                          </span>
                        </td>
                        <td className="p-4">
                          <div
                            className={`
                              leading-relaxed transition-colors duration-200
                              ${isHighlighted
                                ? 'text-gray-900 dark:text-white font-medium'
                                : 'text-gray-700 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-white'
                              }
                            `}
                          >
                            {searchTerm && isHighlighted ? (
                              <span dangerouslySetInnerHTML={{ __html: highlightedText }} />
                            ) : (
                              line.text
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="border-t border-gray-200/30 dark:border-slate-700/30 p-4 bg-gray-100/50 dark:bg-slate-900/50">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center space-x-4">
                <span>Total segments: {linesToDisplay.length}</span>
                {searchTerm && (
                  <>
                    <span className="w-1 h-1 bg-muted-foreground rounded-full" />
                    <span>Showing: {filteredLines.length}</span>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>
                  {linesToDisplay.length > 0 && linesToDisplay[linesToDisplay.length - 1]?.timestamp
                    ? `Duration: ${linesToDisplay[linesToDisplay.length - 1].timestamp}`
                    : 'Processing...'}
                </span>
              </div>
            </div>
          </div>
        </ContentBox>
      </div>

      <style jsx>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgb(100 116 139) transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgb(100 116 139);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgb(148 163 184);
        }
      `}</style>
    </GridBackground>
  );
};
