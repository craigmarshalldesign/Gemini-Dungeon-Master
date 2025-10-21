
import React from 'react';
import type { NPC, Item } from '../types';

interface DebugInfoModalProps {
  data: Item;
  onClose: () => void;
}

const DebugInfoModal: React.FC<DebugInfoModalProps> = ({ data, onClose }) => {
  const title = `Item: ${data.name}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-gray-900 text-white border-4 border-gray-500 p-6 rounded-lg max-w-lg w-full shadow-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b-2 border-gray-600 pb-2 mb-4">
          <h2 className="text-xl text-yellow-300">Debug Info: {title}</h2>
          <button onClick={onClose} className="text-2xl font-bold">&times;</button>
        </div>
        <pre className="text-xs bg-black p-4 whitespace-pre-wrap break-all">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default DebugInfoModal;
