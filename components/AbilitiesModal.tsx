
import React from 'react';
import type { Player } from '../types';

interface AbilitiesModalProps {
  player: Player;
  onClose: () => void;
}

const AbilitiesModal: React.FC<AbilitiesModalProps> = ({ player, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-gray-800 text-white border-4 border-gray-600 p-6 rounded-lg max-w-md w-full shadow-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b-2 border-gray-600 pb-2 mb-4">
          <h2 className="text-2xl">{player.name}'s Abilities</h2>
          <button onClick={onClose} className="text-2xl font-bold">&times;</button>
        </div>
        
        <div>
           {player.abilities.length > 0 ? (
                <ul className="space-y-4">
                    {player.abilities.map(ability => (
                        <li key={ability.name} className="bg-gray-900 p-3 rounded">
                            <strong className="text-green-400 text-lg">{ability.name} (Lvl {ability.level})</strong>
                            <p className="text-sm text-gray-400 mt-1 mb-2">{ability.description}</p>
                            <div className="text-sm flex flex-wrap gap-x-4 gap-y-1">
                                {ability.damage > 0 && (
                                    <span>Damage: <span className="font-bold text-white">{ability.damage}</span></span>
                                )}
                                {ability.damageType && (
                                    <span>Type: <span className="font-bold text-white">{ability.damageType}</span></span>
                                )}
                                {ability.effect && (
                                    <span>Effect: <span className="font-bold text-white">{ability.effect.type} {ability.effect.amount} HP</span></span>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
           ) : (
            <p className="text-gray-500">You have no special abilities.</p>
           )}
        </div>
      </div>
    </div>
  );
};

export default AbilitiesModal;