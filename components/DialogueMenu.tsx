import React from 'react';
import type { DialogueState } from '../types';

interface DialogueMenuProps {
  dialogueState: DialogueState;
}

const DialogueMenu: React.FC<DialogueMenuProps> = ({ dialogueState }) => {
  const menuOptions = ['Talk', 'Chat', 'Close'];

  return (
    <ul className="border-2 border-gray-500 bg-gray-900 p-2 w-32 text-sm flex-shrink-0">
      {menuOptions.map((option, index) => (
        <li key={option} className={`p-1 my-1 rounded ${dialogueState.menuSelectionIndex === index ? 'bg-green-700 text-white' : ''}`}>
          {dialogueState.menuSelectionIndex === index && <span className="inline-block mr-2 animate-pulse">▶</span>}
          {option}
        </li>
      ))}
    </ul>
  );
};

export default DialogueMenu;
