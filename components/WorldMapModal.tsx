import React, { useState } from 'react';
import type { WorldMap, WorldMapZone } from '../types';

interface WorldMapModalProps {
    worldMap: WorldMap;
    currentZoneCoords: { x: number; y: number };
    finalBossZoneCoords: { x: number; y: number };
    visitedZoneCoords: Set<string>;
    zonePath: { x: number; y: number }[];
    completedZoneCoords: Set<string>;
    onClose: () => void;
    onWarpToBoss: () => void;
}

const TERRAIN_COLORS: Record<string, string> = {
    forest: 'bg-green-800 hover:bg-green-700',
    plains: 'bg-yellow-600 hover:bg-yellow-500',
    mountains: 'bg-gray-500 hover:bg-gray-400',
    desert: 'bg-yellow-400 hover:bg-yellow-300',
    swamp: 'bg-teal-800 hover:bg-teal-700',
    grass: 'bg-green-600 hover:bg-green-500',
    wasteland: 'bg-gray-700 hover:bg-gray-600',
    default: 'bg-black hover:bg-gray-900',
};

const WorldMapModal: React.FC<WorldMapModalProps> = ({ worldMap, currentZoneCoords, finalBossZoneCoords, visitedZoneCoords, zonePath, completedZoneCoords, onClose, onWarpToBoss }) => {
    const [selectedCoords, setSelectedCoords] = useState(currentZoneCoords);

    const selectedZone = worldMap[selectedCoords.y][selectedCoords.x];
    const isSelectedBossZone = selectedCoords.x === finalBossZoneCoords.x && selectedCoords.y === finalBossZoneCoords.y;

    const handleWarpClick = () => {
        onWarpToBoss();
        onClose();
    };

    const getZoneClasses = (zone: WorldMapZone) => {
        const isCurrent = zone.x === currentZoneCoords.x && zone.y === currentZoneCoords.y;
        const isSelected = zone.x === selectedCoords.x && zone.y === selectedCoords.y;
        const isVisited = visitedZoneCoords.has(`${zone.x},${zone.y}`);

        let classes = 'aspect-square flex items-center justify-center text-white border-2 transition-all duration-200 cursor-pointer text-xl';
        
        classes += ` ${TERRAIN_COLORS[zone.terrain] || TERRAIN_COLORS.default}`;
        
        if (isSelected) {
            classes += ' ring-4 ring-offset-2 ring-yellow-400 ring-offset-gray-800 z-10';
        } else if (isCurrent) {
            classes += ' ring-4 ring-offset-2 ring-blue-400 ring-offset-gray-800';
        } else {
            classes += ' border-gray-900';
        }
        
        if (!isVisited) {
            classes += ' filter brightness-50';
        }
        
        return classes;
    }

    const getZoneContent = (zone: WorldMapZone) => {
        const key = `${zone.x},${zone.y}`;
        const isBoss = zone.x === finalBossZoneCoords.x && zone.y === finalBossZoneCoords.y;
        if (isBoss) return '💀';
        const isCurrent = zone.x === currentZoneCoords.x && zone.y === currentZoneCoords.y;
        if (isCurrent) return 'P';
        if (completedZoneCoords.has(key)) return <span className="text-yellow-300">✔️</span>;
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div 
                className="bg-gray-800 text-white border-4 border-gray-600 p-6 rounded-lg max-w-xl w-full shadow-lg max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center border-b-2 border-gray-600 pb-2 mb-4">
                    <h2 className="text-lg">World Map</h2>
                    <button onClick={onClose} className="text-2xl font-bold">&times;</button>
                </div>
                
                <div className="relative grid grid-cols-6 gap-1 bg-black p-1">
                    {/* Path Overlay */}
                    <div className="absolute inset-1 z-5 pointer-events-none">
                        {zonePath.slice(0, -1).map((point, i) => {
                            const nextPoint = zonePath[i + 1];
                            const MAP_SIZE = 6;
                            const segmentWidth = 100 / MAP_SIZE;
                            
                            let style: React.CSSProperties = {
                                position: 'absolute',
                                backgroundColor: 'rgba(239, 68, 68, 0.8)', // red-500 with opacity
                                zIndex: 5,
                            };

                            if (point.x === nextPoint.x) { // Vertical
                                style.left = `${(point.x + 0.5) * segmentWidth}%`;
                                style.top = `${(Math.min(point.y, nextPoint.y) + 0.5) * segmentWidth}%`;
                                style.width = '4px';
                                style.height = `${segmentWidth}%`;
                                style.transform = 'translateX(-50%)';
                            } else { // Horizontal
                                style.left = `${(Math.min(point.x, nextPoint.x) + 0.5) * segmentWidth}%`;
                                style.top = `${(point.y + 0.5) * segmentWidth}%`;
                                style.height = '4px';
                                style.width = `${segmentWidth}%`;
                                style.transform = 'translateY(-50%)';
                            }

                            return <div key={`path-${i}`} style={style} />;
                        })}
                    </div>

                    {/* Grid Cells */}
                    {worldMap.flat().map(zone => (
                        <button 
                            key={`${zone.x}-${zone.y}`} 
                            className={getZoneClasses(zone)}
                            onClick={() => setSelectedCoords({x: zone.x, y: zone.y})}
                        >
                            <span className="relative z-10">{getZoneContent(zone)}</span>
                        </button>
                    ))}
                </div>

                <div className="mt-4 p-4 bg-gray-900 border-2 border-gray-600 min-h-[100px]">
                    <h3 className="text-base text-yellow-300">{selectedZone.name}</h3>
                    <p className="text-xs text-gray-400 capitalize">({selectedZone.terrain})</p>
                    <p className="text-xs text-gray-300 mt-1 italic">
                        {selectedZone.description}
                    </p>
                    {isSelectedBossZone && (
                        <p className="text-red-400 font-bold mt-2 text-sm">
                            💀 Final Boss Location
                        </p>
                    )}
                </div>
                 <div className="mt-4">
                    <button
                        onClick={handleWarpClick}
                        className="w-full px-6 py-2 bg-red-700 hover:bg-red-600 text-white font-bold tracking-wider border-b-4 border-red-900 hover:border-red-700 rounded"
                    >
                        Warp to Boss (Debug)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WorldMapModal;