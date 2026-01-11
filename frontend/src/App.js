import React, { useEffect, useRef, useState } from "react";
import {
  Upload,
  Trash2,
  Send,
  Loader2,
  Cpu,
  Cloud,
  Server,
  FileText,
  Brain,
  Hash,
} from "lucide-react";

import { uploadDocument } from "./api/documentService";
import { sendChat } from "./api/chatService";
import { getHealth } from "./api/healthService";
import { getModels } from "./api/modelService";
import { buildMCPContext } from "./mcp/contextBuilder";

const App = () => {
  const [files, setFiles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [apiStatus, setApiStatus] = useState(null);
  const [models, setModels] = useState([]);
  const [llm, setLlm] = useState("local");

  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);

  /* ============================
     Initial Load
  ============================ */

  useEffect(() => {
    refreshHealth();
    refreshModels();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const refreshHealth = async () => {
    try {
      const health = await getHealth();
      setApiStatus(health);
      setLlm(health.default_llm ?? "local");
    } catch {
      setApiStatus({ status: "error" });
    }
  };

  const refreshModels = async () => {
    try {
      setModels(await getModels());
    } catch {
      setModels([]);
    }
  };

  /* ============================
     File Upload
  ============================ */

  const handleUpload = async (e) => {
    const selected = Array.from(e.target.files);
    if (!selected.length) return;

    setUploading(true);

    for (const file of selected) {
      try {
        const result = await uploadDocument(file);
        setFiles((f) => [
          ...f,
          {
            id: crypto.randomUUID(),
            name: result.filename,
            content: result.content,
            size: result.size,
            status: "processed",
          },
        ]);
      } catch (err) {
        setFiles((f) => [
          ...f,
          {
            id: crypto.randomUUID(),
            name: file.name,
            size: file.size,
            status: "error",
            error: err.message,
          },
        ]);
      }
    }

    setUploading(false);
    fileInputRef.current.value = "";
  };

  const removeFile = (id) =>
    setFiles((f) => f.filter((x) => x.id !== id));

  /* ============================
     Chat Submit
  ============================ */

  const handleSubmit = async () => {
    if (!input.trim() || loading || files.length === 0) return;

    const userMsg = {
      role: "user",
      content: input,
      ts: new Date().toISOString(),
    };

    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const context = buildMCPContext({
        documents: files.filter((f) => f.status === "processed"),
        includeProject: true,
        includeReference: true,
      });

      const result = await sendChat({
        message: userMsg.content,
        mcpContext: context,
        llm,
      });

      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: result.response,
          model: result.model,
          llmType: result.llm_type,
          usage: result.usage,
          ts: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `❌ ${err.message}`,
          isError: true,
          ts: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /* ============================
     UI Helpers
  ============================ */

  const canSend =
    !loading &&
    input.trim() &&
    files.some((f) => f.status === "processed");

  const renderMeta = (msg) => {
    if (!msg.model && !msg.llmType) return null;

    return (
      <div className="flex gap-4 mt-2 text-xs text-slate-400">
        {msg.llmType && (
          <span className="flex items-center gap-1">
            <Brain size={12} />
            {msg.llmType.toUpperCase()}
          </span>
        )}
        {msg.model && (
          <span className="flex items-center gap-1">
            <Cpu size={12} />
            {msg.model}
          </span>
        )}
        {msg.usage?.total_tokens && (
          <span className="flex items-center gap-1">
            <Hash size={12} />
            {msg.usage.total_tokens} Tokens
          </span>
        )}
      </div>
    );
  };

  /* ============================
     UI
  ============================ */

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">MCP LLM Sandbox</h1>
            <p className="text-slate-400 text-sm">
              Production MCP · Zitierpflicht · Auditfähig
            </p>
          </div>

          <div className="flex gap-3 items-center">
            <button
              onClick={() => setLlm("local")}
              disabled={!apiStatus?.ollama_available}
              className={`px-3 py-1 rounded flex gap-2 items-center ${
                llm === "local"
                  ? "bg-green-600"
                  : "bg-slate-700"
              }`}
            >
              <Cpu size={16} /> Lokal
            </button>

            <button
              onClick={() => setLlm("cloud")}
              disabled={!apiStatus?.claude_available}
              className={`px-3 py-1 rounded flex gap-2 items-center ${
                llm === "cloud"
                  ? "bg-blue-600"
                  : "bg-slate-700"
              }`}
            >
              <Cloud size={16} /> Cloud
            </button>

            <div className="px-3 py-1 bg-slate-800 rounded flex gap-2 items-center text-xs">
              <Server size={14} />
              {apiStatus?.status === "healthy"
                ? "Backend OK"
                : "Backend ERROR"}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Documents */}
          <aside className="bg-slate-800 p-4 rounded">
            <div className="flex justify-between mb-3">
              <h2 className="font-semibold flex gap-2 items-center">
                <FileText size={18} /> Dokumente
              </h2>
              <button
                onClick={() => fileInputRef.current.click()}
                className="bg-blue-600 px-3 py-1 rounded flex gap-2 items-center"
              >
                <Upload size={14} />
                Upload
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                hidden
                onChange={handleUpload}
              />
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {files.map((f) => (
                <div
                  key={f.id}
                  className="bg-slate-700 p-2 rounded flex justify-between"
                >
                  <div>
                    <p className="text-sm">{f.name}</p>
                    {f.error && (
                      <p className="text-xs text-red-400">
                        {f.error}
                      </p>
                    )}
                  </div>
                  <button onClick={() => removeFile(f.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </aside>

          {/* Chat */}
          <section className="lg:col-span-2 bg-slate-800 p-4 rounded flex flex-col h-[650px]">
            <div className="flex-1 overflow-y-auto space-y-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`p-3 rounded ${
                    m.role === "user"
                      ? "bg-blue-900/40 ml-12"
                      : m.isError
                      ? "bg-red-900/40 mr-12"
                      : "bg-slate-700 mr-12"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">
                    {m.content}
                  </p>
                  {m.role === "assistant" && renderMeta(m)}
                </div>
              ))}
              {loading && (
                <div className="flex gap-2 items-center text-slate-400">
                  <Loader2 className="animate-spin" size={16} />
                  LLM denkt…
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="flex gap-2 mt-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleSubmit()
                }
                className="flex-1 bg-slate-700 p-3 rounded"
                placeholder="Frage mit Zitierpflicht stellen…"
              />
              <button
                onClick={handleSubmit}
                disabled={!canSend}
                className="bg-blue-600 px-5 rounded flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Send />
                )}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default App;
