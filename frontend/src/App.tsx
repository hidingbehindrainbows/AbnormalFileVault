import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fileService, type SearchParams, type FileInfo } from './services/fileService';
import { FileSearch } from './components/FileSearch';
import { format } from 'date-fns';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navigation } from './components/Navigation';
import { FileUploadPage } from './pages/FileUploadPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000, // Consider data fresh for 5 seconds
      cacheTime: 3600000, // Keep data in cache for 1 hour
    },
  },
});

function App() {
  const [searchParams, setSearchParams] = useState<SearchParams>({});

  const { data: files = [], isLoading: filesLoading } = useQuery<FileInfo[]>(
    ['files', searchParams],
    () => fileService.getFiles(searchParams)
  );

  const { data: stats = { total_files: 0, total_size: 0, storage_saved: 0, duplicate_count: 0 }, isLoading: statsLoading } = useQuery(
    ['stats'],
    () => fileService.getStorageStats()
  );

  const handleSearch = (params: SearchParams) => {
    setSearchParams(params);
  };

  const handleDownload = async (id: string, filename: string) => {
    try {
      await fileService.downloadFile(id);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fileService.deleteFile(id);
      // Invalidate and refetch queries after successful deletion
      queryClient.invalidateQueries(['files']);
      queryClient.invalidateQueries(['stats']);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const calculateStorageSavings = () => {
    if (stats.total_size === 0) return '0%';
    const savingsPercentage = (stats.storage_saved / stats.total_size) * 100;
    return `${savingsPercentage.toFixed(1)}%`;
  };

  if (filesLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <Routes>
          <Route path="/upload" element={<FileUploadPage />} />
          <Route path="/" element={
            <div className="container mx-auto px-4 py-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">File Vault</h1>
                <p className="text-lg text-gray-600">Secure and efficient file management system</p>
                {stats.storage_saved > 0 && (
                  <p className="mt-2 text-sm text-green-600">
                    Deduplication has saved {formatFileSize(stats.storage_saved)} ({calculateStorageSavings()}) of storage space
                  </p>
                )}
              </div>

              <FileSearch onSearch={handleSearch} />

              <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm text-blue-600">Total Files</p>
                    <p className="text-2xl font-semibold text-blue-900">{stats.total_files}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Total Size</p>
                    <p className="text-2xl font-semibold text-blue-900">{formatFileSize(stats.total_size)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Storage Saved</p>
                    <p className="text-2xl font-semibold text-blue-900">{formatFileSize(stats.storage_saved)}</p>
                    {stats.storage_saved > 0 && (
                      <p className="text-xs text-blue-600">({calculateStorageSavings()})</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Duplicates Found</p>
                    <p className="text-2xl font-semibold text-blue-900">{stats.duplicate_count}</p>
                  </div>
                </div>

                {files.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600">No files found. Upload some files to get started!</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {files.map((file) => (
                          <tr key={file.id} className={file.is_duplicate ? 'bg-yellow-50' : ''}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{file.original_filename}</div>
                              {file.is_duplicate && file.original_file_id && (
                                <div className="text-xs text-yellow-600">
                                  Duplicate of file {file.original_file_id}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{file.file_type}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {formatFileSize(file.size)}
                                {file.storage_saved && file.storage_saved > 0 && (
                                  <div className="text-xs text-green-600">
                                    Saved {formatFileSize(file.storage_saved)}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {format(new Date(file.uploaded_at), 'MMM d, yyyy')}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {file.is_duplicate ? (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                  Duplicate
                                </span>
                              ) : (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  Original
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleDownload(file.id, file.original_filename)}
                                className="text-blue-600 hover:text-blue-900 mr-4"
                              >
                                Download
                              </button>
                              <button
                                onClick={() => handleDelete(file.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

// Wrap the app with QueryClientProvider
export default function WrappedApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}
