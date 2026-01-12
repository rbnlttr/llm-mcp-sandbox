// frontend/src/App.js - COMPLETE VERSION
import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, AlertCircle, Server, RefreshCw, Cpu, Cloud } from 'lucide-react';
import axios from 'axios';
import FileUpload from './components/FileUpload';
import DirectoryPanel from './components/DirectoryPanel';
import ChatMessage from './components/ChatMessage';
import ModelSwitcher from './components/ModelSwitcher';
import { API_BASE_URL, API_ENDPOINTS } from './constants';

const App = () => {
  // State declarations
  const [files, setFiles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [apiStatus, setApiStatus] = useState(null);
  const [models, setModels] = useState([]);
  const [useLocal, setUseLocal] = useState(true);
  
  // NEW: Directory states
  const [projectDir, setProjectDir] = useState(null);
  const [referenceDir, setReferenceDir] = useState(null);
  const [includeProject, setIncludeProject] = useState(true);
  const [includeReference, setIncludeReference] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Refs
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Check API health on mount
  useEffect(() => {
    checkApiHealth();
    fetchModels();
    fetchDirectories();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const checkApiHealth = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.HEALTH}`);
      setApiStatus(response.data);
      setUseLocal(response.data.default_llm === 'local');
    } catch (error) {
      setApiStatus({ status: 'error', message: 'Backend nicht erreichbar' });
    }
  };

  const fetchModels = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.MODELS}`);
      setModels(response.data.models || []);
    } catch (error) {
      console.error('Failed to fetch models:', error);
    }
  };

  const fetchDirectories = async () => {
    try {
      const [projectRes, referenceRes] = await Promise.all([
        axios.get(`${API_BASE_URL}${API_ENDPOINTS.DIRECTORIES_PROJECT}`),
        axios.get(`${API_BASE_URL}${API_ENDPOINTS.DIRECTORIES_REFERENCE}`)
      ]);
      setProjectDir(projectRes.data);
      setReferenceDir(referenceRes.data);
    } catch (error) {
      console.error('Failed to fetch directories:', error);
    }
  };

  const refreshDirectories = async () => {
    setRefreshing(true);
    try {
      await axios.post(`${API_BASE_URL}${API_ENDPOINTS.DIRECTORIES_REFRESH}`);
      await fetchDirectories();
    } catch (error) {
      console.error('Failed to refresh directories:', error);
    } finally {
      setRefreshing(false);
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

        const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.UPLOAD}`, formData, {
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
    if (!input.trim() || loading) return;

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

      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.CHAT}`, {
        message: currentInput,
        documents: documents,
        use_local: useLocal,
        include_project: includeProject,
        include_reference: includeReference,
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

  const clearChat = () => {
    setMessages([]);
  };

  const getVersionBadge = (file) => {
    if (!file.version) return null;
    
    const isReleased = file.is_released;
    const versionType = file.version_type || 'V';
    
    return (
      <span 
        className={`ml-2 px-2 py-0.5 text-xs rounded ${
          isReleased 
            ? 'bg-green-900/30 border border-green-700 text-green-400'
            : 'bg-yellow-900/30 border border-yellow-700 text-yellow-400'
        }`}
      >
        {versionType}{file.version}
      </span>
    );
  };

  const canUseLocal = apiStatus?.ollama_available;
  const canUseClaude = apiStatus?.claude_available;
  const hasContext = files.length > 0 || (includeProject && projectDir?.file_count > 0) || (includeReference && referenceDir?.file_count > 0);

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
              <p className="text-slate-400">Lokale Dokumentenverarbeitung mit Projekt & Referenz-Kontext</p>
            </div>
            <div className="flex items-center gap-3">
              {/* LLM Switcher */}
              <ModelSwitcher
                models={models}
                selectedModel={useLocal ? 'local' : 'cloud'}
                onModelChange={(model) => setUseLocal(model === 'local')}
                isLoading={false}
              />
              
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
          <div className="lg:col-span-1 space-y-4">
            {/* Upload Section */}
            <FileUpload
              files={files}
              onFileUpload={handleFileUpload}
              onRemoveFile={removeFile}
            />

            {/* Project Directory */}
            <DirectoryPanel
              title="Projekt"
              directory={projectDir}
              include={includeProject}
              onIncludeChange={setIncludeProject}
              onRefresh={refreshDirectories}
              refreshing={refreshing}
              icon="project"
            />

            {/* Reference Directory */}
            <DirectoryPanel
              title="Referenz (Normen)"
              directory={referenceDir}
              include={includeReference}
              onIncludeChange={setIncludeReference}
              icon="reference"
            />
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

            {!hasContext && (
              <div className="mb-3 p-3 bg-yellow-900/30 border border-yellow-700 rounded-md">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-yellow-400">
                    <p className="font-semibold">Kein Kontext verfügbar</p>
                    <p>Lade Dateien hoch oder aktiviere Projekt/Referenz-Verzeichnisse</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto mb-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <p className="text-sm mb-2">Starte eine Konversation</p>
                    <p className="text-xs">Stelle Fragen zu deinen Dokumenten, Projekt oder Normen</p>
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <ChatMessage
                    key={idx}
                    message={msg}
                    onCopyMessage={(content) => navigator.clipboard.writeText(content)}
                  />
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
                placeholder="Stelle eine Frage zu deinen Dokumenten, Projekt oder Normen..."
                disabled={loading || (!canUseLocal && !canUseClaude)}
                className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSubmit}
                disabled={loading || !input.trim() || (!canUseLocal && !canUseClaude)}
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