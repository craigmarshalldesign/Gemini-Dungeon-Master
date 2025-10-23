import React from 'react';
import type { DialogueState } from '../types';

interface DialogueMenuProps {
  dialogueState: DialogueState;
}

const DialogueMenu: React.FC<DialogueMenuProps> = ({ dialogueState }) => {
  const menuOptions = ['Talk', 'Chat', 'Close'];

  return (
    <ul className="border-2 border-gray-500 bg-gray-900 p-1 w-24 text-[10px] flex-shrink-0">
      {menuOptions.map((option, index) => (
        <li key={option} className={`p-1 my-0.5 rounded text-center ${dialogueState.menuSelectionIndex === index ? 'bg-green-700 text-white' : ''}`}>
          {option}
        </li>
      ))}
    </ul>
  );
};

export default DialogueMenu;
