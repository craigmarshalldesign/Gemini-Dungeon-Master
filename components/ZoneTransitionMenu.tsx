import React from 'react';
import type { ZoneTransitionPrompt } from '../types';

interface ZoneTransitionMenuProps {
  promptState: ZoneTransitionPrompt;
}

const ZoneTransitionMenu: React.FC<ZoneTransitionMenuProps> = ({ promptState }) => {
  const menuOptions = ['Travel', 'Stay'];

  return (
    <ul className="border-2 border-yellow-500 bg-gray-900 p-1 w-24 text-[10px] flex-shrink-0">
      {menuOptions.map((option, index) => (
        <li key={option} className={`p-1 my-0.5 rounded text-center ${promptState.menuSelectionIndex === index ? 'bg-blue-700 text-white' : ''}`}>
          {option}
        </li>
      ))}
    </ul>
  );
};

export default ZoneTransitionMenu;
