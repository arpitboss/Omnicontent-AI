import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { AlertCircle, Check, File, Pause, Play, Upload, X } from 'lucide-react';
import React, { useRef, useState } from 'react';

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
  acceptedTypes?: string[];
  maxSize?: number;
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

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setUploadError(`File size must be less than ${maxSize} MB`);
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
      setUploadError(`File type not supported.Please upload: ${acceptedTypes.join(', ')} `);
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
        <div className="bg-card border border-border rounded-xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-[var(--accent-500)]" />

          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-muted flex items-center justify-center rounded-lg border border-border">
                  <FileIcon className="w-5 h-5 text-foreground" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="text-sm font-medium text-foreground truncate">
                    {uploadedFile.name}
                  </h4>
                  {uploadProgress === 100 && (
                    <div className="flex-shrink-0 w-4 h-4 bg-[var(--accent-500)] rounded-full flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  {formatFileSize(uploadedFile.size)} · {uploadedFile.type}
                </p>

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-muted-foreground">Uploading…</span>
                      <span className="font-medium tabular-nums">{uploadProgress}%</span>
                    </div>
                    <Progress
                      value={uploadProgress}
                      className="w-full h-1 rounded-full bg-muted"
                    />
                  </div>
                )}

                {uploadProgress === 100 && !isUploading && (
                  <div className="flex items-center space-x-1.5 text-xs font-medium text-[var(--accent-500)]">
                    <Check className="w-3.5 h-3.5" />
                    <span>Ready for processing</span>
                  </div>
                )}
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={removeFile}
              className="flex-shrink-0 hover:bg-accent rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {uploadError && (
          <div className="flex items-center space-x-2 p-3 bg-red-500/[0.06] border border-red-500/30 text-red-500 text-xs rounded-lg">
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
          "relative group cursor-pointer transition-colors border border-dashed rounded-xl p-12",
          dragActive
            ? "border-foreground/40 bg-muted/40"
            : "border-border hover:border-foreground/30 hover:bg-muted/30"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="text-center space-y-5">
          <div className="mx-auto w-14 h-14 bg-muted flex items-center justify-center rounded-xl border border-border group-hover:scale-105 transition-transform duration-300">
            <Upload className="w-6 h-6 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              Drop your file here
            </h3>
            <p className="text-muted-foreground text-sm">
              or <span className="text-foreground font-medium underline underline-offset-4 decoration-foreground/30">browse</span> to choose
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 text-[11px] text-muted-foreground">
            <div className="flex items-center px-2.5 py-1 border border-border rounded-md bg-muted/30">
              <span>Supports: {acceptedTypes.join(', ')}</span>
            </div>
            <div className="flex items-center px-2.5 py-1 border border-border rounded-md bg-muted/30">
              <span>Max size: {maxSize}MB</span>
            </div>
          </div>
        </div>
      </div>

      {uploadError && (
        <div className="flex items-center space-x-2 p-3 bg-red-500/[0.06] border border-red-500/30 text-red-500 text-xs rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}
    </div>
  );
};
