import React from 'react';
import { Plus, Trash2, Cpu, Send, CheckCircle2, AlertCircle, Play } from 'lucide-react';
import { ProjectWorker } from '../../types/logic';

interface WorkerEditorProps {
  workers: ProjectWorker[];
  onUpdateWorkers: (workers: ProjectWorker[]) => void;
}

export const WorkerEditor: React.FC<WorkerEditorProps> = ({
  workers,
  onUpdateWorkers,
}) => {
  const [selectedWorkerId, setSelectedWorkerId] = React.useState<string | null>(
    workers[0]?.id || null
  );
  const [testPayload, setTestPayload] = React.useState<string>('{"command": "sievePrimes", "max": 200000}');
  const [testLog, setTestLog] = React.useState<{ time: string; msg: string; type: string }[]>([]);
  const [isTesting, setIsTesting] = React.useState(false);

  const selectedWorker = workers.find((w) => w.id === selectedWorkerId);

  const handleAddWorker = () => {
    const newId = `worker-${Date.now()}`;
    const newName = `computeThread${workers.length + 1}`;
    const newWorker: ProjectWorker = {
      id: newId,
      name: newName,
      instanceName: newName,
      description: 'Dedicated Web Worker background thread',
      scriptCode: `// Dedicated Web Worker thread script
self.onmessage = function(e) {
  const data = e.data;
  console.log('[Worker Thread] Received message:', data);

  // Perform background computation here
  const startTime = performance.now();
  let result = 0;
  for (let i = 0; i < 1000000; i++) {
    result += Math.sqrt(i);
  }
  const duration = performance.now() - startTime;

  // Post result back to main thread
  self.postMessage({
    status: 'done',
    result: Math.round(result),
    durationMs: duration
  });
};`,
      onMessageCode: `// Handler executed in main thread when worker posts message back
const res = event.data;
console.log('Main thread received from worker:', res);
if (res.status === 'done') {
  state.threadStatus = 'Computation Complete';
}`,
      autoStart: true,
    };
    onUpdateWorkers([...workers, newWorker]);
    setSelectedWorkerId(newId);
  };

  const handleDeleteWorker = (id: string) => {
    const next = workers.filter((w) => w.id !== id);
    onUpdateWorkers(next);
    if (selectedWorkerId === id) {
      setSelectedWorkerId(next[0]?.id || null);
    }
  };

  const handleUpdateCurrentWorker = (field: keyof ProjectWorker, val: any) => {
    if (!selectedWorkerId) return;
    const updated = workers.map((w) => {
      if (w.id === selectedWorkerId) {
        return { ...w, [field]: val };
      }
      return w;
    });
    onUpdateWorkers(updated);
  };

  const handleRunLiveWorkerTest = () => {
    if (!selectedWorker) return;
    try {
      setIsTesting(true);
      const parsedData = JSON.parse(testPayload);
      const blob = new Blob([selectedWorker.scriptCode], { type: 'application/javascript' });
      const workerInstance = new Worker(URL.createObjectURL(blob));

      const startTime = performance.now();
      setTestLog((prev) => [
        {
          time: new Date().toLocaleTimeString(),
          type: 'info',
          msg: `Dispatched message to background thread [${selectedWorker.name}]`,
        },
        ...prev,
      ]);

      workerInstance.onmessage = (e) => {
        const elapsed = (performance.now() - startTime).toFixed(1);
        setTestLog((prev) => [
          {
            time: new Date().toLocaleTimeString(),
            type: 'success',
            msg: `Thread response in ${elapsed}ms: ${JSON.stringify(e.data)}`,
          },
          ...prev,
        ]);
        setIsTesting(false);
        workerInstance.terminate();
      };

      workerInstance.onerror = (err) => {
        setTestLog((prev) => [
          {
            time: new Date().toLocaleTimeString(),
            type: 'error',
            msg: `Worker thread error: ${err.message}`,
          },
          ...prev,
        ]);
        setIsTesting(false);
        workerInstance.terminate();
      };

      workerInstance.postMessage(parsedData);
    } catch (err: any) {
      setTestLog((prev) => [
        {
          time: new Date().toLocaleTimeString(),
          type: 'error',
          msg: `Payload parse error: ${err.message}`,
        },
        ...prev,
      ]);
      setIsTesting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 h-full gap-4 p-4 text-xs">
      {/* Worker List */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-2 font-semibold text-slate-200">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Web Workers ({workers.length})</span>
          </div>
          <button
            onClick={handleAddWorker}
            className="flex items-center space-x-1 px-2.5 py-1 bg-cyan-600/80 hover:bg-cyan-600 text-white rounded-lg text-[11px] font-medium transition cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>New Thread</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {workers.map((w) => {
            const isSelected = w.id === selectedWorkerId;
            return (
              <div
                key={w.id}
                onClick={() => setSelectedWorkerId(w.id)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition ${
                  isSelected
                    ? 'bg-cyan-600/20 border border-cyan-500/40 text-white'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="truncate">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span className="font-mono text-cyan-300 font-semibold">{w.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    instance: workers.{w.instanceName}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Worker Thread Script & Handler Editor */}
      <div className="md:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
        {selectedWorker ? (
          <div className="p-4 space-y-4 overflow-y-auto flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="font-mono text-cyan-400">{selectedWorker.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    Background Thread (Web Worker)
                  </span>
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Point UI click/input events to <code className="text-cyan-300">workers.{selectedWorker.instanceName}.postMessage(...)</code>.
                </p>
              </div>
              <button
                onClick={() => handleDeleteWorker(selectedWorker.id)}
                className="p-2 text-rose-400 hover:bg-rose-950/40 border border-rose-800/40 rounded-lg transition cursor-pointer"
                title="Delete worker"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Worker Identifier</label>
                <input
                  type="text"
                  value={selectedWorker.name}
                  onChange={(e) =>
                    handleUpdateCurrentWorker(
                      'name',
                      e.target.value.replace(/[^a-zA-Z0-9_$]/g, '')
                    )
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Instance Name (in JS)</label>
                <input
                  type="text"
                  value={selectedWorker.instanceName}
                  onChange={(e) =>
                    handleUpdateCurrentWorker(
                      'instanceName',
                      e.target.value.replace(/[^a-zA-Z0-9_$]/g, '')
                    )
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Worker Code */}
            <div className="space-y-1 flex-1 flex flex-col">
              <div className="flex justify-between items-center">
                <label className="text-slate-300 font-medium">
                  Thread Script Code (Executes in Web Worker Thread)
                </label>
                <span className="text-[10px] text-cyan-400 font-mono">
                  self.onmessage = fn; self.postMessage(data);
                </span>
              </div>
              <textarea
                value={selectedWorker.scriptCode}
                onChange={(e) => handleUpdateCurrentWorker('scriptCode', e.target.value)}
                rows={9}
                className="w-full flex-1 bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 font-mono text-xs focus:border-cyan-500 focus:outline-none leading-relaxed resize-none"
                spellCheck={false}
              />
            </div>

            {/* Main Thread OnMessage Handler */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-slate-300 font-medium">
                  Main Thread Response Handler (When Worker sends message back)
                </label>
                <span className="text-[10px] text-emerald-400 font-mono">
                  event.data • state.x = ...
                </span>
              </div>
              <textarea
                value={selectedWorker.onMessageCode}
                onChange={(e) => handleUpdateCurrentWorker('onMessageCode', e.target.value)}
                rows={4}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 font-mono text-xs focus:border-cyan-500 focus:outline-none leading-relaxed resize-none"
                spellCheck={false}
              />
            </div>

            {/* Live Thread Dispatch Tester */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">
                  Live Background Thread Sandbox Test
                </span>
                <button
                  onClick={handleRunLiveWorkerTest}
                  disabled={isTesting}
                  className="flex items-center space-x-1 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium text-xs transition cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3 h-3" />
                  <span>{isTesting ? 'Thread Computing...' : 'Dispatch Message'}</span>
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={testPayload}
                  onChange={(e) => setTestPayload(e.target.value)}
                  placeholder='JSON payload e.g. {"max": 10000}'
                  className="flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              {testLog.length > 0 && (
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 max-h-24 overflow-y-auto space-y-1 font-mono text-[11px]">
                  {testLog.map((l, i) => (
                    <div
                      key={i}
                      className={`truncate ${
                        l.type === 'success'
                          ? 'text-emerald-400'
                          : l.type === 'error'
                          ? 'text-rose-400'
                          : 'text-slate-400'
                      }`}
                    >
                      [{l.time}] {l.msg}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8">
            <Cpu className="w-8 h-8 mb-2 opacity-40" />
            <p>Select a worker thread on the left or create a new one.</p>
          </div>
        )}
      </div>
    </div>
  );
};
