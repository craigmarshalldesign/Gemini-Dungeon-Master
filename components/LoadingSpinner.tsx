
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500"></div>
      <p className="text-lg text-green-300">The AI DM is weaving destiny...</p>
    </div>
  );
};

export default LoadingSpinner;
