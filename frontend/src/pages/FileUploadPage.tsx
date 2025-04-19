import React from 'react';
import { FileUpload } from '../components/FileUpload';

export const FileUploadPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Upload Files</h1>
        <p className="text-gray-600 mb-8">
          Select a file type category and upload your files. We support various file formats and automatically detect duplicates to save storage space.
        </p>
        <FileUpload />
      </div>
    </div>
  );
}; 