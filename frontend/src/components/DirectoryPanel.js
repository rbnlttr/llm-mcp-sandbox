import React from 'react';
import { Folder, FileText, ChevronRight, ChevronDown, RefreshCw, FolderOpen, BookOpen } from 'lucide-react';

const DirectoryPanel = ({
  title,
  directory,
  include,
  onIncludeChange,
  onRefresh,
  refreshing,
  icon = 'folder'
}) => {
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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

  const getIcon = () => {
    switch (icon) {
      case 'project':
        return <FolderOpen className="w-4 h-4 text-purple-400" />;
      case 'reference':
        return <BookOpen className="w-4 h-4 text-orange-400" />;
      default:
        return <Folder className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={include}
            onChange={(e) => onIncludeChange(e.target.checked)}
            className="w-4 h-4 rounded border-slate-600 bg-slate-700"
          />
          <h3 className="text-sm font-semibold flex items-center gap-2">
            {getIcon()}
            {title}
          </h3>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="p-1 hover:bg-slate-700 rounded transition-colors"
            title="Verzeichnisse neu scannen"
          >
            <RefreshCw className={`w-4 h-4 text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {directory ? (
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span>📁 {directory.file_count} Dateien</span>
            <span>💾 {formatFileSize(directory.total_size)}</span>
          </div>

          <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
            {directory.files.slice(0, 5).map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-slate-500 hover:text-slate-400 transition-colors"
              >
                <span className="truncate flex-1">• {file.path}</span>
                {getVersionBadge(file)}
              </div>
            ))}
            {directory.file_count > 5 && (
              <p className="text-slate-500 italic">
                ... und {directory.file_count - 5} weitere
              </p>
            )}
          </div>

          {/* Version Statistics */}
          {directory.files.some(f => f.version) && (
            <div className="mt-2 pt-2 border-t border-slate-700 text-xs">
              <p className="text-slate-400">
                ✓ {directory.files.filter(f => f.is_released).length} freigegebene (V)
              </p>
              <p className="text-slate-400">
                ⚠ {directory.files.filter(f => f.version && !f.is_released).length} Entwürfe (X)
              </p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-slate-500">Keine {title.toLowerCase()}-Dateien gefunden</p>
      )}
    </div>
  );
};

export default DirectoryPanel;