import React from 'react';
import type { Zone, Player, Item, NPC, Direction } from '../types';

interface MapViewProps {
  zone: Zone;
  players: [Player, Player];
  activePlayerId: number;
  onSelectObject: (obj: Item | NPC) => void;
  entryPosition: { x: number; y: number } | null;
  exitPosition: { x: number; y: number } | null;
}

const TILE_COLORS: { [key: string]: string } = {
  grass: 'bg-green-800',
  tree: 'bg-green-900',
  water: 'bg-blue-700',
  path: 'bg-yellow-900',
  building: 'bg-gray-600',
  entry: 'bg-blue-400 animate-pulse',
  exit: 'bg-yellow-400 animate-pulse',
  default: 'bg-black',
};

const directionToRotation: Record<Direction, string> = {
    up: '-rotate-90',
    down: 'rotate-90',
    left: 'rotate-180',
    right: 'rotate-0',
};

const MapView: React.FC<MapViewProps> = ({ zone, players, activePlayerId, onSelectObject, entryPosition, exitPosition }) => {
  const mapSize = 20;
  
  const renderTile = (tile: string, x: number, y: number) => {
    const playerOnTile = players.find(p => p.position.x === x && p.position.y === y);
    const npcOnTile = zone.npcs.find(n => n.position.x === x && n.position.y === y);
    const itemOnTile = zone.items.find(i => i.position?.x === x && i.position.y === y);

    const isEntryTile = entryPosition && x === entryPosition.x && y === entryPosition.y;
    const isExitTile = exitPosition && x === exitPosition.x && y === exitPosition.y;
    
    let finalTile = tile;
    if (isEntryTile) finalTile = 'entry';
    if (isExitTile) finalTile = 'exit';
    
    const color = TILE_COLORS[finalTile] || TILE_COLORS.default;

    let content = null;
    if (playerOnTile) {
        const isPlayer1 = playerOnTile.id === 0;
        const isActive = playerOnTile.id === activePlayerId;
        const rotationClass = directionToRotation[playerOnTile.direction];
        content = (
            <div className={`w-full h-full rounded-full ${isPlayer1 ? 'bg-green-400' : 'bg-purple-400'} flex items-center justify-center text-black font-bold text-xs relative ${isActive ? 'ring-2 ring-white' : ''}`}>
                P{playerOnTile.id + 1}
                 <div className={`absolute text-black text-xs ${rotationClass}`} style={{ right: '-2px' }}>▶</div>
            </div>
        );
    } else if (npcOnTile) {
        content = (
            <div 
                onClick={() => onSelectObject(npcOnTile)}
                className="w-full h-full rounded-full bg-yellow-400 flex items-center justify-center text-black font-bold text-xs cursor-pointer hover:ring-2 ring-yellow-200"
            >
                N
            </div>
        );
    } else if (itemOnTile) {
        content = (
             <div 
                onClick={() => onSelectObject(itemOnTile)}
                className="w-3/4 h-3/4 rounded bg-blue-400 flex items-center justify-center text-black font-bold text-xs cursor-pointer hover:ring-2 ring-blue-200"
            >
                I
            </div>
        );
    }

    return (
      <div key={`${x}-${y}`} className={`w-full h-full ${color} flex items-center justify-center`}>
        {content}
      </div>
    );
  };

  return (
    <div 
        className="grid bg-black border-4 border-gray-600 w-full rounded-lg overflow-hidden"
        style={{ 
            gridTemplateColumns: `repeat(${mapSize}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${mapSize}, minmax(0, 1fr))`,
            aspectRatio: '1 / 1',
        }}
    >
      {zone.tileMap.map((row, y) =>
        row.map((tile, x) => renderTile(tile, x, y))
      )}
    </div>
  );
};

export default MapView;
