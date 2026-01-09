import React, { useState, useRef, useEffect } from 'react';
import { FileText, Upload, Trash2, Send, Loader2, CheckCircle, XCircle, AlertCircle, Server, Cloud, Cpu } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const App = () => {
  const [files, setFiles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [apiStatus, setApiStatus] = useState(null);
  const [models, setModels] = useState([]);
  const [useLocal, setUseLocal] = useState(true);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Check API health on mount
  useEffect(() => {
    checkApiHealth();
    fetchModels();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const checkApiHealth = async () => {
    try {
      const response = await axios.get(`${API_URL}/health`);
      setApiStatus(response.data);
      setUseLocal(response.data.default_llm === 'local');
    } catch (error) {
      setApiStatus({ status: 'error', message: 'Backend nicht erreichbar' });
    }
  };

  const fetchModels = async () => {
    try {
      const response = await axios.get(`${API_URL}/models`);
      setModels(response.data.models || []);
    } catch (error) {
      console.error('Failed to fetch models:', error);
    }
  };

  const handleFileUpload = async (e) => {
    const uploadedFiles = Array.from(e.target.files);
    if (uploadedFiles.length === 0) return;

    setUploading(true);

    for (const file of uploadedFiles) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(`${API_URL}/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const processedFile = {
          id: Date.now() + Math.random(),
          name: response.data.filename,
          content: response.data.content,
          size: response.data.size,
          status: response.data.status,
        };

        setFiles(prev => [...prev, processedFile]);
      } catch (error) {
        const errorFile = {
          id: Date.now() + Math.random(),
          name: file.name,
          content: '',
          size: file.size,
          status: 'error',
          error: error.response?.data?.detail || error.message,
        };
        setFiles(prev => [...prev, errorFile]);
      }
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleSubmit = async () => {
    if (!input.trim() || loading || files.length === 0) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      const documents = files
        .filter(f => f.status === 'processed')
        .map(f => ({
          name: f.name,
          content: f.content,
        }));

      const response = await axios.post(`${API_URL}/chat`, {
        message: currentInput,
        documents: documents,
        use_local: useLocal,
      });

      const assistantMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date().toISOString(),
        usage: response.data.usage,
        model: response.data.model,
        llmType: response.data.llm_type,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: `Fehler bei der Verarbeitung: ${error.response?.data?.detail || error.message}`,
        timestamp: new Date().toISOString(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const clearChat = () => {
    setMessages([]);
  };

  const getModelBadge = (llmType) => {
    if (llmType === 'local') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-900/30 border border-green-700 rounded text-xs text-green-400">
          <Cpu className="w-3 h-3" />
          Lokal
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-900/30 border border-blue-700 rounded text-xs text-blue-400">
        <Cloud className="w-3 h-3" />
        Cloud
      </span>
    );
  };

  const canUseLocal = apiStatus?.ollama_available;
  const canUseClaude = apiStatus?.claude_available;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                LLM MCP Sandbox
              </h1>
              <p className="text-slate-400">Lokale Dokumentenverarbeitung mit Ollama & Claude</p>
            </div>
            <div className="flex items-center gap-3">
              {/* LLM Switcher */}
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg">
                <button
                  onClick={() => setUseLocal(true)}
                  disabled={!canUseLocal}
                  className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition-colors ${
                    useLocal 
                      ? 'bg-green-600 text-white' 
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Cpu className="w-4 h-4" />
                  Ollama
                </button>
                <button
                  onClick={() => setUseLocal(false)}
                  disabled={!canUseClaude}
                  className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition-colors ${
                    !useLocal 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Cloud className="w-4 h-4" />
                  Claude
                </button>
              </div>
              
              {/* Status */}
              {apiStatus && (
                <div className={`px-4 py-2 rounded-lg border ${
                  apiStatus.status === 'healthy' 
                    ? 'bg-green-900/30 border-green-700 text-green-400'
                    : 'bg-red-900/30 border-red-700 text-red-400'
                }`}>
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4" />
                    <span className="text-sm">
                      {apiStatus.ollama_available ? '✓ Ollama' : '✗ Ollama'}
                      {' | '}
                      {apiStatus.claude_available ? '✓ Claude' : '✗ Claude'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Dokumenten-Panel */}
          <div className="lg:col-span-1 bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Dokumente ({files.length})
              </h2>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-md text-sm flex items-center gap-2 transition-colors"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Upload...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload</span>
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.pptx,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {!canUseLocal && !canUseClaude && (
              <div className="mb-3 p-3 bg-yellow-900/30 border border-yellow-700 rounded-md">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-yellow-400">
                    <p className="font-semibold mb-1">Keine LLMs verfügbar</p>
                    <p>Starte Ollama oder konfiguriere Claude API Key.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {files.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Keine Dokumente geladen</p>
                  <p className="text-xs mt-1">PDF, DOCX, XLSX, PPTX, TXT</p>
                </div>
              ) : (
                files.map(file => (
                  <div
                    key={file.id}
                    className="p-3 bg-slate-700/50 border border-slate-600 rounded-md hover:border-slate-500 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {file.status === 'processed' ? (
                            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                          )}
                          <p className="text-sm font-medium truncate">{file.name}</p>
                        </div>
                        <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
                        {file.error && (
                          <p className="text-xs text-red-400 mt-1">{file.error}</p>
                        )}
                        {file.status === 'processed' && file.content && (
                          <p className="text-xs text-slate-500 mt-1">
                            {file.content.length} Zeichen
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat-Panel */}
          <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4 flex flex-col h-[700px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Konversation</h2>
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                >
                  Chat löschen
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto mb-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <p className="text-sm mb-2">Starte eine Konversation</p>
                    <p className="text-xs">Wähle ein LLM, lade Dokumente hoch und stelle Fragen</p>
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-blue-900/30 border border-blue-700 ml-8'
                        : msg.isError
                        ? 'bg-red-900/30 border border-red-700 mr-8'
                        : 'bg-slate-700/50 border border-slate-600 mr-8'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-slate-300">
                            {msg.role === 'user' ? 'Du' : 'Assistent'}
                          </p>
                          {msg.llmType && getModelBadge(msg.llmType)}
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <p className="text-xs text-slate-500">
                            {new Date(msg.timestamp).toLocaleTimeString('de-DE')}
                          </p>
                          {msg.model && (
                            <p className="text-xs text-slate-500">
                              {msg.model}
                            </p>
                          )}
                          {msg.usage && (
                            <p className="text-xs text-slate-500">
                              {msg.usage.prompt_tokens || msg.usage.input_tokens} → {msg.usage.completion_tokens || msg.usage.output_tokens} tokens
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="p-4 bg-slate-700/50 border border-slate-600 rounded-lg mr-8">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    <span className="text-sm text-slate-400">
                      {useLocal ? 'Ollama' : 'Claude'} denkt nach...
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  files.length === 0 
                    ? "Lade zuerst Dokumente hoch..." 
                    : "Stelle eine Frage zu deinen Dokumenten..."
                }
                disabled={loading || files.length === 0 || (!canUseLocal && !canUseClaude)}
                className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSubmit}
                disabled={loading || !input.trim() || files.length === 0 || (!canUseLocal && !canUseClaude)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
            <h3 className="text-sm font-semibold mb-2 text-slate-300 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-green-400" />
              Lokale Modelle (Ollama)
            </h3>
            {models.filter(m => m.type === 'local').length > 0 ? (
              <div className="space-y-1">
                {models.filter(m => m.type === 'local').map((model, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className={model.available ? 'text-green-400' : 'text-red-400'}>
                      {model.available ? '✓' : '✗'} {model.name}
                    </span>
                    {model.size && (
                      <span className="text-slate-500">
                        {(model.size / 1e9).toFixed(1)} GB
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Keine Modelle geladen</p>
            )}
          </div>

          <div className="p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
            <h3 className="text-sm font-semibold mb-2 text-slate-300 flex items-center gap-2">
              <Cloud className="w-4 h-4 text-blue-400" />
              Cloud Modelle
            </h3>
            <div className="space-y-1 text-xs">
              {models.filter(m => m.type === 'cloud').map((model, idx) => (
                <div key={idx} className={model.available ? 'text-green-400' : 'text-red-400'}>
                  {model.available ? '✓' : '✗'} {model.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;