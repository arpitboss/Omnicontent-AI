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
    ? (translatedText ? translatedText.split('\n').map((line, index) => {
      // Try to find a timestamp at the start of the line (e.g., 00:00 or 00:00:00)
      const timestampMatch = line.match(/^(\d{1,2}:\d{2}(?::\d{2})?)(?::|\s)\s*(.*)/);

      if (timestampMatch) {
        return { timestamp: timestampMatch[1], text: timestampMatch[2] };
      }

      // Fallback: If no timestamp found in translation, use the original transcript's timestamp
      // This assumes the translation maintains the same line count, which is typical for this workflow.
      const originalTimestamp = transcript && transcript[index] ? transcript[index].timestamp : '';
      
      // Clean the line of any potential leading non-text characters if the split failed
      const cleanText = line.replace(/^[:\s]+/, '');

      return { timestamp: originalTimestamp, text: cleanText };
    }) : [])
    : transcript || [];

  if (!linesToDisplay || linesToDisplay.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center">
        <div className="space-y-5">
          <div className="relative mx-auto w-12 h-12">
            <div className="w-full h-full flex items-center justify-center rounded-full bg-card border border-border">
              <div className="w-5 h-5 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
            </div>
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-semibold tracking-tight">Generating transcript</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              We&apos;re transcribing your video. This usually takes a couple of minutes.
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
    <div className="space-y-4">
      {/* Translation Header */}
      {isTranslated && (
        <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-foreground text-background flex items-center justify-center">
              <Languages className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-medium">Showing translation</p>
              <p className="text-xs text-muted-foreground">Translated to {targetLanguage}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onShowOriginal}
            className="rounded-md border-border hover:bg-accent text-xs"
          >
            <Eye className="w-3.5 h-3.5 mr-1.5" />
            Show original
          </Button>
        </div>
      )}

      {/* Control Panel */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
              <FileText className="w-4 h-4 text-foreground/70" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[14px] font-medium">Full transcript</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{linesToDisplay.length} segments</span>
                {searchTerm && (
                  <>
                    <span className="text-border">·</span>
                    <span>{filteredLines.length} matches</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search transcript…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 rounded-md border-border h-9 text-sm focus-visible:ring-1 focus-visible:ring-brand/50 focus-visible:border-brand/40"
              />
            </div>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="rounded-md border-border h-9 w-9 p-0 hover:bg-accent"
                title={copied ? "Copied!" : "Copy to clipboard"}
              >
                <Copy className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="rounded-md border-border h-9 w-9 p-0 hover:bg-accent"
                title="Download as .txt"
              >
                <Download className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Transcript Content */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {searchTerm && filteredLines.length === 0 ? (
          <div className="text-center py-14 space-y-3">
            <div className="w-11 h-11 mx-auto rounded-lg bg-muted flex items-center justify-center">
              <Search className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium">No matches</p>
              <p className="text-xs text-muted-foreground">Try a different search term.</p>
            </div>
            <Button
              variant="link"
              size="sm"
              onClick={() => setSearchTerm('')}
              className="text-xs text-foreground hover:text-foreground/80"
            >
              Clear search
            </Button>
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border/50">
                {filteredLines.map((line, index) => {
                  const isHighlighted = searchTerm && line.text.toLowerCase().includes(searchTerm.toLowerCase());
                  const highlightedText = isHighlighted && searchTerm
                    ? line.text.replace(
                      new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
                      '<mark class="bg-[var(--accent-500)]/20 text-foreground rounded-sm px-0.5">$1</mark>'
                    )
                    : line.text;

                  return (
                    <tr
                      key={index}
                      className={`group hover:bg-accent/30 transition-colors ${isHighlighted ? 'bg-[var(--accent-500)]/[0.04]' : ''}`}
                    >
                      <td className="px-4 py-3 w-20 align-top">
                        <span className="font-mono text-[11.5px] text-muted-foreground select-none tabular-nums">
                          {line.timestamp}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top pr-5">
                        <div className="leading-relaxed text-foreground/85">
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
        <div className="border-t border-border px-4 py-2.5 bg-muted/20 flex justify-between items-center text-xs text-muted-foreground">
          <span>{linesToDisplay.length} segments</span>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            <span className="font-mono tabular-nums">
              {linesToDisplay.length > 0 && linesToDisplay[linesToDisplay.length - 1]?.timestamp
                ? linesToDisplay[linesToDisplay.length - 1].timestamp
                : '—'}
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: var(--border) transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
};
