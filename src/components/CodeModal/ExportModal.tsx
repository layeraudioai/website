import React from 'react';
import {
  Download,
  Copy,
  Check,
  X,
  FileCode,
  FolderArchive,
  ExternalLink,
  Code2,
  Cpu,
} from 'lucide-react';
import { ProjectData } from '../../types/logic';
import {
  generateHtmlFile,
  generateCssFile,
  generateAppJsFile,
  generateWorkerFile,
  generateStandaloneHtmlFile,
  generateAioHtmlFile,
} from '../../utils/codeGenerator';
import {
  downloadProjectZip,
  downloadStandaloneHtml,
  downloadAioHtml,
  openPreviewInNewWindow,
} from '../../utils/exportProject';

interface ExportModalProps {
  project: ProjectData;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  project,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = React.useState<
    'html' | 'css' | 'js' | 'worker' | 'standalone' | 'aio'
  >('aio');
  const [copied, setCopied] = React.useState(false);
  const [isExportingZip, setIsExportingZip] = React.useState(false);

  if (!isOpen) return null;

  const htmlCode = generateHtmlFile(project);
  const cssCode = generateCssFile(project);
  const jsCode = generateAppJsFile(project, false);
  const workerCode = generateWorkerFile(project);
  const standaloneCode = generateStandaloneHtmlFile(project);
  const aioCode = generateAioHtmlFile(project);

  const getActiveCode = () => {
    switch (activeTab) {
      case 'aio':
        return aioCode;
      case 'html':
        return htmlCode;
      case 'css':
        return cssCode;
      case 'js':
        return jsCode;
      case 'worker':
        return workerCode;
      case 'standalone':
        return standaloneCode;
      default:
        return aioCode;
    }
  };

  const getFileName = () => {
    switch (activeTab) {
      case 'aio':
        return 'app.aio.html';
      case 'html':
        return 'index.html';
      case 'css':
        return 'style.css';
      case 'js':
        return 'app.js';
      case 'worker':
        return 'worker.js';
      case 'standalone':
        return 'standalone.html';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    try {
      setIsExportingZip(true);
      await downloadProjectZip(project);
    } finally {
      setIsExportingZip(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Export Standalone Project</h2>
              <p className="text-xs text-slate-400">
                Production-ready code with HTML, CSS, JavaScript, ES6 classes, and Web Worker threads.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Export Buttons */}
        <div className="px-6 py-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadZip}
              disabled={isExportingZip}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/20 transition cursor-pointer disabled:opacity-50"
            >
              <FolderArchive className="w-4 h-4" />
              <span>{isExportingZip ? 'Generating ZIP...' : 'Download Project (.ZIP)'}</span>
            </button>

            <button
              onClick={() => downloadAioHtml(project)}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-700/20 transition cursor-pointer"
            >
              <FileCode className="w-4 h-4" />
              <span>Download All-In-One (AIO) HTML</span>
            </button>

            <button
              onClick={() => downloadStandaloneHtml(project)}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-medium transition cursor-pointer"
            >
              <FileCode className="w-4 h-4 text-slate-400" />
              <span>Download Standalone HTML</span>
            </button>

            <button
              onClick={() => openPreviewInNewWindow(project)}
              className="flex items-center space-x-1.5 px-3 py-2 text-slate-400 hover:text-white rounded-lg text-xs font-medium transition cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Preview in Tab</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy {getFileName()}</span>
              </>
            )}
          </button>
        </div>

        {/* File Tabs */}
        <div className="px-6 bg-slate-950 border-b border-slate-800 flex space-x-1 text-xs">
          {[
            { id: 'aio', label: 'app.aio.html', icon: FileCode },
            { id: 'html', label: 'index.html', icon: FileCode },
            { id: 'css', label: 'style.css', icon: Code2 },
            { id: 'js', label: 'app.js', icon: Code2 },
            { id: 'worker', label: 'worker.js', icon: Cpu },
            { id: 'standalone', label: 'standalone.html', icon: FileCode },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-1.5 py-2.5 px-3 font-mono border-b-2 transition cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-950/20'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Code Content Viewer */}
        <div className="flex-1 overflow-auto p-4 bg-slate-950 font-mono text-xs text-slate-200 leading-relaxed">
          <pre className="p-2">
            <code>{getActiveCode()}</code>
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>
            Project contains {project.variables.length} variables, {project.functions.length}{' '}
            functions, {project.classes.length} classes, and {project.workers.length} worker threads.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
