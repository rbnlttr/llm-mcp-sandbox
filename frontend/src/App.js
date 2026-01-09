import React, { useState, useRef, useEffect } from 'react';
import { FileText, Upload, Trash2, Send, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const App = () => {
  const [files, setFiles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [apiStatus, setApiStatus] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Check API health on mount
  useEffect(() => {
    checkApiHealth();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const checkApiHealth = async () => {
    try {
      const response = await axios.get(`${API_URL}/health`);
      setApiStatus(response.data);
    } catch (error) {
      setApiStatus({ status: 'error', message: 'Backend nicht erreichbar' });
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
      });

      const assistantMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date().toISOString(),
        usage: response.data.usage,
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
              <p className="text-slate-400">Lokale Dokumentenverarbeitung mit Model Context Protocol</p>
            </div>
            {apiStatus && (
              <div className={`px-4 py-2 rounded-lg border ${
                apiStatus.status === 'healthy' 
                  ? 'bg-green-900/30 border-green-700 text-green-400'
                  : 'bg-red-900/30 border-red-700 text-red-400'
              }`}>
                <div className="flex items-center gap-2">
                  {apiStatus.status === 'healthy' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  <span className="text-sm">
                    {apiStatus.status === 'healthy' 
                      ? `Backend: ${apiStatus.api_configured ? '✓ API konfiguriert' : '⚠ API Key fehlt'}`
                      : 'Backend offline'
                    }
                  </span>
                </div>
              </div>
            )}
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

            {!apiStatus?.api_configured && (
              <div className="mb-3 p-3 bg-yellow-900/30 border border-yellow-700 rounded-md">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-yellow-400">
                    <p className="font-semibold mb-1">API Key nicht konfiguriert</p>
                    <p>Füge deinen Anthropic API Key in die .env Datei ein und starte den Container neu.</p>
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
                            {file.content.length} Zeichen extrahiert
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
                    <p className="text-xs">Lade zuerst Dokumente hoch und stelle dann Fragen</p>
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
                        <p className="text-sm font-medium mb-1 text-slate-300">
                          {msg.role === 'user' ? 'Du' : 'Claude'}
                        </p>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <p className="text-xs text-slate-500">
                            {new Date(msg.timestamp).toLocaleTimeString('de-DE')}
                          </p>
                          {msg.usage && (
                            <p className="text-xs text-slate-500">
                              Tokens: {msg.usage.input_tokens} in / {msg.usage.output_tokens} out
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
                    <span className="text-sm text-slate-400">Claude denkt nach...</span>
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
                disabled={loading || files.length === 0 || !apiStatus?.api_configured}
                className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSubmit}
                disabled={loading || !input.trim() || files.length === 0 || !apiStatus?.api_configured}
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
        <div className="mt-4 p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
          <h3 className="text-sm font-semibold mb-2 text-slate-300">System-Informationen:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-400">
            <div>
              <p className="font-semibold text-slate-300 mb-1">Backend Features:</p>
              <ul className="space-y-1">
                <li>• FastAPI mit automatischer API-Dokumentation</li>
                <li>• PyPDF2 für PDF-Extraktion</li>
                <li>• python-docx für Word-Dokumente</li>
                <li>• openpyxl für Excel-Dateien</li>
                <li>• python-pptx für PowerPoint-Präsentationen</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-slate-300 mb-1">Sicherheit:</p>
              <ul className="space-y-1">
                <li>• Alle Dateien werden lokal verarbeitet</li>
                <li>• Nur extrahierter Text wird an Claude API gesendet</li>
                <li>• API Key nur im Backend Container</li>
                <li>• Uploads im isolierten Docker Volume</li>
              </ul>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-700">
            <p className="text-xs text-slate-500">
              API-Dokumentation: <a href={`${API_URL}/docs`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                {API_URL}/docs
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

