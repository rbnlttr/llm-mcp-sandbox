import React from 'react';
import { User, Bot, Copy, Check } from 'lucide-react';

const ChatMessage = ({ message, onCopyMessage }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await onCopyMessage(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const getModelBadge = (llmType) => {
    if (llmType === 'local') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-900/30 border border-green-700 rounded text-xs text-green-400">
          <span>🖥️ Lokal</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-900/30 border border-blue-700 rounded text-xs text-blue-400">
        <span>☁️ Cloud</span>
      </span>
    );
  };

  return (
    <div className={`flex gap-3 p-4 ${message.role === 'user' ? 'bg-slate-800/30' : 'bg-slate-700/30'}`}>
      <div className="flex-shrink-0">
        {message.role === 'user' ? (
          <User className="w-6 h-6 text-blue-400" />
        ) : (
          <Bot className="w-6 h-6 text-green-400" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-300">
            {message.role === 'user' ? 'Du' : 'Assistent'}
          </span>
          <div className="flex items-center gap-2">
            {message.llmType && getModelBadge(message.llmType)}
            <button
              onClick={handleCopy}
              className="p-1 hover:bg-slate-600 rounded text-slate-400 hover:text-slate-200 transition-colors"
              title="Nachricht kopieren"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="text-sm text-slate-200 whitespace-pre-wrap break-words">
          {message.content}
        </div>

        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
          <span>{new Date(message.timestamp).toLocaleTimeString('de-DE')}</span>
          {message.model && <span>{message.model}</span>}
          {message.usage && (
            <span>
              {message.usage.prompt_tokens || message.usage.input_tokens} → {message.usage.completion_tokens || message.usage.output_tokens} tokens
            </span>
          )}
        </div>

        {message.citations && message.citations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-600">
            <div className="text-xs text-slate-400 mb-2">Quellen:</div>
            <div className="space-y-1">
              {message.citations.map((citation, index) => (
                <div key={index} className="text-xs bg-slate-800/50 p-2 rounded border border-slate-600">
                  <div className="font-medium text-slate-300">{citation.filename}</div>
                  <div className="text-slate-400 mt-1">{citation.content}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;