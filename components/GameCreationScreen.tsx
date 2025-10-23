import React, { useState } from 'react';
import LoadingProgressBar from './LoadingProgressBar';

interface GameCreationScreenProps {
  onCreate: (prompt: string) => void;
  onStartTest: () => void;
  isLoading: boolean;
  error: string | null;
  loadingProgress: number;
  loadingMessage: string;
  title?: string | null;
  subtitle?: string | null;
}

const GameCreationScreen: React.FC<GameCreationScreenProps> = ({ onCreate, onStartTest, isLoading, error, loadingProgress, loadingMessage, title, subtitle }) => {
  const [prompt, setPrompt] = useState('');

  const handleCreate = () => {
    if (prompt.trim()) {
      onCreate(prompt);
    }
  };

  const handleAIChoice = () => {
    const prompts = [
        'A classic fantasy adventure involving a lost artifact and an encroaching darkness.',
        'A steampunk city powered by a mysterious crystal is failing, and clockwork automatons are going haywire.',
        'A vibrant archipelago is slowly being consumed by a magical, colorless fog that erases memories.',
        'In a world where music is magic, a great silence is spreading from the cursed Silent Spire.',
        'A detective story set in a city of elves and dwarves, where a powerful magical item has been stolen.'
    ];
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    onCreate(randomPrompt);
  };

  return (
    <div className="flex flex-col items-center justify-center text-center p-4 bg-black border-2 border-gray-600 h-full rounded-lg">
      <h1 className="text-2xl mb-2 text-yellow-300">{title || 'Gemini Dungeon Master'}</h1>
      <p className="mb-6 text-gray-400 text-xs whitespace-pre-wrap">{subtitle || 'A new world awaits your story.'}</p>
      
      {isLoading ? (
        <LoadingProgressBar progress={loadingProgress} message={loadingMessage} />
      ) : (
        <>
          <p className="mb-2 text-sm">Describe the main storyline for your world:</p>
          <textarea
            className="w-full max-w-lg h-24 p-2 bg-gray-900 border border-gray-500 text-white mb-4 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            placeholder="e.g., A quest to find a cure for a magical plague..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleCreate}
              disabled={!prompt.trim()}
              className="px-6 py-2 bg-green-700 hover:bg-green-600 disabled:bg-gray-500 text-white font-bold tracking-wider border-b-4 border-green-900 hover:border-green-700 rounded"
            >
              Create World
            </button>
            <button
              onClick={handleAIChoice}
              className="px-6 py-2 bg-purple-700 hover:bg-purple-600 text-white font-bold tracking-wider border-b-4 border-purple-900 hover:border-purple-700 rounded"
            >
              Let AI Decide
            </button>
          </div>
           <div className="mt-6 border-t border-gray-600 pt-4 w-full max-w-lg">
             <p className="mb-2 text-sm">Or, for a quick start:</p>
             <button
                onClick={onStartTest}
                className="w-full px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-black font-bold tracking-wider border-b-4 border-yellow-800 hover:border-yellow-700 rounded"
              >
                Start Test World
              </button>
           </div>
        </>
      )}
    </div>
  );
};

export default GameCreationScreen;
