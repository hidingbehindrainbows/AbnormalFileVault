import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Navigation: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navLinkClasses = (path: string) => `
    px-4 py-2 rounded-lg transition-colors duration-200
    ${isActive(path)
      ? 'bg-blue-100 text-blue-700'
      : 'text-gray-600 hover:bg-gray-100'
    }
  `;

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-gray-900">
              File Hub
            </Link>
          </div>
          
          <div className="flex space-x-4">
            <Link to="/" className={navLinkClasses('/')}>
              Dashboard
            </Link>
            <Link to="/upload" className={navLinkClasses('/upload')}>
              Upload Files
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}; 