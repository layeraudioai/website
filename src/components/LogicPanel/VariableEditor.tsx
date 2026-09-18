import React from 'react';
import { Plus, Trash2, Database, Hash, AlignLeft, ToggleLeft, Braces } from 'lucide-react';
import { StateVariable } from '../../types/logic';

interface VariableEditorProps {
  variables: StateVariable[];
  onUpdateVariables: (variables: StateVariable[]) => void;
}

export const VariableEditor: React.FC<VariableEditorProps> = ({
  variables,
  onUpdateVariables,
}) => {
  const [selectedVarId, setSelectedVarId] = React.useState<string | null>(
    variables[0]?.id || null
  );

  const selectedVar = variables.find((v) => v.id === selectedVarId);

  const handleAddVariable = () => {
    const newId = `var-${Date.now()}`;
    const newVar: StateVariable = {
      id: newId,
      name: `newVariable${variables.length + 1}`,
      type: 'string',
      value: 'Sample value',
      defaultValue: 'Sample value',
      description: 'Custom state variable',
    };
    onUpdateVariables([...variables, newVar]);
    setSelectedVarId(newId);
  };

  const handleDeleteVariable = (id: string) => {
    const next = variables.filter((v) => v.id !== id);
    onUpdateVariables(next);
    if (selectedVarId === id) {
      setSelectedVarId(next[0]?.id || null);
    }
  };

  const handleUpdateCurrentVar = (field: keyof StateVariable, val: any) => {
    if (!selectedVarId) return;
    const updated = variables.map((v) => {
      if (v.id === selectedVarId) {
        return { ...v, [field]: val };
      }
      return v;
    });
    onUpdateVariables(updated);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 h-full gap-4 p-4 text-xs">
      {/* Variable List */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-2 font-semibold text-slate-200">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Value Variables ({variables.length})</span>
          </div>
          <button
            onClick={handleAddVariable}
            className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-medium transition cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>New</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {variables.map((v) => {
            const isSelected = v.id === selectedVarId;
            return (
              <div
                key={v.id}
                onClick={() => setSelectedVarId(v.id)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition ${
                  isSelected
                    ? 'bg-emerald-600/20 border border-emerald-500/40 text-white'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <span className="font-mono text-emerald-400 font-semibold">{v.name}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
                    {v.type}
                  </span>
                </div>
                <div className="text-slate-400 font-mono text-[11px] truncate max-w-[80px]">
                  {String(v.value)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Variable Details & Live Inspection */}
      <div className="md:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
        {selectedVar ? (
          <div className="p-4 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="font-mono text-emerald-400">{selectedVar.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    Reactive State
                  </span>
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Point UI object fields and element text to this variable.
                </p>
              </div>
              <button
                onClick={() => handleDeleteVariable(selectedVar.id)}
                className="p-2 text-rose-400 hover:bg-rose-950/40 border border-rose-800/40 rounded-lg transition cursor-pointer"
                title="Delete variable"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Variable Name (identifier)</label>
                <input
                  type="text"
                  value={selectedVar.name}
                  onChange={(e) =>
                    handleUpdateCurrentVar(
                      'name',
                      e.target.value.replace(/[^a-zA-Z0-9_$]/g, '')
                    )
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Data Type</label>
                <select
                  value={selectedVar.type}
                  onChange={(e) =>
                    handleUpdateCurrentVar('type', e.target.value as any)
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                  <option value="object">Object (JSON)</option>
                  <option value="array">Array</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Default / Initial Value</label>
              <input
                type="text"
                value={
                  typeof selectedVar.defaultValue === 'object'
                    ? JSON.stringify(selectedVar.defaultValue)
                    : String(selectedVar.defaultValue)
                }
                onChange={(e) => {
                  let parsed: any = e.target.value;
                  if (selectedVar.type === 'number') parsed = Number(e.target.value) || 0;
                  if (selectedVar.type === 'boolean') parsed = e.target.value === 'true';
                  handleUpdateCurrentVar('defaultValue', parsed);
                  handleUpdateCurrentVar('value', parsed);
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Description</label>
              <input
                type="text"
                value={selectedVar.description || ''}
                onChange={(e) => handleUpdateCurrentVar('description', e.target.value)}
                placeholder="What does this variable track?"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Quick Live Modifier */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 mt-2">
              <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
                <span>Live State Simulator (Instant Test)</span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  Current: {String(selectedVar.value)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={String(selectedVar.value)}
                  onChange={(e) => {
                    let val: any = e.target.value;
                    if (selectedVar.type === 'number') val = Number(e.target.value) || 0;
                    if (selectedVar.type === 'boolean') val = e.target.value === 'true';
                    handleUpdateCurrentVar('value', val);
                  }}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                />
                {selectedVar.type === 'number' && (
                  <>
                    <button
                      onClick={() =>
                        handleUpdateCurrentVar('value', (Number(selectedVar.value) || 0) + 1)
                      }
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-mono"
                    >
                      +1
                    </button>
                    <button
                      onClick={() =>
                        handleUpdateCurrentVar('value', (Number(selectedVar.value) || 0) - 1)
                      }
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-mono"
                    >
                      -1
                    </button>
                  </>
                )}
                {selectedVar.type === 'boolean' && (
                  <button
                    onClick={() => handleUpdateCurrentVar('value', !selectedVar.value)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
                  >
                    Toggle
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8">
            <Database className="w-8 h-8 mb-2 opacity-40" />
            <p>Select a variable on the left or create a new one.</p>
          </div>
        )}
      </div>
    </div>
  );
};
