import React from 'react';
import { Plus, Trash2, Box, Code, Sparkles } from 'lucide-react';
import { ProjectClass, ClassMethod } from '../../types/logic';

interface ClassEditorProps {
  classes: ProjectClass[];
  onUpdateClasses: (classes: ProjectClass[]) => void;
}

export const ClassEditor: React.FC<ClassEditorProps> = ({
  classes,
  onUpdateClasses,
}) => {
  const [selectedClassId, setSelectedClassId] = React.useState<string | null>(
    classes[0]?.id || null
  );
  const [activeTab, setActiveTab] = React.useState<'methods' | 'properties' | 'constructor'>('methods');

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  const handleAddClass = () => {
    const newId = `class-${Date.now()}`;
    const newName = `CustomEngine${classes.length + 1}`;
    const newClass: ProjectClass = {
      id: newId,
      name: newName,
      instanceName: newName.toLowerCase(),
      constructorParams: [],
      constructorCode: `this.counter = 0;\nthis.active = false;`,
      properties: [
        { name: 'counter', type: 'number', initialValue: 0 },
        { name: 'active', type: 'boolean', initialValue: false },
      ],
      methods: [
        {
          id: `meth-${Date.now()}`,
          name: 'startProcess',
          params: [],
          code: `this.active = true;\nthis.counter++;\nconsole.log('[${newName}] process started, count =', this.counter);`,
          description: 'Starts background process',
        },
      ],
      description: 'ES6 Class Controller',
    };
    onUpdateClasses([...classes, newClass]);
    setSelectedClassId(newId);
  };

  const handleDeleteClass = (id: string) => {
    const next = classes.filter((c) => c.id !== id);
    onUpdateClasses(next);
    if (selectedClassId === id) {
      setSelectedClassId(next[0]?.id || null);
    }
  };

  const handleUpdateCurrentClass = (field: keyof ProjectClass, val: any) => {
    if (!selectedClassId) return;
    const updated = classes.map((c) => {
      if (c.id === selectedClassId) {
        return { ...c, [field]: val };
      }
      return c;
    });
    onUpdateClasses(updated);
  };

  const handleAddMethod = () => {
    if (!selectedClass) return;
    const newMethod: ClassMethod = {
      id: `meth-${Date.now()}`,
      name: `action${selectedClass.methods.length + 1}`,
      params: [],
      code: `console.log('Method invoked on ${selectedClass.name}');`,
      description: 'Custom class method',
    };
    handleUpdateCurrentClass('methods', [...selectedClass.methods, newMethod]);
  };

  const handleDeleteMethod = (methodId: string) => {
    if (!selectedClass) return;
    const filtered = selectedClass.methods.filter((m) => m.id !== methodId);
    handleUpdateCurrentClass('methods', filtered);
  };

  const handleUpdateMethod = (methodId: string, field: keyof ClassMethod, val: any) => {
    if (!selectedClass) return;
    const updated = selectedClass.methods.map((m) => {
      if (m.id === methodId) {
        return { ...m, [field]: val };
      }
      return m;
    });
    handleUpdateCurrentClass('methods', updated);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 h-full gap-4 p-4 text-xs">
      {/* Class List */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-2 font-semibold text-slate-200">
            <Box className="w-4 h-4 text-purple-400" />
            <span>ES6 Classes ({classes.length})</span>
          </div>
          <button
            onClick={handleAddClass}
            className="flex items-center space-x-1 px-2.5 py-1 bg-purple-600/80 hover:bg-purple-600 text-white rounded-lg text-[11px] font-medium transition cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>New</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {classes.map((c) => {
            const isSelected = c.id === selectedClassId;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedClassId(c.id)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition ${
                  isSelected
                    ? 'bg-purple-600/20 border border-purple-500/40 text-white'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="truncate">
                  <span className="font-mono text-purple-400 font-semibold">{c.name}</span>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5 font-mono">
                    instance: classes.{c.instanceName} ({c.methods.length} methods)
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Class Editor */}
      <div className="md:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
        {selectedClass ? (
          <div className="p-4 space-y-4 overflow-y-auto flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="font-mono text-purple-400">class {selectedClass.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono">
                    Instance: {selectedClass.instanceName}
                  </span>
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Point UI elements to call methods on <code className="text-purple-300">classes.{selectedClass.instanceName}.method()</code>.
                </p>
              </div>
              <button
                onClick={() => handleDeleteClass(selectedClass.id)}
                className="p-2 text-rose-400 hover:bg-rose-950/40 border border-rose-800/40 rounded-lg transition cursor-pointer"
                title="Delete class"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Class Name</label>
                <input
                  type="text"
                  value={selectedClass.name}
                  onChange={(e) =>
                    handleUpdateCurrentClass(
                      'name',
                      e.target.value.replace(/[^a-zA-Z0-9_$]/g, '')
                    )
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Instance Variable Name</label>
                <input
                  type="text"
                  value={selectedClass.instanceName}
                  onChange={(e) =>
                    handleUpdateCurrentClass(
                      'instanceName',
                      e.target.value.replace(/[^a-zA-Z0-9_$]/g, '')
                    )
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Sub-tabs: Methods vs Constructor */}
            <div className="flex border-b border-slate-800">
              <button
                onClick={() => setActiveTab('methods')}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
                  activeTab === 'methods'
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Methods ({selectedClass.methods.length})
              </button>
              <button
                onClick={() => setActiveTab('constructor')}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition ${
                  activeTab === 'constructor'
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Constructor & Properties
              </button>
            </div>

            {activeTab === 'methods' ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs font-medium">Class Methods</span>
                  <button
                    onClick={handleAddMethod}
                    className="flex items-center space-x-1 px-2 py-1 bg-purple-600/60 hover:bg-purple-600 text-white rounded text-[11px] font-medium transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Method</span>
                  </button>
                </div>

                {selectedClass.methods.map((meth) => (
                  <div
                    key={meth.id}
                    className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-purple-400 font-bold">{meth.name}</span>
                        <span className="text-[10px] text-slate-500">
                          ({meth.params.join(', ')})
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteMethod(meth.id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="Delete method"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Method Name</label>
                        <input
                          type="text"
                          value={meth.name}
                          onChange={(e) =>
                            handleUpdateMethod(
                              meth.id,
                              'name',
                              e.target.value.replace(/[^a-zA-Z0-9_$]/g, '')
                            )
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white font-mono text-xs focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Parameters</label>
                        <input
                          type="text"
                          value={meth.params.join(', ')}
                          onChange={(e) =>
                            handleUpdateMethod(
                              meth.id,
                              'params',
                              e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                            )
                          }
                          placeholder="p1, p2"
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white font-mono text-xs focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 block">Method Body Code</label>
                      <textarea
                        value={meth.code}
                        onChange={(e) => handleUpdateMethod(meth.id, 'code', e.target.value)}
                        rows={4}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 font-mono text-xs focus:border-purple-500 focus:outline-none resize-none leading-relaxed"
                        spellCheck={false}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    Constructor Parameters
                  </label>
                  <input
                    type="text"
                    value={selectedClass.constructorParams.join(', ')}
                    onChange={(e) =>
                      handleUpdateCurrentClass(
                        'constructorParams',
                        e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                      )
                    }
                    placeholder="e.g. initialTotal, options"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Constructor Body Code</label>
                  <textarea
                    value={selectedClass.constructorCode}
                    onChange={(e) => handleUpdateCurrentClass('constructorCode', e.target.value)}
                    rows={6}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 font-mono text-xs focus:border-purple-500 focus:outline-none resize-none leading-relaxed"
                    spellCheck={false}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8">
            <Box className="w-8 h-8 mb-2 opacity-40" />
            <p>Select a class on the left or create a new one.</p>
          </div>
        )}
      </div>
    </div>
  );
};
