import React from 'react';
import type { Quest } from '../types';
import { QuestStatus } from '../types';

interface QuestsModalProps {
  mainStory: string;
  quests: Quest[];
  worldName: string;
  onClose: () => void;
}

const QuestsModal: React.FC<QuestsModalProps> = ({ mainStory, quests, worldName, onClose }) => {
  const localQuests = quests.filter(q => q.status !== QuestStatus.INACTIVE);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-gray-800 text-white border-4 border-gray-600 p-6 rounded-lg max-w-md w-full shadow-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b-2 border-gray-600 pb-2 mb-4">
          <h2 className="text-lg">Quest Log</h2>
          <button onClick={onClose} className="text-2xl font-bold">&times;</button>
        </div>
        
        <div className="mb-6">
            <h3 className="text-base text-yellow-300 mb-2 pb-1">Main Quest: {worldName}</h3>
            <p className="text-[10px] text-gray-300">{mainStory}</p>
        </div>

        <div>
           <h3 className="text-base text-yellow-300 mb-2 pb-1">Local Quests</h3>
           {localQuests.length > 0 ? (
                <ul className="space-y-4">
                    {localQuests.map(quest => (
                        <li key={quest.id}>
                            <div className="flex justify-between items-baseline">
                                <strong className="text-blue-400 text-xs">{quest.title}</strong>
                                <span className={`text-[10px] px-2 py-0.5 rounded ${quest.status === QuestStatus.COMPLETED ? 'bg-green-700' : 'bg-yellow-700'}`}>
                                    {quest.status}
                                </span>
                            </div>
                            <p className="text-[10px] text-gray-300 ml-4 mt-1">{quest.description}</p>
                        </li>
                    ))}
                </ul>
           ) : (
            <p className="text-gray-500 text-xs">No active local quests.</p>
           )}
        </div>
      </div>
    </div>
  );
};

export default QuestsModal;