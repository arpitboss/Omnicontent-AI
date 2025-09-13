import React, { useCallback, useState, useRef } from 'react';
import { Upload, File, X, Check, AlertCircle, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
  acceptedTypes?: string[];
  maxSize?: number; // in MB
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileChange,
  acceptedTypes = ['video/*', 'audio/*'],
  maxSize = 100,
  className
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setUploadError(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Validate file type
    const isValidType = acceptedTypes.some(type => {
      if (type.includes('*')) {
        return file.type.startsWith(type.replace('*', ''));
      }
      return file.type === type;
    });

    if (!isValidType) {
      setUploadError(`File type not supported. Please upload: ${acceptedTypes.join(', ')}`);
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setUploadedFile(file);
    onFileChange(file);

    // Simulate upload progress with premium feel
    for (let i = 0; i <= 100; i += 2) {
      await new Promise(resolve => setTimeout(resolve, 30));
      setUploadProgress(i);
    }

    setIsUploading(false);
  };

  const removeFile = () => {
    setUploadedFile(null);
    setUploadProgress(0);
    setUploadError(null);
    onFileChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = () => {
    if (!uploadedFile) return File;
    if (uploadedFile.type.startsWith('video/')) return Play;
    if (uploadedFile.type.startsWith('audio/')) return Pause;
    return File;
  };

  if (uploadedFile) {
    const FileIcon = getFileIcon();
    
    return (
      <div className={cn("space-y-4", className)}>
        <div className="glass-effect p-6 rounded-2xl border border-border/50 backdrop-blur-xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center shadow-lg">
                  <FileIcon className="w-7 h-7 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="text-lg font-semibold text-foreground truncate">
                    {uploadedFile.name}
                  </h4>
                  {uploadProgress === 100 && (
                    <div className="flex-shrink-0 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {formatFileSize(uploadedFile.size)} • {uploadedFile.type}
                </p>
                
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Uploading...</span>
                      <span className="font-medium text-primary">{uploadProgress}%</span>
                    </div>
                    <Progress 
                      value={uploadProgress} 
                      className="w-full h-2" 
                    />
                  </div>
                )}
                
                {uploadProgress === 100 && !isUploading && (
                  <div className="flex items-center space-x-2 text-sm text-emerald-600 dark:text-emerald-400">
                    <Check className="w-4 h-4" />
                    <span className="font-medium">Ready for processing</span>
                  </div>
                )}
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={removeFile}
              className="flex-shrink-0 hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
              data-testid="remove-file-button"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {uploadError && (
          <div className="flex items-center space-x-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className={cn(
          "relative group cursor-pointer transition-all duration-300 rounded-2xl border-2 border-dashed p-8",
          "glass-effect backdrop-blur-xl hover:backdrop-blur-2xl",
          dragActive 
            ? "border-primary bg-primary/5 scale-[1.02]" 
            : "border-border/50 hover:border-primary/50 hover:bg-accent/20"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        data-testid="file-upload-dropzone"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          data-testid="file-upload-input"
        />
        
        <div className="text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 subtle-glow">
            <Upload className="w-10 h-10 text-primary animate-float" />
          </div>
          
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-foreground group-hover:gradient-text transition-all duration-300">
              Drop your files here
            </h3>
            <p className="text-muted-foreground">
              or <span className="text-primary font-medium hover:underline">browse</span> to choose files
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-2 px-3 py-1 bg-muted/30 rounded-full">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              <span>Supports: {acceptedTypes.join(', ')}</span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1 bg-muted/30 rounded-full">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span>Max size: {maxSize}MB</span>
            </div>
          </div>
        </div>
      </div>

      {uploadError && (
        <div className="flex items-center space-x-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}
    </div>
  );
};