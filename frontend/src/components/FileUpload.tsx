import React, { useCallback, useState } from 'react';
import { fileService } from '../services/fileService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FILE_TYPES } from '../config/fileTypes';

interface UploadStatus {
  filename: string;
  status: 'uploading' | 'success' | 'duplicate' | 'error';
  progress: number;
  message?: string;
  fileType?: string;
}

export const FileUpload: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([]);
  const [selectedType, setSelectedType] = useState<string>('');
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      try {
        console.log('Validating file:', file.name, file.type, file.size);
        const validationResult = await fileService.validateFile(file);
        if (!validationResult.isValid) {
          console.error('File validation failed:', validationResult.error);
          throw new Error(validationResult.error);
        }
        console.log('Uploading file:', file.name);
        const response = await fileService.uploadFile(file, selectedType);
        console.log('Upload response:', response);
        return response;
      } catch (error) {
        console.error('Upload error:', error);
        throw error;
      }
    },
    onSuccess: (response, file) => {
      console.log('Upload success:', response);
      setUploadStatuses(prev => prev.map(status => 
        status.filename === file.name
          ? {
              ...status,
              status: response.is_duplicate ? 'duplicate' : 'success',
              message: response.is_duplicate 
                ? response.message || `File already exists. Storage saved: ${formatBytes(response.storage_saved ?? file.size)}`
                : 'Upload complete'
            }
          : status
      ));
      
      queryClient.invalidateQueries(['files']);
      queryClient.invalidateQueries(['stats']);
    },
    onError: (error: Error, file) => {
      console.error('Upload mutation error:', error);
      setUploadStatuses(prev => prev.map(status => 
        status.filename === file.name
          ? {
              ...status,
              status: 'error',
              message: error.message || 'Upload failed'
            }
          : status
      ));
    }
  });

  const formatBytes = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFileType = useCallback((file: File): boolean => {
    if (!selectedType) {
      setUploadStatuses(prev => [...prev, {
        filename: file.name,
        status: 'error',
        progress: 0,
        message: 'Please select a file type category first'
      }]);
      return false;
    }

    const fileTypeConfig = FILE_TYPES[selectedType];
    if (!fileTypeConfig.acceptedMimeTypes.includes(file.type)) {
      setUploadStatuses(prev => [...prev, {
        filename: file.name,
        status: 'error',
        progress: 0,
        message: `Invalid file type. Expected ${fileTypeConfig.name}`
      }]);
      return false;
    }

    if (file.size > fileTypeConfig.maxSize) {
      setUploadStatuses(prev => [...prev, {
        filename: file.name,
        status: 'error',
        progress: 0,
        message: `File size exceeds maximum limit of ${formatBytes(fileTypeConfig.maxSize)}`
      }]);
      return false;
    }

    return true;
  }, [selectedType, setUploadStatuses, formatBytes]);

  const processFiles = useCallback(async (files: File[]) => {
    const validFiles = files.filter(validateFileType);
    
    setUploadStatuses(validFiles.map(file => ({
      filename: file.name,
      status: 'uploading',
      progress: 0,
      fileType: selectedType
    })));

    for (const file of validFiles) {
      try {
        await uploadMutation.mutateAsync(file);
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }
  }, [uploadMutation, validateFileType, selectedType]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  }, [processFiles, setIsDragging]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
    e.target.value = '';
  }, [processFiles]);

  const getStatusColor = (status: UploadStatus['status']) => {
    switch (status) {
      case 'uploading': return 'text-blue-500';
      case 'success': return 'text-green-500';
      case 'duplicate': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="mb-8">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select File Type</label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(FILE_TYPES).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setSelectedType(key)}
              className={`
                p-4 rounded-lg border-2 transition-all duration-200
                flex flex-col items-center justify-center gap-2
                ${selectedType === key 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-200 hover:border-blue-200 text-gray-600'
                }
              `}
            >
              <span className="text-2xl">{config.icon}</span>
              <span className="text-sm font-medium">{config.name}</span>
              <span className="text-xs text-gray-500">{formatBytes(config.maxSize)}</span>
            </button>
          ))}
        </div>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center
          transition-colors duration-200 ease-in-out
          ${!selectedType 
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
            : isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-blue-400'
          }
        `}
      >
        <div className="flex flex-col items-center justify-center">
          <svg
            className={`w-12 h-12 mb-4 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="mb-2 text-lg font-medium text-gray-700">
            {selectedType 
              ? `Drop ${FILE_TYPES[selectedType].name.toLowerCase()} here or click to upload`
              : 'Please select a file type category first'
            }
          </p>
          <p className="text-sm text-gray-500">
            {selectedType 
              ? `Accepted types: ${FILE_TYPES[selectedType].acceptedMimeTypes.join(', ')}`
              : 'Select a category above to enable upload'
            }
          </p>
          {selectedType && (
            <label className="mt-4">
              <input
                type="file"
                className="hidden"
                multiple
                accept={FILE_TYPES[selectedType].acceptedMimeTypes.join(',')}
                onChange={handleFileSelect}
                disabled={!selectedType}
              />
              <span className={`
                px-4 py-2 text-sm font-medium rounded-lg
                ${!selectedType
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer'
                }
              `}>
                Select Files
              </span>
            </label>
          )}
        </div>
      </div>

      {uploadStatuses.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploadStatuses.map((status, index) => (
            <div
              key={`${status.filename}-${index}`}
              className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm"
            >
              <div className="flex items-center space-x-3">
                <div className={`flex-shrink-0 ${getStatusColor(status.status)}`}>
                  {status.status === 'uploading' ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                  ) : status.status === 'success' ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : status.status === 'duplicate' ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{status.filename}</p>
                  <p className="text-xs text-gray-500">{status.message}</p>
                </div>
              </div>
              {status.fileType && (
                <span className={`
                  px-2 py-1 text-xs font-medium rounded-full
                  ${status.status === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}
                `}>
                  {FILE_TYPES[status.fileType].name}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};