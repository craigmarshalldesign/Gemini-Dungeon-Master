import React from 'react';

interface ControlsProps {
  onMove: (dx: number, dy: number) => void;
  onInteract: () => void;
  onBack: () => void;
  onInventoryClick: () => void;
  onAbilitiesClick: () => void;
  onQuestsClick: () => void;
  isDPadDisabled?: boolean;
  arePanelButtonsDisabled?: boolean;
  isBackButtonDisabled?: boolean;
  areControlsDimmed?: boolean;
  hasNewQuest?: boolean;
}

const DPadButton: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}> = ({ onClick, children, className, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-10 h-10 bg-gray-700 hover:bg-gray-600 active:bg-gray-800 flex items-center justify-center text-white text-xl disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);

const ActionButton: React.FC<{
  onClick: () => void;
  label: string;
  className?: string;
  disabled?: boolean;
}> = ({ onClick, label, className, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold border-4 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    {label}
  </button>
);

const IconButton: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}> = ({ onClick, children, disabled, className }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`w-12 h-12 bg-gray-700 text-white rounded-full hover:bg-gray-600 border-2 border-gray-600 active:bg-gray-800 disabled:bg-gray-800 disabled:text-gray-500 disabled:border-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${className}`}
    >
        {children}
    </button>
);


const Controls: React.FC<ControlsProps> = ({ 
    onMove, 
    onInteract, 
    onBack, 
    onInventoryClick, 
    onAbilitiesClick, 
    onQuestsClick, 
    isDPadDisabled,
    arePanelButtonsDisabled,
    isBackButtonDisabled,
    areControlsDimmed,
    hasNewQuest,
}) => {
  return (
    <div className={`flex justify-between items-end py-1 ${areControlsDimmed ? 'opacity-50' : ''}`}>
      {/* D-Pad */}
      <div className="grid grid-cols-3 grid-rows-3 w-30 h-30">
        <DPadButton onClick={() => onMove(0, -1)} disabled={isDPadDisabled} className="col-start-2 rounded-t-lg">▲</DPadButton>
        <DPadButton onClick={() => onMove(-1, 0)} disabled={isDPadDisabled} className="row-start-2 rounded-l-lg">◀</DPadButton>
        <div className="col-start-2 row-start-2 bg-gray-700"></div>
        <DPadButton onClick={() => onMove(1, 0)} disabled={isDPadDisabled} className="col-start-3 row-start-2 rounded-r-lg">▶</DPadButton>
        <DPadButton onClick={() => onMove(0, 1)} disabled={isDPadDisabled} className="col-start-2 row-start-3 rounded-b-lg">▼</DPadButton>
      </div>
      
      {/* Right Side Buttons */}
      <div className="flex flex-col items-end gap-3">
          {/* Panel Buttons */}
          <div className="flex items-center gap-2">
              <IconButton onClick={onQuestsClick} disabled={arePanelButtonsDisabled} className={hasNewQuest ? 'bg-yellow-500 border-yellow-300 animate-pulse' : ''}>
                  <span className="text-2xl">❗</span>
              </IconButton>
              <IconButton onClick={onInventoryClick} disabled={arePanelButtonsDisabled}>
                  <span className="text-2xl">🎒</span>
              </IconButton>
              <IconButton onClick={onAbilitiesClick} disabled={arePanelButtonsDisabled}>
                   <span className="text-2xl">✨</span>
              </IconButton>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
              <ActionButton onClick={onBack} label="B" className="bg-red-700 text-white border-red-900" disabled={isBackButtonDisabled} />
              <ActionButton onClick={onInteract} label="A" className="bg-green-600 text-white border-green-800" />
          </div>
      </div>
    </div>
  );
};

export default Controls;