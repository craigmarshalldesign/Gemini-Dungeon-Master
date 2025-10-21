
import React from 'react';
import type { Player } from '../types';

interface InventoryModalProps {
  player: Player;
  onClose: () => void;
}

const InventoryModal: React.FC<InventoryModalProps> = ({ player, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-gray-800 text-white border-4 border-gray-600 p-6 rounded-lg max-w-md w-full shadow-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b-2 border-gray-600 pb-2 mb-4">
          <h2 className="text-2xl">{player.name}'s Inventory</h2>
          <button onClick={onClose} className="text-2xl font-bold">&times;</button>
        </div>
        
        <div>
           <h3 className="text-xl mb-2 pb-1">Items ({player.inventory.length}/16)</h3>
           {player.inventory.length > 0 ? (
                <ul className="space-y-3">
                    {player.inventory.map(item => (
                        <li key={item.id}>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{item.emoji}</span>
                                <strong className="text-blue-400">{item.name}</strong>
                            </div>
                            <p className="text-sm text-gray-300 ml-9">{item.description}</p>
                        </li>
                    ))}
                </ul>
           ) : (
            <p className="text-gray-500">Your pockets are empty.</p>
           )}
        </div>
      </div>
    </div>
  );
};

export default InventoryModal;