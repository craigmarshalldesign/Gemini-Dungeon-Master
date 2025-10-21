
import React from 'react';
import type { Item, Quest } from '../types';

interface ItemInfoModalProps {
  item: Item;
  quest?: Quest;
  onClose: () => void;
}

const ItemInfoModal: React.FC<ItemInfoModalProps> = ({ item, quest, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-gray-800 text-white border-4 border-gray-600 p-6 rounded-lg max-w-md w-full shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b-2 border-gray-600 pb-2 mb-4">
          <h2 className="text-2xl flex items-center gap-3">
            <span className="text-3xl">{item.emoji}</span>
            {item.name}
          </h2>
          <button onClick={onClose} className="text-2xl font-bold">&times;</button>
        </div>
        
        <p className="italic text-gray-300 mb-4">{item.description}</p>

        {quest && (
          <div>
            <h3 className="text-lg text-yellow-300 border-b border-gray-700 mb-2">Related Quest</h3>
            <div className="bg-gray-900 p-3 rounded">
                <strong className="text-blue-400">{quest.title}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemInfoModal;