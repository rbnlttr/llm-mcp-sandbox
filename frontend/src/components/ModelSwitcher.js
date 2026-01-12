import React from 'react';
import { Settings, Cpu, Cloud } from 'lucide-react';

const ModelSwitcher = ({ models, selectedModel, onModelChange, isLoading }) => {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg">
      <button
        onClick={() => onModelChange('local')}
        disabled={!models.some(m => m.type === 'local' && m.available)}
        className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition-colors ${
          selectedModel === 'local'
            ? 'bg-green-600 text-white'
            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <Cpu className="w-4 h-4" />
        Ollama
      </button>
      <button
        onClick={() => onModelChange('cloud')}
        disabled={!models.some(m => m.type === 'cloud' && m.available)}
        className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition-colors ${
          selectedModel === 'cloud'
            ? 'bg-blue-600 text-white'
            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <Cloud className="w-4 h-4" />
        Claude
      </button>
    </div>
  );
};

export default ModelSwitcher;