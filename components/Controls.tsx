import React from 'react';

interface ControlsProps {
  onMove: (dx: number, dy: number) => void;
  onInteract: () => void;
  onSwitchPlayer: () => void;
  onBack: () => void;
  onInventoryClick: () => void;
  onAbilitiesClick: () => void;
  onQuestsClick: () => void;
  activePlayerName: string;
  isDPadDisabled?: boolean;
  arePanelButtonsDisabled?: boolean;
  isSwitchPlayerDisabled?: boolean;
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
    className={`w-12 h-12 bg-gray-700 hover:bg-gray-600 active:bg-gray-800 border-2 border-gray-500 flex items-center justify-center text-white text-2xl disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
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
    className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border-4 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    {label}
  </button>
);

const PanelButton: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}> = ({ onClick, children, disabled }) => (
    <button 
        onClick={onClick} 
        disabled={disabled}
        className="w-28 px-2 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 border-b-4 border-gray-800 active:border-b-0 disabled:bg-gray-800 disabled:text-gray-500 disabled:border-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
    >
        {children}
    </button>
);


const Controls: React.FC<ControlsProps> = ({ 
    onMove, 
    onInteract, 
    onSwitchPlayer, 
    onBack, 
    onInventoryClick, 
    onAbilitiesClick, 
    onQuestsClick, 
    activePlayerName, 
    isDPadDisabled,
    arePanelButtonsDisabled,
    isSwitchPlayerDisabled,
    isBackButtonDisabled,
    areControlsDimmed,
    hasNewQuest,
}) => {
  return (
    <div className={`flex flex-col items-center gap-4 p-4 rounded ${areControlsDimmed ? 'opacity-50' : ''}`}>
        <div className="text-center mb-2">
            <p className="text-sm text-gray-400">Controlling</p>
            <p className="font-bold text-lg">{activePlayerName}</p>
        </div>
      <div className="flex items-center gap-8">
        {/* D-Pad */}
        <div className="grid grid-cols-3 grid-rows-3 w-36 h-36">
          <div className="col-start-2">
            <DPadButton onClick={() => onMove(0, -1)} disabled={isDPadDisabled}>▲</DPadButton>
          </div>
          <div className="col-start-1 row-start-2">
            <DPadButton onClick={() => onMove(-1, 0)} disabled={isDPadDisabled}>◀</DPadButton>
          </div>
          <div className="col-start-3 row-start-2">
            <DPadButton onClick={() => onMove(1, 0)} disabled={isDPadDisabled}>▶</DPadButton>
          </div>
          <div className="col-start-2 row-start-3">
            <DPadButton onClick={() => onMove(0, 1)} disabled={isDPadDisabled}>▼</DPadButton>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
            {/* Action Buttons */}
            <div className="flex flex-col items-center gap-4">
                <ActionButton onClick={onBack} label="B" className="bg-red-700 text-white border-red-900" disabled={isBackButtonDisabled} />
                <ActionButton onClick={onInteract} label="A" className="bg-green-600 text-white border-green-800" />
            </div>

            {/* Info Panel */}
            <div className="flex flex-col items-center gap-2 self-stretch justify-around">
                <PanelButton onClick={onQuestsClick} disabled={arePanelButtonsDisabled}>
                    Quests {hasNewQuest && <span className="text-yellow-400 animate-pulse ml-1">!</span>}
                </PanelButton>
                <PanelButton onClick={onInventoryClick} disabled={arePanelButtonsDisabled}>Inventory</PanelButton>
                <PanelButton onClick={onAbilitiesClick} disabled={arePanelButtonsDisabled}>Abilities</PanelButton>
            </div>
        </div>
      </div>
      <button 
        onClick={onSwitchPlayer} 
        disabled={isSwitchPlayerDisabled}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 border-b-4 border-blue-800 active:border-b-0 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Switch Player
      </button>
    </div>
  );
};

export default Controls;