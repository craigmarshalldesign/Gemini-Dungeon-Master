import React from 'react';

interface ControlsProps {
  onMove: (dx: number, dy: number) => void;
  onInteract: () => void;
  onBack: () => void;
  onInventoryClick: () => void;
  onAbilitiesClick: () => void;
  onQuestsClick: () => void;
  onSettingsClick: () => void;
  isDPadDisabled?: boolean;
  arePanelButtonsDisabled?: boolean;
  isBackButtonDisabled?: boolean;
  areControlsDimmed?: boolean;
  hasNewQuest?: boolean;
  pressedKeys: Set<string>;
}

const DPadButton: React.FC<{
  onPress: () => void;
  onRelease: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  isKeyboardActive?: boolean;
}> = ({ onPress, onRelease, children, className, disabled, isKeyboardActive }) => {
    const [isPointerDown, setIsPointerDown] = React.useState(false);
    const isActive = !disabled && (isPointerDown || isKeyboardActive);

    const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
        if ('preventDefault' in e) e.preventDefault();
        setIsPointerDown(true);
        onPress();
    };

    const handlePointerUp = () => {
        setIsPointerDown(false);
        onRelease();
    };

    return (
        <button
            onMouseDown={handlePointerDown}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchEnd={handlePointerUp}
            disabled={disabled}
            className={`w-10 h-10 hover:bg-gray-600 transform transition-transform flex items-center justify-center text-white text-xl disabled:opacity-50 disabled:cursor-not-allowed select-none ${isActive ? 'bg-gray-900 scale-95' : 'bg-gray-700'} ${className}`}
        >
            {children}
        </button>
    );
};

const ActionButton: React.FC<{
  onClick: () => void;
  label: string;
  className?: string;
  disabled?: boolean;
  isKeyboardActive?: boolean;
}> = ({ onClick, label, className, disabled, isKeyboardActive }) => {
    const [isPointerDown, setIsPointerDown] = React.useState(false);
    const isActive = !disabled && (isPointerDown || isKeyboardActive);

    const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
        if ('preventDefault' in e) e.preventDefault();
        setIsPointerDown(true);
    };

    const handlePointerUp = () => {
        setIsPointerDown(false);
    };

    return (
        <button
            onClick={onClick}
            onMouseDown={handlePointerDown}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchEnd={handlePointerUp}
            disabled={disabled}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold border-4 disabled:opacity-50 disabled:cursor-not-allowed transition-transform transform ${isActive ? 'scale-90 brightness-125' : ''} ${className}`}
        >
            {label}
        </button>
    );
};

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
    onSettingsClick,
    isDPadDisabled,
    arePanelButtonsDisabled,
    isBackButtonDisabled,
    areControlsDimmed,
    hasNewQuest,
    pressedKeys,
}) => {
  const moveIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => {
    // Cleanup interval on component unmount
    return () => {
        if (moveIntervalRef.current) {
            clearInterval(moveIntervalRef.current);
        }
    };
  }, []);

  const handleMovePress = (dx: number, dy: number) => {
      if (isDPadDisabled) return;
      
      handleMoveRelease(); // Clear any existing interval
      onMove(dx, dy); // Move once immediately
      
      moveIntervalRef.current = setInterval(() => {
          onMove(dx, dy);
      }, 50); // Fire events rapidly for high responsiveness
  };

  const handleMoveRelease = () => {
      if (moveIntervalRef.current) {
          clearInterval(moveIntervalRef.current);
          moveIntervalRef.current = null;
      }
  };


  return (
    <div className={`flex justify-around items-end py-2 ${areControlsDimmed ? 'opacity-50' : ''}`}>
      {/* D-Pad */}
      <div className="grid grid-cols-3 grid-rows-3 w-30 h-30">
        <DPadButton onPress={() => handleMovePress(0, -1)} onRelease={handleMoveRelease} disabled={isDPadDisabled} className="col-start-2 rounded-t-lg" isKeyboardActive={pressedKeys.has('w')}>▲</DPadButton>
        <DPadButton onPress={() => handleMovePress(-1, 0)} onRelease={handleMoveRelease} disabled={isDPadDisabled} className="row-start-2 rounded-l-lg" isKeyboardActive={pressedKeys.has('a')}>◀</DPadButton>
        <div className="col-start-2 row-start-2 bg-gray-700"></div>
        <DPadButton onPress={() => handleMovePress(1, 0)} onRelease={handleMoveRelease} disabled={isDPadDisabled} className="col-start-3 row-start-2 rounded-r-lg" isKeyboardActive={pressedKeys.has('d')}>▶</DPadButton>
        <DPadButton onPress={() => handleMovePress(0, 1)} onRelease={handleMoveRelease} disabled={isDPadDisabled} className="col-start-2 row-start-3 rounded-b-lg" isKeyboardActive={pressedKeys.has('s')}>▼</DPadButton>
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
          <div className="flex items-center gap-2">
              <IconButton onClick={onSettingsClick} disabled={areControlsDimmed}>
                <span className="text-2xl">⚙️</span>
              </IconButton>
              <ActionButton onClick={onBack} label="B" className="bg-red-700 text-white border-red-900" disabled={isBackButtonDisabled} isKeyboardActive={pressedKeys.has('r')} />
              <ActionButton onClick={onInteract} label="A" className="bg-green-600 text-white border-green-800" isKeyboardActive={pressedKeys.has('e')} />
          </div>
      </div>
    </div>
  );
};

export default Controls;
