import React from 'react';
import {
  Link,
  Zap,
  Cpu,
  Box,
  Database,
  Trash2,
  Plus,
  Play,
  CheckCircle2,
  ChevronRight,
  Crosshair,
} from 'lucide-react';
import { VisualElement, EventBinding, AttributeBinding, TextBinding } from '../../types/editor';
import { ProjectData } from '../../types/logic';

interface BindingInspectorProps {
  element: VisualElement;
  project: ProjectData;
  onUpdateElement: (updated: VisualElement) => void;
}

export const BindingInspector: React.FC<BindingInspectorProps> = ({
  element,
  project,
  onUpdateElement,
}) => {
  const bindings = element.bindings || {};

  // Text binding updates
  const handleSetTextBinding = (targetId: string, sourceType: TextBinding['sourceType']) => {
    if (!targetId) {
      const next = { ...bindings };
      delete next.textBinding;
      onUpdateElement({ ...element, bindings: next });
      return;
    }

    onUpdateElement({
      ...element,
      bindings: {
        ...bindings,
        textBinding: {
          sourceType,
          targetId,
          format: 'raw',
        },
      },
    });
  };

  const handleRemoveTextBinding = () => {
    const next = { ...bindings };
    delete next.textBinding;
    onUpdateElement({ ...element, bindings: next });
  };

  // Attribute bindings
  const handleAddAttrBinding = () => {
    const newBinding: AttributeBinding = {
      id: `ab-${Date.now()}`,
      attributeName: element.tag === 'input' ? 'value' : 'style.backgroundColor',
      sourceType: 'variable',
      targetId: project.variables[0]?.name || '',
    };
    const next = [...(bindings.attributeBindings || []), newBinding];
    onUpdateElement({
      ...element,
      bindings: { ...bindings, attributeBindings: next },
    });
  };

  const handleUpdateAttrBinding = (id: string, field: keyof AttributeBinding, val: any) => {
    const next = (bindings.attributeBindings || []).map((b) => {
      if (b.id === id) return { ...b, [field]: val };
      return b;
    });
    onUpdateElement({
      ...element,
      bindings: { ...bindings, attributeBindings: next },
    });
  };

  const handleRemoveAttrBinding = (id: string) => {
    const next = (bindings.attributeBindings || []).filter((b) => b.id !== id);
    onUpdateElement({
      ...element,
      bindings: { ...bindings, attributeBindings: next },
    });
  };

  // Event bindings
  const handleAddEventBinding = () => {
    const newEvent: EventBinding = {
      id: `eb-${Date.now()}`,
      eventName: element.tag === 'input' ? 'input' : 'click',
      actionType: 'callFunction',
      targetId: project.functions[0]?.name || '',
      payloadExpr: '',
    };
    const next = [...(bindings.eventBindings || []), newEvent];
    onUpdateElement({
      ...element,
      bindings: { ...bindings, eventBindings: next },
    });
  };

  const handleUpdateEventBinding = (id: string, field: keyof EventBinding, val: any) => {
    const next = (bindings.eventBindings || []).map((b) => {
      if (b.id === id) return { ...b, [field]: val };
      return b;
    });
    onUpdateElement({
      ...element,
      bindings: { ...bindings, eventBindings: next },
    });
  };

  const handleRemoveEventBinding = (id: string) => {
    const next = (bindings.eventBindings || []).filter((b) => b.id !== id);
    onUpdateElement({
      ...element,
      bindings: { ...bindings, eventBindings: next },
    });
  };

  return (
    <div className="space-y-6 text-xs select-none">
      {/* Visual Pointer Callout */}
      <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3">
        <div className="flex items-center space-x-2 text-indigo-300 font-semibold mb-1">
          <Crosshair className="w-4 h-4 text-indigo-400" />
          <span>Point Object & Fields to Logic</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          Connect this element's text, attributes, and user interactions to reactive variables, functions, ES6 classes, or Web Worker background threads.
        </p>
      </div>

      {/* 1. Text Content Pointing */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 font-semibold text-slate-200">
            <Link className="w-3.5 h-3.5 text-emerald-400" />
            <span>Point Text Content to Variable</span>
          </div>
          {bindings.textBinding && (
            <button
              onClick={handleRemoveTextBinding}
              className="text-[10px] text-rose-400 hover:text-rose-300 transition"
            >
              Unlink
            </button>
          )}
        </div>

        {bindings.textBinding ? (
          <div className="space-y-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="text-emerald-400 font-mono font-semibold">
                state.{bindings.textBinding.targetId}
              </span>
              <span className="text-[10px] text-slate-500">
                ({project.variables.find((v) => v.name === bindings.textBinding?.targetId)?.type || 'var'})
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Target Variable</label>
                <select
                  value={bindings.textBinding.targetId}
                  onChange={(e) => handleSetTextBinding(e.target.value, 'variable')}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                >
                  {project.variables.map((v) => (
                    <option key={v.id} value={v.name}>
                      state.{v.name} ({v.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Format</label>
                <select
                  value={bindings.textBinding.format || 'raw'}
                  onChange={(e) => {
                    if (bindings.textBinding) {
                      onUpdateElement({
                        ...element,
                        bindings: {
                          ...bindings,
                          textBinding: {
                            ...bindings.textBinding,
                            format: e.target.value as any,
                          },
                        },
                      });
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs focus:border-emerald-500 focus:outline-none"
                >
                  <option value="raw">Raw Value</option>
                  <option value="number">Number</option>
                  <option value="currency">Currency ($)</option>
                  <option value="uppercase">UPPERCASE</option>
                </select>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[11px] text-slate-400">
              Select a state variable to automatically update this element's text:
            </p>
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) handleSetTextBinding(e.target.value, 'variable');
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
            >
              <option value="" disabled>
                -- Choose Variable to Point to --
              </option>
              {project.variables.map((v) => (
                <option key={v.id} value={v.name}>
                  state.{v.name} (default: {String(v.defaultValue)})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 2. Point Attributes & Fields */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 font-semibold text-slate-200">
            <Box className="w-3.5 h-3.5 text-cyan-400" />
            <span>Point Field / Attribute to Variable</span>
          </div>
          <button
            onClick={handleAddAttrBinding}
            className="flex items-center space-x-1 px-2 py-0.5 bg-cyan-600/70 hover:bg-cyan-600 text-white rounded text-[10px] font-medium transition cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Add Binding</span>
          </button>
        </div>

        {bindings.attributeBindings && bindings.attributeBindings.length > 0 ? (
          <div className="space-y-2">
            {bindings.attributeBindings.map((ab) => (
              <div
                key={ab.id}
                className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-cyan-300 font-semibold text-[11px]">
                    {ab.attributeName} &larr; state.{ab.targetId}
                  </span>
                  <button
                    onClick={() => handleRemoveAttrBinding(ab.id)}
                    className="text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Field / Attribute</label>
                    <select
                      value={ab.attributeName}
                      onChange={(e) => handleUpdateAttrBinding(ab.id, 'attributeName', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs font-mono"
                    >
                      <option value="value">value (input/form)</option>
                      <option value="disabled">disabled</option>
                      <option value="placeholder">placeholder</option>
                      <option value="src">src (image)</option>
                      <option value="href">href (link)</option>
                      <option value="style.width">style.width</option>
                      <option value="style.backgroundColor">style.backgroundColor</option>
                      <option value="style.color">style.color</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Point to Variable</label>
                    <select
                      value={ab.targetId}
                      onChange={(e) => handleUpdateAttrBinding(ab.id, 'targetId', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs font-mono"
                    >
                      {project.variables.map((v) => (
                        <option key={v.id} value={v.name}>
                          state.{v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-slate-500 italic">
            No attribute bindings. Click "+ Add Binding" to point value, disabled, or style attributes to variables.
          </p>
        )}
      </div>

      {/* 3. Point Events (Functions, Classes, Web Workers) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 font-semibold text-slate-200">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Point Events (Triggers & Actions)</span>
          </div>
          <button
            onClick={handleAddEventBinding}
            className="flex items-center space-x-1 px-2 py-0.5 bg-amber-600/70 hover:bg-amber-600 text-white rounded text-[10px] font-medium transition cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Add Event</span>
          </button>
        </div>

        {bindings.eventBindings && bindings.eventBindings.length > 0 ? (
          <div className="space-y-3">
            {bindings.eventBindings.map((eb) => (
              <div
                key={eb.id}
                className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-400 font-mono font-semibold">
                      on{eb.eventName}
                    </span>
                    <ChevronRight className="w-3 h-3 text-slate-600" />
                    <span className="font-mono text-slate-300 text-[11px]">
                      {eb.targetId}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveEventBinding(eb.id)}
                    className="text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Event Type</label>
                    <select
                      value={eb.eventName}
                      onChange={(e) => handleUpdateEventBinding(eb.id, 'eventName', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs font-mono"
                    >
                      <option value="click">click</option>
                      <option value="input">input (real-time)</option>
                      <option value="change">change</option>
                      <option value="submit">submit</option>
                      <option value="mouseenter">mouseenter</option>
                      <option value="mouseleave">mouseleave</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Action Category</label>
                    <select
                      value={eb.actionType}
                      onChange={(e) => {
                        const newAction = e.target.value as any;
                        let defaultTarget = '';
                        if (newAction === 'callFunction') defaultTarget = project.functions[0]?.name || '';
                        else if (newAction === 'setVariable' || newAction === 'incrementVariable' || newAction === 'toggleVariable') defaultTarget = project.variables[0]?.name || '';
                        else if (newAction === 'invokeClassMethod') {
                          const cls = project.classes[0];
                          defaultTarget = cls ? `${cls.instanceName}.${cls.methods[0]?.name || 'run'}` : '';
                        } else if (newAction === 'postWorkerMessage') {
                          defaultTarget = project.workers[0]?.instanceName || '';
                        }
                        handleUpdateEventBinding(eb.id, 'actionType', newAction);
                        handleUpdateEventBinding(eb.id, 'targetId', defaultTarget);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                    >
                      <option value="callFunction">Call Function ⚡</option>
                      <option value="setVariable">Set Variable Value 📊</option>
                      <option value="incrementVariable">Increment Variable (+1) 🔢</option>
                      <option value="toggleVariable">Toggle Variable (boolean) 🔄</option>
                      <option value="invokeClassMethod">Invoke Class Method 🏛️</option>
                      <option value="postWorkerMessage">Post to Web Worker Thread 🧵</option>
                    </select>
                  </div>
                </div>

                {/* Target selector depending on actionType */}
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">
                    {eb.actionType === 'callFunction' && 'Point to Function'}
                    {eb.actionType === 'invokeClassMethod' && 'Point to Class Method'}
                    {eb.actionType === 'postWorkerMessage' && 'Point to Web Worker Thread'}
                    {['setVariable', 'incrementVariable', 'toggleVariable'].includes(eb.actionType) && 'Target Variable'}
                  </label>

                  {eb.actionType === 'callFunction' && (
                    <select
                      value={eb.targetId}
                      onChange={(e) => handleUpdateEventBinding(eb.id, 'targetId', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs focus:border-amber-500"
                    >
                      {project.functions.map((f) => (
                        <option key={f.id} value={f.name}>
                          {f.name}({f.params.join(', ')})
                        </option>
                      ))}
                    </select>
                  )}

                  {eb.actionType === 'invokeClassMethod' && (
                    <select
                      value={eb.targetId}
                      onChange={(e) => handleUpdateEventBinding(eb.id, 'targetId', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs focus:border-purple-500"
                    >
                      {project.classes.flatMap((c) =>
                        c.methods.map((m) => (
                          <option key={`${c.id}-${m.id}`} value={`${c.instanceName}.${m.name}`}>
                            classes.{c.instanceName}.{m.name}()
                          </option>
                        ))
                      )}
                    </select>
                  )}

                  {eb.actionType === 'postWorkerMessage' && (
                    <select
                      value={eb.targetId}
                      onChange={(e) => handleUpdateEventBinding(eb.id, 'targetId', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs focus:border-cyan-500"
                    >
                      {project.workers.map((w) => (
                        <option key={w.id} value={w.instanceName}>
                          workers.{w.instanceName} (Thread: {w.name})
                        </option>
                      ))}
                    </select>
                  )}

                  {['setVariable', 'incrementVariable', 'toggleVariable'].includes(eb.actionType) && (
                    <select
                      value={eb.targetId}
                      onChange={(e) => handleUpdateEventBinding(eb.id, 'targetId', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs focus:border-emerald-500"
                    >
                      {project.variables.map((v) => (
                        <option key={v.id} value={v.name}>
                          state.{v.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Expression / Arguments field */}
                {(eb.actionType === 'setVariable' ||
                  eb.actionType === 'callFunction' ||
                  eb.actionType === 'invokeClassMethod' ||
                  eb.actionType === 'postWorkerMessage') && (
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">
                      Argument Expression / Message Payload
                    </label>
                    <input
                      type="text"
                      value={eb.payloadExpr || ''}
                      onChange={(e) => handleUpdateEventBinding(eb.id, 'payloadExpr', e.target.value)}
                      placeholder={
                        eb.actionType === 'setVariable'
                          ? '$event.target.value'
                          : eb.actionType === 'postWorkerMessage'
                          ? '{ command: "start", max: state.maxNumber }'
                          : 'arguments e.g. 10, "active"'
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-slate-500 italic">
            No events pointed. Click "+ Add Event" to trigger functions, class methods, or background workers on click or input.
          </p>
        )}
      </div>
    </div>
  );
};
