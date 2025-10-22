import React, { useState } from 'react';
import LoadingProgressBar from './LoadingProgressBar';

interface GameCreationScreenProps {
  onCreate: (prompt: string) => void;
  isLoading: boolean;
  error: string | null;
  loadingProgress: number;
  loadingMessage: string;
}

const GameCreationScreen: React.FC<GameCreationScreenProps> = ({ onCreate, isLoading, error, loadingProgress, loadingMessage }) => {
  const [prompt, setPrompt] = useState('');

  const handleCreate = () => {
    if (prompt.trim()) {
      onCreate(prompt);
    }
  };

  const handleAIChoice = () => {
    onCreate('A classic fantasy adventure involving a lost artifact and an encroaching darkness.');
  };

  return (
    <div className="flex flex-col items-center justify-center text-center p-4 bg-black border-2 border-gray-600 h-full rounded-lg">
      <h2 className="text-xl mb-4">Create Your World</h2>
      <p className="mb-4 text-gray-400">Describe the main storyline for your adventure, or let the AI choose for you.</p>
      
      {isLoading ? (
        <LoadingProgressBar progress={loadingProgress} message={loadingMessage} />
      ) : (
        <>
          <textarea
            className="w-full max-w-lg h-32 p-2 bg-gray-900 border border-gray-500 text-white mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
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
        </>
      )}
    </div>
  );
};

export default GameCreationScreen;