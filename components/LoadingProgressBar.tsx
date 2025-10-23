import React from 'react';

interface LoadingProgressBarProps {
  progress: number;
  message: string;
}

const LoadingProgressBar: React.FC<LoadingProgressBarProps> = ({ progress, message }) => {
  return (
    <div className="w-full max-w-lg text-center p-4">
      <div className="w-full bg-gray-900 border-2 border-gray-500 h-8 p-1 mb-2">
        <div 
          className="bg-blue-600 h-full transition-all duration-500 ease-in-out flex items-center justify-end" 
          style={{ width: `${progress}%` }}
        >
          <span className="text-white font-bold text-sm pr-2">{Math.round(progress)}%</span>
        </div>
      </div>
      <p className="text-lg text-green-300 min-h-12 flex items-center justify-center break-words">{message}</p>
    </div>
  );
};

export default LoadingProgressBar;