"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, Copy, Download, Eye, FileText, Languages, Search } from 'lucide-react';
import { useState } from 'react';

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
      <div className="relative border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 p-12 text-center">
        <div className="space-y-6">
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 bg-black/10 dark:bg-white/10 animate-pulse rounded-full" />
            <div className="relative w-full h-full flex items-center justify-center border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black">
              <div className="w-6 h-6 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold uppercase tracking-widest">Generating Transcript</h3>
            <p className="text-neutral-500 font-mono text-sm max-w-md mx-auto">
              Neural processing in progress...
            </p>
          </div>
        </div>
      </div>
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
    <div className="space-y-6">
      {/* Translation Header */}
      {isTranslated && (
        <div className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-black dark:bg-white flex items-center justify-center">
              <Languages className="w-5 h-5 text-white dark:text-black" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold uppercase tracking-wider">Translated to {targetLanguage}</h3>
              <p className="text-xs text-neutral-500 font-mono">AI-powered translation</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={onShowOriginal}
            className="rounded-none border-neutral-300 dark:border-neutral-700 hover:bg-white dark:hover:bg-black font-mono text-xs uppercase"
          >
            <Eye className="w-3 h-3 mr-2" />
            Show Original
          </Button>
        </div>
      )}

      {/* Control Panel */}
      <div className="border border-dashed border-neutral-300 dark:border-neutral-700 bg-white dark:bg-black p-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center border border-neutral-200 dark:border-neutral-800">
              <FileText className="w-4 h-4 text-black dark:text-white" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold uppercase tracking-wider">Transcript Data</h3>
              <div className="flex items-center space-x-3 text-xs font-mono text-neutral-500">
                <span>{linesToDisplay.length} SEGMENTS</span>
                {searchTerm && (
                  <>
                    <span className="text-neutral-300 dark:text-neutral-700">|</span>
                    <span>{filteredLines.length} MATCHES</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-neutral-400" />
              <Input
                placeholder="SEARCH_TRANSCRIPT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 rounded-none border-neutral-300 dark:border-neutral-700 h-9 font-mono text-xs uppercase focus:ring-0 focus:border-black dark:focus:border-white"
              />
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="rounded-none border-neutral-300 dark:border-neutral-700 h-9 w-9 p-0"
                title="Copy to Clipboard"
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="rounded-none border-neutral-300 dark:border-neutral-700 h-9 w-9 p-0"
                title="Download Text"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Transcript Content */}
      <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black relative">
        {searchTerm && filteredLines.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="w-12 h-12 mx-auto bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center border border-neutral-200 dark:border-neutral-800">
              <Search className="w-6 h-6 text-neutral-400" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold uppercase tracking-wider">No matches found</h4>
              <p className="text-xs text-neutral-500 font-mono">Try a different search term</p>
            </div>
            <Button
              variant="link"
              onClick={() => setSearchTerm('')}
              className="text-xs font-mono text-black dark:text-white underline decoration-dashed underline-offset-4"
            >
              CLEAR_SEARCH
            </Button>
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-900">
                {filteredLines.map((line, index) => {
                  const isHighlighted = searchTerm && line.text.toLowerCase().includes(searchTerm.toLowerCase());
                  const highlightedText = isHighlighted && searchTerm
                    ? line.text.replace(
                      new RegExp(`(${searchTerm})`, 'gi'),
                      '<mark class="bg-yellow-200 dark:bg-yellow-900 text-black dark:text-white px-0.5">$1</mark>'
                    )
                    : line.text;

                  return (
                    <tr
                      key={index}
                      className={`
                        group hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors duration-200
                        ${isHighlighted ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}
                      `}
                    >
                      <td className="p-4 w-24 align-top border-r border-neutral-100 dark:border-neutral-900 bg-neutral-50/50 dark:bg-neutral-950/50">
                        <span className="font-mono text-xs text-neutral-400 select-none">
                          {line.timestamp}
                        </span>
                      </td>
                      <td className="p-4 align-top">
                        <div className="leading-relaxed text-neutral-700 dark:text-neutral-300 font-serif">
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
        <div className="border-t border-neutral-200 dark:border-neutral-800 p-3 bg-neutral-50 dark:bg-neutral-950 flex justify-between items-center text-[10px] font-mono uppercase text-neutral-500">
          <span>Total segments: {linesToDisplay.length}</span>
          <div className="flex items-center space-x-2">
            <Clock className="w-3 h-3" />
            <span>
              {linesToDisplay.length > 0 && linesToDisplay[linesToDisplay.length - 1]?.timestamp
                ? `Duration: ${linesToDisplay[linesToDisplay.length - 1].timestamp}`
                : 'Processing...'}
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #e5e5e5 transparent;
        }
        .dark .custom-scrollbar {
          scrollbar-color: #262626 transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e5e5;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #262626;
        }
      `}</style>
    </div>
  );
};
