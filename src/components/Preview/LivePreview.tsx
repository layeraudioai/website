import React from 'react';
import {
  Play,
  RotateCcw,
  ExternalLink,
  Terminal,
  Cpu,
  Trash2,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  Check,
  Send,
  PlusCircle,
} from 'lucide-react';
import { ProjectData } from '../../types/logic';
import { buildSandboxedHtmlWithTelemetry, ConsoleLogMessage } from '../../utils/runtimeEngine';
import { openPreviewInNewWindow } from '../../utils/exportProject';
import { parseHtmlDocument } from '../../utils/codeImporter';

interface LivePreviewProps {
  project: ProjectData;
  onUpdateProject?: (project: ProjectData) => void;
}

export const LivePreview: React.FC<LivePreviewProps> = ({ project, onUpdateProject }) => {
  const [logs, setLogs] = React.useState<ConsoleLogMessage[]>([]);
  const [filterType, setFilterType] = React.useState<'all' | 'worker' | 'log' | 'error' | 'realtime'>('all');
  const [key, setKey] = React.useState(0);
  const [consoleHeight, setConsoleHeight] = React.useState(260);
  const [isConsoleCollapsed, setIsConsoleCollapsed] = React.useState(false);
  const [jsInput, setJsInput] = React.useState('');
  const [realtimeCount, setRealtimeCount] = React.useState(0);
  const [syncSuccess, setSyncSuccess] = React.useState(false);

  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  const sessionId = React.useMemo(() => Math.random().toString(36).substr(2, 9), [key]);

  const sandboxedHtml = React.useMemo(() => {
    return buildSandboxedHtmlWithTelemetry(project, sessionId);
  }, [project, sessionId]);

  // Listen to messages from the sandbox iframe
  React.useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (!e.data || e.data.sessionId !== sessionId) return;

      if (e.data.type === 'EDITOR_SANDBOX_LOG') {
        setLogs((prev) => [e.data.payload, ...prev]);
      } else if (e.data.type === 'EDITOR_DOM_MUTATION') {
        setRealtimeCount((prev) => prev + 1);
      } else if (e.data.type === 'EDITOR_DOM_EXPORT_RESPONSE') {
        try {
          const parsed = parseHtmlDocument(e.data.html, project.functions);
          if (parsed.rootElement && onUpdateProject) {
            onUpdateProject({
              ...project,
              rootElement: parsed.rootElement,
              updatedAt: Date.now(),
            });
            setSyncSuccess(true);
            setTimeout(() => setSyncSuccess(false), 2500);
          }
        } catch (err) {
          console.error('Failed to sync live DOM to canvas:', err);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [sessionId, project, onUpdateProject]);

  const handleRestart = () => {
    setLogs([]);
    setRealtimeCount(0);
    setKey((prev) => prev + 1);
  };

  const executeJs = (codeToRun?: string) => {
    const code = codeToRun || jsInput;
    if (!code.trim() || !iframeRef.current?.contentWindow) return;

    iframeRef.current.contentWindow.postMessage(
      {
        type: 'EXECUTE_JS',
        sessionId,
        code: code.trim(),
      },
      '*'
    );

    if (!codeToRun) {
      setJsInput('');
    }
  };

  const handleSyncToCanvas = () => {
    if (!iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      {
        type: 'REQUEST_DOM_EXPORT',
        sessionId,
      },
      '*'
    );
  };

  const filteredLogs = logs.filter((l) => {
    if (filterType === 'worker') return l.type === 'worker-in' || l.type === 'worker-out';
    if (filterType === 'error') return l.type === 'error';
    if (filterType === 'log') return l.type === 'log';
    if (filterType === 'realtime') return l.message.includes('[Realtime DOM]');
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden select-none">
      {/* Top Toolbar */}
      <div className="h-11 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3 text-xs">
          <span className="flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live Interactive Runtime</span>
          </span>

          {realtimeCount > 0 && (
            <span className="flex items-center space-x-1 px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-full font-mono text-[11px]">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>{realtimeCount} dynamic object{realtimeCount > 1 ? 's' : ''} added via JS</span>
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {onUpdateProject && realtimeCount > 0 && (
            <button
              onClick={handleSyncToCanvas}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                syncSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
              }`}
              title="Sync dynamically created JS objects back to Canvas and DOM tree"
            >
              {syncSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Synced to Canvas!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Sync Objects to Canvas</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={handleRestart}
            className="flex items-center space-x-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition cursor-pointer"
            title="Restart live runtime"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart</span>
          </button>

          <button
            onClick={() => openPreviewInNewWindow(project)}
            className="flex items-center space-x-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition cursor-pointer"
            title="Open in new browser tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in Tab</span>
          </button>
        </div>
      </div>

      {/* Sandboxed Interactive App IFrame */}
      <div className="flex-1 bg-slate-900 overflow-hidden relative">
        <iframe
          ref={iframeRef}
          key={key}
          srcDoc={sandboxedHtml}
          title="App Live Sandbox Preview"
          sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
          className="w-full h-full border-none bg-slate-900"
        />
      </div>

      {/* Collapsible Thread & Console Telemetry Panel */}
      <div
        style={{ height: isConsoleCollapsed ? '36px' : `${consoleHeight}px` }}
        className="bg-slate-950 border-t border-slate-800 flex flex-col shrink-0 transition-all duration-150"
      >
        {/* Console Header Bar */}
        <div className="h-9 bg-slate-900/90 px-3 flex items-center justify-between border-b border-slate-800 text-xs text-slate-300 shrink-0">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsConsoleCollapsed(!isConsoleCollapsed)}
              className="flex items-center space-x-1 font-semibold hover:text-white cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Interactive JS Terminal & Thread Telemetry</span>
              {isConsoleCollapsed ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {!isConsoleCollapsed && (
              <div className="flex items-center space-x-1 ml-4">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                    filterType === 'all'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({logs.length})
                </button>
                <button
                  onClick={() => setFilterType('realtime')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer flex items-center space-x-1 ${
                    filterType === 'realtime'
                      ? 'bg-indigo-950/70 text-indigo-300 border border-indigo-700/50'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>
                    DOM Objects ({logs.filter((l) => l.message.includes('[Realtime DOM]')).length})
                  </span>
                </button>
                <button
                  onClick={() => setFilterType('worker')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer flex items-center space-x-1 ${
                    filterType === 'worker'
                      ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Cpu className="w-3 h-3" />
                  <span>
                    Workers ({logs.filter((l) => l.type === 'worker-in' || l.type === 'worker-out').length})
                  </span>
                </button>
                <button
                  onClick={() => setFilterType('error')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                    filterType === 'error'
                      ? 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Errors ({logs.filter((l) => l.type === 'error').length})
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setLogs([])}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 cursor-pointer"
              title="Clear console output"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Real-time JS Command Input Bar */}
        {!isConsoleCollapsed && (
          <div className="bg-slate-900 px-3 py-1.5 border-b border-slate-800 flex items-center gap-2">
            <div className="flex items-center text-indigo-400 font-mono text-xs font-bold shrink-0">
              <span>js &gt;</span>
            </div>
            <input
              type="text"
              value={jsInput}
              onChange={(e) => setJsInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  executeJs();
                }
              }}
              placeholder="Execute JS in realtime: e.g. addTask() or createUIObject('div', { className: 'p-3 bg-indigo-900 rounded-lg text-white', textContent: 'New Realtime Item' })"
              className="flex-1 bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1 text-xs text-slate-200 font-mono placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={() => executeJs()}
              className="flex items-center space-x-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition cursor-pointer shrink-0"
              title="Execute in sandbox (Enter)"
            >
              <Send className="w-3 h-3" />
              <span>Run</span>
            </button>

            {/* Quick action helper snippets */}
            <div className="hidden lg:flex items-center space-x-1 pl-2 border-l border-slate-800">
              <button
                onClick={() =>
                  executeJs(
                    `createUIObject('div', { className: 'p-3 bg-indigo-950 border border-indigo-700/60 rounded-xl text-xs text-indigo-200 shadow-md animate-fadeIn', textContent: 'Realtime JS Object #' + Math.floor(Math.random() * 1000) })`
                  )
                }
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded text-[10px] font-medium transition cursor-pointer flex items-center space-x-1"
                title="Add a custom styled card dynamically into the UI via JS"
              >
                <PlusCircle className="w-3 h-3" />
                <span>+ Object via JS</span>
              </button>

              {project.functions.map((fn) => (
                <button
                  key={fn.id}
                  onClick={() => executeJs(`${fn.name}()`)}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[10px] font-mono transition cursor-pointer"
                  title={`Call ${fn.name}()`}
                >
                  {fn.name}()
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Log Stream */}
        {!isConsoleCollapsed && (
          <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] space-y-1 bg-slate-950">
            {filteredLogs.length === 0 ? (
              <div className="text-slate-600 italic py-3 text-center">
                Console output, Web Worker messages, and real-time DOM creations will appear here.
              </div>
            ) : (
              filteredLogs.map((log) => {
                let badgeColor = 'bg-slate-800 text-slate-400';
                let textColor = 'text-slate-300';
                let label = log.type;

                if (log.message.includes('[Realtime DOM]')) {
                  badgeColor = 'bg-indigo-950 text-indigo-300 border border-indigo-800/50';
                  textColor = 'text-indigo-200 font-semibold';
                  label = 'Realtime UI';
                } else if (log.type === 'worker-in') {
                  badgeColor = 'bg-cyan-950 text-cyan-400 border border-cyan-800/40';
                  textColor = 'text-cyan-300 font-semibold';
                  label = 'Main -> Worker';
                } else if (log.type === 'worker-out') {
                  badgeColor = 'bg-emerald-950 text-emerald-400 border border-emerald-800/40';
                  textColor = 'text-emerald-300 font-semibold';
                  label = 'Worker -> Main';
                } else if (log.type === 'error') {
                  badgeColor = 'bg-rose-950 text-rose-400 border border-rose-800/40';
                  textColor = 'text-rose-400';
                } else if (log.type === 'warn') {
                  badgeColor = 'bg-amber-950 text-amber-400 border border-amber-800/40';
                  textColor = 'text-amber-300';
                }

                return (
                  <div
                    key={log.id}
                    className="flex items-start space-x-2 py-0.5 hover:bg-slate-900/60 rounded px-1"
                  >
                    <span className="text-slate-600 shrink-0 select-none">[{log.timestamp}]</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-mono shrink-0 ${badgeColor}`}
                    >
                      {label}
                    </span>
                    <span className={`break-all ${textColor}`}>{log.message}</span>
                    {log.data && (
                      <span className="text-slate-400 font-mono text-[10px]">
                        {JSON.stringify(log.data)}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
