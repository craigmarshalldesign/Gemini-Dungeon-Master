
import React from 'react';
import type { NPC } from '../types';

interface NpcInfoModalProps {
  npc: NPC;
  onClose: () => void;
}

const NpcInfoModal: React.FC<NpcInfoModalProps> = ({ npc, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-gray-800 text-white border-4 border-gray-600 p-6 rounded-lg max-w-md w-full shadow-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b-2 border-gray-600 pb-2 mb-4">
          <h2 className="text-2xl">{npc.name}</h2>
          <button onClick={onClose} className="text-2xl font-bold">&times;</button>
        </div>
        <p className="italic text-sm text-gray-400 mb-4">{npc.role}</p>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg text-yellow-300 border-b border-gray-700 mb-2">Description</h3>
            <p className="text-sm">{npc.description}</p>
          </div>
          <div>
            <h3 className="text-lg text-yellow-300 border-b border-gray-700 mb-2">Personality</h3>
            <p className="text-sm">{npc.personality}</p>
          </div>
          <div>
            <h3 className="text-lg text-yellow-300 border-b border-gray-700 mb-2">Stats</h3>
            <div className="grid grid-cols-3 gap-2 text-sm bg-gray-900 p-2">
                <div><span className="text-gray-400">HP:</span> {npc.stats.hp}</div>
                <div><span className="text-gray-400">STR:</span> {npc.stats.str}</div>
                <div><span className="text-gray-400">INT:</span> {npc.stats.int}</div>
            </div>
          </div>
          {npc.quest && (
            <div>
              <h3 className="text-lg text-yellow-300 border-b border-gray-700 mb-2">Quest</h3>
              <div className="bg-gray-900 p-3 rounded">
                  <strong className="text-blue-400">{npc.quest.title}</strong>
                  <p className="text-sm text-gray-300 mt-1">{npc.quest.description}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NpcInfoModal;
