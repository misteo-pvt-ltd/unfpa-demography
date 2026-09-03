import React from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

interface PageWrapperProps {
  children: React.ReactNode;
  title?: string;
}

const PageWrapper: React.FC<PageWrapperProps> = ({ children, title }) => {
  return (
    <div className="relative min-h-screen bg-white">
      <div className="w-full max-w-[1600px] mx-auto px-4 lg:px-6 pt-6 pb-8">

        <div className="flex justify-between items-center mb-10">
          {title && <h1 className="text-2xl font-black text-gray-900 tracking-tight">{title}</h1>}
          <Link
            to="/"
            className="p-2 text-gray-400 hover:text-orange-500 transition-colors group"
            title="Close and return to dashboard"
          >
            <X className="w-6 h-6" />
          </Link>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PageWrapper;
