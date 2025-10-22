
import React, { useState, useEffect, useRef } from 'react';
import type { NPC } from '../types';

interface ChatModalProps {
  npc: NPC;
  chatHistory: { author: 'player' | 'npc'; text: string }[];
  messagesSent: number;
  isLoading: boolean;
  onClose: () => void;
  onSend: (message: string) => void;
  onNewConversation: () => void;
}

const ChatModal: React.FC<ChatModalProps> = ({ npc, chatHistory, messagesSent, isLoading, onClose, onSend, onNewConversation }) => {
  const [chatInput, setChatInput] = useState('');
  const chatHistoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatHistoryRef.current) {
        chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSend = () => {
    if (chatInput.trim() && messagesSent < 5 && !isLoading) {
      onSend(chatInput.trim());
      setChatInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
  }

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" 
        style={{ height: '100dvh' }}
    >
      <div 
        className="bg-[#c2b280] text-black border-8 border-[#654321] rounded-lg max-w-lg w-full shadow-lg max-h-full flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ imageRendering: 'pixelated' }}
      >
        <div className="flex justify-between items-center border-b-4 border-[#654321] p-4 bg-[#855e42] text-yellow-100">
          <h2 className="text-lg">Chat with {npc.name}</h2>
          <button onClick={onClose} className="text-2xl font-bold">&times;</button>
        </div>
        
        <div ref={chatHistoryRef} className="flex-grow min-h-0 p-4 space-y-4 overflow-y-auto bg-[#f5e8c3]">
            {chatHistory.map((msg, index) => (
                <div key={index} className={`flex flex-col ${msg.author === 'player' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg border-2 border-[#a39360] ${msg.author === 'player' ? 'bg-[#d4e4d4]' : 'bg-[#e0e0e0]'}`}>
                        {msg.author === 'npc' && <strong className="block text-[#4a2e1a] text-xs mb-1">{npc.name}</strong>}
                        <p className="whitespace-pre-wrap text-xs">{msg.text}</p>
                    </div>
                </div>
            ))}
            {isLoading && chatHistory.length > 0 && chatHistory[chatHistory.length-1].author === 'player' && (
                <div className="flex flex-col items-start">
                    <div className="max-w-[80%] p-3 rounded-lg border-2 border-[#a39360] bg-[#e0e0e0]">
                         <strong className="block text-[#4a2e1a] text-xs mb-1">{npc.name}</strong>
                         <p className="animate-pulse text-xs">...</p>
                    </div>
                </div>
            )}
        </div>

        <div className="p-4 border-t-4 border-[#654321] bg-[#855e42]">
            {messagesSent < 5 ? (
                <>
                <textarea 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    maxLength={200}
                    className="w-full h-20 p-2 bg-[#f5e8c3] border-2 border-[#654321] text-black resize-none focus:outline-none focus:ring-1 focus:ring-yellow-100 rounded text-xs"
                    placeholder="Type your message... (Enter to send)"
                />
                <div className="flex justify-between items-center mt-2 text-xs text-yellow-100">
                    <div className="flex gap-4">
                        <span>{chatInput.length}/200</span>
                        <span>{messagesSent}/5 Messages</span>
                    </div>
                     <div className="flex gap-2">
                         <button onClick={onClose} className="px-3 py-2 bg-red-800 hover:bg-red-700 text-white rounded border-b-4 border-red-900 active:border-b-0">End</button>
                         <button onClick={handleSend} disabled={isLoading || !chatInput.trim()} className="px-4 py-2 bg-green-800 hover:bg-green-700 disabled:bg-gray-600 text-white rounded border-b-4 border-green-900 active:border-b-0">Say</button>
                    </div>
                </div>
                </>
            ) : (
                <div className="text-center p-2">
                    <p className="text-yellow-100 mb-3">You have reached the message limit.</p>
                    <div className="flex gap-4 justify-center">
                        <button onClick={onNewConversation} className="px-4 py-2 bg-blue-800 hover:bg-blue-700 text-white rounded border-b-4 border-blue-900 active:border-b-0 w-1/2">
                            New Conversation
                        </button>
                        <button onClick={onClose} className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded border-b-4 border-red-900 active:border-b-0 w-1/2">
                            End Conversation
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ChatModal;