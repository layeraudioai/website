import React from 'react';
import { Plus, Trash2, Zap, Play, Terminal } from 'lucide-react';
import { ProjectFunction } from '../../types/logic';

interface FunctionEditorProps {
  functions: ProjectFunction[];
  onUpdateFunctions: (functions: ProjectFunction[]) => void;
}

export const FunctionEditor: React.FC<FunctionEditorProps> = ({
  functions,
  onUpdateFunctions,
}) => {
  const [selectedFuncId, setSelectedFuncId] = React.useState<string | null>(
    functions[0]?.id || null
  );
  const [executionOutput, setExecutionOutput] = React.useState<string | null>(null);

  const selectedFunc = functions.find((f) => f.id === selectedFuncId);

  const handleAddFunction = () => {
    const newId = `func-${Date.now()}`;
    const newFunc: ProjectFunction = {
      id: newId,
      name: `customHandler${functions.length + 1}`,
      params: ['event'],
      code: `// Function body
console.log('Executed handler');
state.count = (state.count || 0) + 1;`,
      description: 'Custom event handler function',
    };
    onUpdateFunctions([...functions, newFunc]);
    setSelectedFuncId(newId);
  };

  const handleDeleteFunction = (id: string) => {
    const next = functions.filter((f) => f.id !== id);
    onUpdateFunctions(next);
    if (selectedFuncId === id) {
      setSelectedFuncId(next[0]?.id || null);
    }
  };

  const handleUpdateCurrentFunc = (field: keyof ProjectFunction, val: any) => {
    if (!selectedFuncId) return;
    const updated = functions.map((f) => {
      if (f.id === selectedFuncId) {
        return { ...f, [field]: val };
      }
      return f;
    });
    onUpdateFunctions(updated);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 h-full gap-4 p-4 text-xs">
      {/* Function List */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-2 font-semibold text-slate-200">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Functions ({functions.length})</span>
          </div>
          <button
            onClick={handleAddFunction}
            className="flex items-center space-x-1 px-2.5 py-1 bg-amber-600/80 hover:bg-amber-600 text-white rounded-lg text-[11px] font-medium transition cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>New</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {functions.map((f) => {
            const isSelected = f.id === selectedFuncId;
            return (
              <div
                key={f.id}
                onClick={() => {
                  setSelectedFuncId(f.id);
                  setExecutionOutput(null);
                }}
                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition ${
                  isSelected
                    ? 'bg-amber-600/20 border border-amber-500/40 text-white'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="truncate">
                  <span className="font-mono text-amber-400 font-semibold">{f.name}()</span>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    ({f.params.join(', ') || 'no params'})
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Function Editor & Body */}
      <div className="md:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
        {selectedFunc ? (
          <div className="p-4 space-y-4 overflow-y-auto flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="font-mono text-amber-400">{selectedFunc.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
                    function ({selectedFunc.params.join(', ')})
                  </span>
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Point UI click, change, input, or submit events to this function.
                </p>
              </div>
              <button
                onClick={() => handleDeleteFunction(selectedFunc.id)}
                className="p-2 text-rose-400 hover:bg-rose-950/40 border border-rose-800/40 rounded-lg transition cursor-pointer"
                title="Delete function"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Function Name</label>
                <input
                  type="text"
                  value={selectedFunc.name}
                  onChange={(e) =>
                    handleUpdateCurrentFunc(
                      'name',
                      e.target.value.replace(/[^a-zA-Z0-9_$]/g, '')
                    )
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  Parameters (comma separated)
                </label>
                <input
                  type="text"
                  value={selectedFunc.params.join(', ')}
                  onChange={(e) =>
                    handleUpdateCurrentFunc(
                      'params',
                      e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                    )
                  }
                  placeholder="e.g. event, delta"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Scope Help Chips */}
            <div className="flex flex-wrap gap-2 text-[11px] text-slate-400 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
              <span className="font-semibold text-slate-300">Available Scope Objects:</span>
              <span className="font-mono text-emerald-400">state.myVar</span>
              <span className="font-mono text-purple-400">classes.myInstance.method()</span>
              <span className="font-mono text-cyan-400">workers.myWorker.postMessage(...)</span>
            </div>

            <div className="flex-1 flex flex-col">
              <label className="block text-slate-400 mb-1 font-medium">Function Body Code (JavaScript)</label>
              <textarea
                value={selectedFunc.code}
                onChange={(e) => handleUpdateCurrentFunc('code', e.target.value)}
                rows={10}
                className="w-full flex-1 bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 font-mono text-xs focus:border-amber-500 focus:outline-none leading-relaxed resize-none"
                spellCheck={false}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8">
            <Zap className="w-8 h-8 mb-2 opacity-40" />
            <p>Select a function on the left or create a new one.</p>
          </div>
        )}
      </div>
    </div>
  );
};
