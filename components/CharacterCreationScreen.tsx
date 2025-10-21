
import React, { useState } from 'react';
import { ClassType } from '../types';
import { CHARACTER_CLASSES } from '../constants';

interface CharacterCreationScreenProps {
  onCreate: (p1Name: string, p1Class: ClassType, p2Name: string, p2Class: ClassType) => void;
  isLoading: boolean;
}

const CharacterCreationScreen: React.FC<CharacterCreationScreenProps> = ({ onCreate, isLoading }) => {
  const [p1Name, setP1Name] = useState('');
  const [p1Class, setP1Class] = useState<ClassType>(ClassType.WARRIOR);
  const [p2Name, setP2Name] = useState('');
  const [p2Class, setP2Class] = useState<ClassType>(ClassType.WIZARD);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (p1Name && p2Name) {
      onCreate(p1Name, p1Class, p2Name, p2Class);
    }
  };

  const ClassSelector: React.FC<{ selectedClass: ClassType; onSelect: (c: ClassType) => void }> = ({ selectedClass, onSelect }) => (
    <div className="flex gap-2">
      {Object.values(ClassType).map(c => (
        <button
          key={c}
          type="button"
          onClick={() => onSelect(c)}
          className={`px-4 py-1 text-sm border-2 ${selectedClass === c ? 'bg-green-500 border-white text-black' : 'bg-gray-700 border-gray-500 text-white'}`}
        >
          {c}
        </button>
      ))}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-black border-2 border-gray-600">
      <h2 className="text-xl text-center mb-6">Create Your Adventurers</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Player 1 */}
        <div className="p-4 border border-gray-500">
          <h3 className="text-lg text-green-400 mb-4">Player 1</h3>
          <div className="mb-4">
            <label htmlFor="p1Name" className="block mb-1 text-gray-400">Name</label>
            <input
              id="p1Name"
              type="text"
              value={p1Name}
              onChange={(e) => setP1Name(e.target.value)}
              className="w-full p-2 bg-gray-900 border border-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2 text-gray-400">Class</label>
            <ClassSelector selectedClass={p1Class} onSelect={setP1Class} />
            <p className="text-xs text-gray-500 mt-2">
              HP: {CHARACTER_CLASSES[p1Class].baseStats.hp}, STR: {CHARACTER_CLASSES[p1Class].baseStats.str}, INT: {CHARACTER_CLASSES[p1Class].baseStats.int}, DEF: {CHARACTER_CLASSES[p1Class].baseStats.def}
            </p>
          </div>
        </div>
        {/* Player 2 */}
        <div className="p-4 border border-gray-500">
          <h3 className="text-lg text-purple-400 mb-4">Player 2</h3>
          <div className="mb-4">
            <label htmlFor="p2Name" className="block mb-1 text-gray-400">Name</label>
            <input
              id="p2Name"
              type="text"
              value={p2Name}
              onChange={(e) => setP2Name(e.target.value)}
              className="w-full p-2 bg-gray-900 border border-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2 text-gray-400">Class</label>
            <ClassSelector selectedClass={p2Class} onSelect={setP2Class} />
            <p className="text-xs text-gray-500 mt-2">
              HP: {CHARACTER_CLASSES[p2Class].baseStats.hp}, STR: {CHARACTER_CLASSES[p2Class].baseStats.str}, INT: {CHARACTER_CLASSES[p2Class].baseStats.int}, DEF: {CHARACTER_CLASSES[p2Class].baseStats.def}
            </p>
          </div>
        </div>
      </div>
      <div className="text-center mt-6">
        <button
          type="submit"
          disabled={isLoading || !p1Name || !p2Name}
          className="px-8 py-3 bg-green-700 hover:bg-green-600 disabled:bg-gray-500 text-white font-bold tracking-wider border-b-4 border-green-900 hover:border-green-700 rounded"
        >
          Begin Adventure
        </button>
      </div>
    </form>
  );
};

export default CharacterCreationScreen;