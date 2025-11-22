
import React, { useEffect, useRef, useState } from 'react';
import { Send, Terminal, Cpu } from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatTerminalProps {
  history: ChatMessage[];
  onSendMessage: (text: string) => void;
}

export const ChatTerminal: React.FC<ChatTerminalProps> = ({ history, onSendMessage }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="bg-slate-950 border border-slate-700 rounded-lg flex flex-col h-full overflow-hidden shadow-inner">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-green-500" />
          <span className="text-xs font-bold text-green-500 tracking-widest">NEURAL_LINK // TTY_01</span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-slate-700"></div>
          <div className="w-2 h-2 rounded-full bg-slate-700"></div>
          <div className="w-2 h-2 rounded-full bg-slate-700"></div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
        {history.map((msg) => {
          const isAi = msg.sender === 'AI';
          const isSystem = msg.sender === 'SYSTEM';
          return (
            <div key={msg.id} className={`flex ${isSystem ? 'justify-center' : ''}`}>
              {isSystem ? (
                <span className="text-slate-500 border-b border-slate-800 pb-1 px-4">{msg.text}</span>
              ) : (
                <div className={`flex flex-col max-w-[85%] ${isAi ? 'items-start' : 'items-end ml-auto'}`}>
                  <div className={`flex items-center gap-2 mb-1 ${isAi ? 'flex-row' : 'flex-row-reverse'}`}>
                    {isAi ? <Cpu className="w-3 h-3 text-cyan-400" /> : <span className="text-[10px] text-slate-500">OP</span>}
                    <span className={`text-[10px] font-bold ${isAi ? 'text-cyan-400' : 'text-indigo-400'}`}>
                      {msg.sender}
                    </span>
                    <span className="text-[9px] text-slate-600">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <div 
                    className={`px-3 py-2 rounded border ${
                      isAi 
                        ? 'bg-slate-900/80 border-cyan-900/50 text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                        : 'bg-indigo-900/20 border-indigo-500/30 text-indigo-200'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-2 bg-slate-900 border-t border-slate-800 flex gap-2">
        <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 font-bold mr-2 pointer-events-none">{'>'}</span>
            <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full bg-black border border-slate-700 rounded px-3 pl-6 py-2 text-green-400 placeholder-slate-700 font-mono text-xs focus:outline-none focus:border-green-500/50 transition-colors"
            placeholder="Enter command or query..."
            />
        </div>
        <button 
          type="submit"
          disabled={!input.trim()}
          className="bg-green-600/20 hover:bg-green-600/30 border border-green-500/50 text-green-400 px-3 rounded flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
