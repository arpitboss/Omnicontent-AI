import React, { useCallback, useState, useRef } from 'react';
import { Upload, File, X, Check, AlertCircle, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

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
      setUploadError(`File size must be less than ${ maxSize } MB`);
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
      setUploadError(`File type not supported.Please upload: ${ acceptedTypes.join(', ') } `);
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
        <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 p-6 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-black dark:bg-white" />
          
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center border border-neutral-200 dark:border-neutral-800">
                  <FileIcon className="w-6 h-6 text-black dark:text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 truncate">
                    {uploadedFile.name}
                  </h4>
                  {uploadProgress === 100 && (
                    <div className="flex-shrink-0 w-4 h-4 bg-black dark:bg-white rounded-full flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white dark:text-black" />
                    </div>
                  )}
                </div>
                <p className="text-xs font-mono text-neutral-500 mb-3">
                  {formatFileSize(uploadedFile.size)} • {uploadedFile.type}
                </p>
                
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-mono uppercase">
                      <span className="text-neutral-500">Uploading...</span>
                      <span className="font-bold">{uploadProgress}%</span>
                    </div>
                    <Progress 
                      value={uploadProgress} 
                      className="w-full h-1 rounded-none bg-neutral-100 dark:bg-neutral-900" 
                    />
                  </div>
                )}
                
                {uploadProgress === 100 && !isUploading && (
                  <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                    <Check className="w-3 h-3" />
                    <span>Ready for processing</span>
                  </div>
                )}
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={removeFile}
              className="flex-shrink-0 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-none transition-colors"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {uploadError && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900 text-red-600 text-xs font-mono">
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
          "relative group cursor-pointer transition-all duration-300 border border-dashed p-12",
          dragActive 
            ? "border-black dark:border-white bg-neutral-50 dark:bg-neutral-900" 
            : "border-neutral-300 dark:border-neutral-700 hover:border-black dark:hover:border-white hover:bg-neutral-50 dark:hover:bg-neutral-900"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-neutral-200 dark:border-neutral-800">
            <Upload className="w-8 h-8 text-neutral-500 group-hover:text-black dark:group-hover:text-white transition-colors" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-bold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
              Drop files here
            </h3>
            <p className="text-neutral-500 text-sm font-mono">
              or <span className="text-black dark:text-white font-bold underline decoration-dashed underline-offset-4">browse</span> to choose
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-[10px] font-mono uppercase text-neutral-400">
            <div className="flex items-center space-x-2 px-2 py-1 border border-neutral-200 dark:border-neutral-800">
              <span>Supports: {acceptedTypes.join(', ')}</span>
            </div>
            <div className="flex items-center space-x-2 px-2 py-1 border border-neutral-200 dark:border-neutral-800">
              <span>Max size: {maxSize}MB</span>
            </div>
          </div>
        </div>
      </div>

      {uploadError && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900 text-red-600 text-xs font-mono">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}
    </div>
  );
};
