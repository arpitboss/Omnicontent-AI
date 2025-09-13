import React, { useState } from 'react';
import { Globe, Youtube, ExternalLink, Check, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UrlInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidation?: (isValid: boolean) => void;
  className?: string;
  placeholder?: string;
}

export const UrlInput: React.FC<UrlInputProps> = ({
  value,
  onChange,
  onValidation,
  className,
  placeholder = "https://www.youtube.com/watch?v=..."
}) => {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [urlType, setUrlType] = useState<'youtube' | 'other' | null>(null);

  const validateUrl = (url: string) => {
    if (!url.trim()) {
      setIsValid(null);
      setUrlType(null);
      onValidation?.(false);
      return;
    }

    try {
      const urlObj = new URL(url);
      const isValidUrl = urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
      
      if (isValidUrl) {
        // Check if it's a YouTube URL
        const isYoutube = 
          urlObj.hostname.includes('youtube.com') || 
          urlObj.hostname.includes('youtu.be') ||
          urlObj.hostname.includes('m.youtube.com');
        
        setUrlType(isYoutube ? 'youtube' : 'other');
        setIsValid(true);
        onValidation?.(true);
      } else {
        setIsValid(false);
        setUrlType(null);
        onValidation?.(false);
      }
    } catch {
      setIsValid(false);
      setUrlType(null);
      onValidation?.(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    validateUrl(newValue);
  };

  const getIcon = () => {
    if (urlType === 'youtube') return Youtube;
    if (urlType === 'other') return Globe;
    return ExternalLink;
  };

  const getStatusIcon = () => {
    if (isValid === true) return Check;
    if (isValid === false) return AlertCircle;
    return null;
  };

  const Icon = getIcon();
  const StatusIcon = getStatusIcon();

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
          <Icon className={cn(
            "w-5 h-5 transition-colors duration-200",
            urlType === 'youtube' ? "text-red-500" : "text-muted-foreground"
          )} />
        </div>
        
        <Input
          type="url"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn(
            "pl-12 pr-12 h-14 text-lg glass-effect backdrop-blur-xl border-border/50 transition-all duration-300",
            "focus:border-primary focus:backdrop-blur-2xl focus:shadow-lg focus:shadow-primary/20",
            isValid === true && "border-emerald-500 focus:border-emerald-500",
            isValid === false && "border-destructive focus:border-destructive"
          )}
          data-testid="url-input"
        />
        
        {StatusIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <StatusIcon className={cn(
              "w-5 h-5",
              isValid === true && "text-emerald-500",
              isValid === false && "text-destructive"
            )} />
          </div>
        )}
      </div>

      {/* URL Preview */}
      {value && isValid && (
        <div className="glass-effect p-4 rounded-xl border border-border/50 backdrop-blur-xl animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className={cn(
                "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                urlType === 'youtube' 
                  ? "bg-red-500/10 text-red-500" 
                  : "bg-primary/10 text-primary"
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {urlType === 'youtube' ? 'YouTube Video' : 'Web URL'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {value}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(value, '_blank')}
              className="flex-shrink-0 hover:bg-accent/50"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {isValid === false && value && (
        <div className="flex items-center space-x-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Please enter a valid URL (must start with http:// or https://)</span>
        </div>
      )}

      {/* Helper Text */}
      {!value && (
        <div className="text-sm text-muted-foreground">
          <p className="mb-2">Supported platforms:</p>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center space-x-2 px-3 py-1 bg-red-500/10 text-red-600 dark:text-red-400 rounded-full">
              <Youtube className="w-3 h-3" />
              <span>YouTube</span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1 bg-muted/30 text-muted-foreground rounded-full">
              <Globe className="w-3 h-3" />
              <span>Any public URL</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};