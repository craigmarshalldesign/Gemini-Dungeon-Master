
import React from 'react';
import type { Player } from '../types';

interface CharacterSheetModalProps {
  player: Player;
  onClose: () => void;
}

const CharacterSheetModal: React.FC<CharacterSheetModalProps> = ({ player, onClose }) => {
  const xpPercentage = (player.stats.xp / player.stats.nextLevelXp) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-gray-800 text-white border-4 border-gray-600 p-6 rounded-lg max-w-md w-full shadow-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b-2 border-gray-600 pb-2 mb-4">
          <h2 className="text-2xl">{player.name}</h2>
          <button onClick={onClose} className="text-2xl font-bold">&times;</button>
        </div>
        <p className="text-lg mb-4">{`Level ${player.stats.level} ${player.classType}`}</p>
        
        <div className="grid grid-cols-2 gap-4 mb-4 bg-gray-900 p-3">
          <div><span className="text-gray-400">HP:</span> {player.stats.hp} / {player.stats.maxHp}</div>
          <div><span className="text-gray-400">STR:</span> {player.stats.str}</div>
          <div><span className="text-gray-400">INT:</span> {player.stats.int}</div>
          <div><span className="text-gray-400">DEF:</span> {player.stats.def}</div>
        </div>
        
        {/* XP Bar */}
        <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">XP</span>
                <span>{player.stats.xp} / {player.stats.nextLevelXp}</span>
            </div>
            <div className="w-full bg-gray-700 h-4 border-2 border-gray-600">
                <div className="bg-purple-500 h-full" style={{ width: `${xpPercentage}%` }}></div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterSheetModal;