import React from 'react';

interface ErrorModalProps {
  error: string;
  onClose: () => void;
}

const ErrorModal: React.FC<ErrorModalProps> = ({ error, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-gray-800 text-white border-4 border-red-500 p-6 rounded-lg max-w-md w-full shadow-lg max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b-2 border-red-500 pb-2 mb-4">
          <h2 className="text-xl text-red-400">An Error Occurred</h2>
          <button onClick={onClose} className="text-2xl font-bold">&times;</button>
        </div>
        <div className="flex-grow overflow-y-auto pr-2">
            <p className="text-sm text-gray-300 whitespace-pre-wrap break-words">
                {error}
            </p>
        </div>
        <div className="mt-6 text-right">
            <button
            onClick={onClose}
            className="px-6 py-2 bg-red-700 hover:bg-red-600 text-white font-bold tracking-wider border-b-4 border-red-900 hover:border-red-700 rounded"
            >
            Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;
