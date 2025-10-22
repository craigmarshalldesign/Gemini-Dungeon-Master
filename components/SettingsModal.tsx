import React from 'react';

interface SettingsModalProps {
  onClose: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onEndGame: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, isFullscreen, onToggleFullscreen, onEndGame }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-gray-800 text-white border-4 border-gray-600 p-6 rounded-lg max-w-xs w-full shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b-2 border-gray-600 pb-2 mb-6">
          <h2 className="text-xl">Settings</h2>
          <button onClick={onClose} className="text-2xl font-bold">&times;</button>
        </div>
        <div className="flex flex-col gap-4">
            <button
                onClick={() => { onToggleFullscreen(); onClose(); }}
                className="px-6 py-3 bg-blue-700 hover:bg-blue-600 text-white font-bold tracking-wider border-b-4 border-blue-900 hover:border-blue-700 rounded"
            >
                {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            </button>
            <button
                onClick={() => { onEndGame(); onClose(); }}
                className="px-6 py-3 bg-red-700 hover:bg-red-600 text-white font-bold tracking-wider border-b-4 border-red-900 hover:border-red-700 rounded"
            >
                End Game
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
