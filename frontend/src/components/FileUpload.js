import React, { useRef } from 'react';
import { FileText, Upload, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { SUPPORTED_FILE_TYPES } from '../constants';

const FileUpload = ({ files, onFileUpload, onRemoveFile }) => {
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    onFileUpload(e);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Upload className="w-5 h-5 text-blue-400" />
          Uploads ({files.length})
        </h2>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-md text-sm flex items-center gap-2 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Hochladen
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={SUPPORTED_FILE_TYPES.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      <div className="space-y-2 max-h-[200px] overflow-y-auto">
        {files.length === 0 ? (
          <div className="text-center py-4 text-slate-500 text-xs">
            Keine Uploads
          </div>
        ) : (
          files.map(file => (
            <div key={file.id} className="p-2 bg-slate-700/50 border border-slate-600 rounded-md text-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {file.status === 'processed' ? (
                      <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                    )}
                    <p className="font-medium truncate">{file.name}</p>
                  </div>
                  <p className="text-slate-400">{formatFileSize(file.size)}</p>
                </div>
                <button onClick={() => onRemoveFile(file.id)} className="text-slate-400 hover:text-red-400">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FileUpload;